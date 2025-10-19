"use client";
import React, { useEffect, useState } from "react";
import { useAppData, User, chat_service } from "@/context/AppContext";
import { SocketData } from "@/context/SocketContext";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import ChatSidebar from "@/components/ChatSidebar";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import axios from "axios";
import ChatHeader from "../../components/ChatHeader";
import ChatMessages from "../../components/ChatMessages";
import MessageInput from "../../components/MessageInput";

export interface Message {
  _id: string;
  chatId: string;
  sender: string;
  text: string;
  image?: {
    url: string;
    public_id: string;
  };
  messageType: "text" | "image";
  seen: boolean;
  seenAt?: string;
  createdAt: string;
}

const ChatApp = () => {
  const {
    loading,
    isAuth,
    logoutUser,
    chats,
    user: loggedInUser,
    users,
    fetchChats,
    setChats,
  } = useAppData();

  const { onlineUsers, socket } = SocketData();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  const router = useRouter();

  // ✅ Redirect to login if user not authenticated
  useEffect(() => {
    if (!isAuth && !loading) router.push("/login");
  }, [isAuth, loading, router]);

  const handleLogout = () => {
    logoutUser();
    router.push("/login");
  };

  // ✅ Fetch messages for selected chat
  async function fetchChat() {
    const token = Cookies.get("token");
    if (!selectedUser || !token) return;

    try {
      const { data } = await axios.post(
        `${chat_service}/api/v1/message/${selectedUser}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages(data.messages || []);
      setUser(data.user);
      await fetchChats();
    } catch (error) {
      console.log(error);
      toast.error("Failed to load messages");
    }
  }

  // ✅ Move active chat to top of sidebar
  const moveChatToTop = (
    chatId: string,
    newMessage: any,
    updateUnseen = true
  ) => {
    setChats((prev) => {
      if (!prev) return null;

      const updatedChats = [...prev];
      const chatIndex = updatedChats.findIndex((c) => c.chat._id === chatId);

      if (chatIndex !== -1) {
        const [movedChat] = updatedChats.splice(chatIndex, 1);
        const updatedChat = {
          ...movedChat,
          chat: {
            ...movedChat.chat,
            latestMessage: {
              text: newMessage.text,
              sender: newMessage.sender,
            },
            updatedAt: new Date().toString(),
            unseenCount:
              updateUnseen && newMessage.sender !== loggedInUser?._id
                ? (movedChat.chat.unseenCount || 0) + 1
                : movedChat.chat.unseenCount || 0,
          },
        };
        updatedChats.unshift(updatedChat);
      }
      return updatedChats;
    });
  };

  const resetUnseenCount = (chatId: string) => {
    setChats((prev) => {
      if (!prev) return null;
      return prev.map((chat) => {
        if (chat.chat._id === chatId) {
          return {
            ...chat,
            chat: { ...chat.chat, unseenCount: 0 },
          };
        }
        return chat;
      });
    });
  };

  // ✅ Create new chat if not exists
  async function createChat(u: User) {
    try {
      const token = Cookies.get("token");
      if (!token) return;

      const { data } = await axios.post(
        `${chat_service}/api/v1/chat/new`,
        {
          userId: loggedInUser?._id,
          otherUserId: u._id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSelectedUser(data.chatId);
      setShowAllUsers(false);
      await fetchChats();
      toast.success("Chat started successfully!");
    } catch (error) {
      console.log(error);
      toast.error("Failed to start chat");
    }
  }

  // ✅ Send message (text/image)
  const handleMessageSend = async (e: any, imageFile?: File | null) => {
    e.preventDefault();

    if (!message.trim() && !imageFile) return;
    if (!selectedUser) return;

    if (typingTimeout) clearTimeout(typingTimeout);

    socket?.emit("stopTyping", {
      chatId: selectedUser,
      userId: loggedInUser?._id,
    });

    const token = Cookies.get("token");
    if (!token) return;

    try {
      const formData = new FormData();
      formData.append("chatId", selectedUser);
      if (message.trim()) formData.append("text", message);
      if (imageFile) formData.append("image", imageFile);

      const { data } = await axios.post(
        `${chat_service}/api/v1/message`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessages((prev) => {
        const currentMessages = prev || [];
        const messageExists = currentMessages.some(
          (msg) => msg._id === data.message._id
        );
        if (!messageExists) return [...currentMessages, data.message];
        return currentMessages;
      });

      setMessage("");
      const displayText = message || (imageFile ? "📷 Photo" : "");

      moveChatToTop(
        selectedUser!,
        {
          text: displayText,
          sender: data.sender,
        },
        false
      );
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to send message");
    }
  };

  // ✅ Typing indicator handler
  const handleTyping = (value: string) => {
    setMessage(value);
    if (!selectedUser || !socket) return;

    if (value.trim()) {
      socket.emit("typing", {
        chatId: selectedUser,
        userId: loggedInUser?._id,
      });
    }

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(() => {
      socket.emit("stopTyping", {
        chatId: selectedUser,
        userId: loggedInUser?._id,
      });
    }, 2000);
    setTypingTimeout(timeout);
  };

  // ✅ Socket listeners setup
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg: Message) => {
      console.log("📩 Received new message:", newMsg);

      // Only add to messages if it belongs to the currently open chat
      if (newMsg.chatId === selectedUser) {
        setMessages((prev) => {
          const current = prev || [];
          const exists = current.some((m) => m._id === newMsg._id);
          if (!exists) return [...current, newMsg];
          return current;
        });

        // If message is for active chat, move that chat to top without incrementing unseen
        moveChatToTop(newMsg.chatId, newMsg, false);

        // notify backend that message was seen (keep existing behavior)
        socket?.emit("markMessagesSeen", {
          chatId: selectedUser,
          messageIds: [newMsg._id],
        });
      } else {
        // For other chats: only move to top and increment unseen count (do not add to current messages)
        moveChatToTop(newMsg.chatId, newMsg, true);
      }
    };

    socket.on("newMessage", handleNewMessage);

    socket.on("userTyping", (data) => {
      if (data.chatId === selectedUser && data.userId !== loggedInUser?._id) {
        setIsTyping(true);
      }
    });

    socket.on("userStoppedTyping", (data) => {
      if (data.chatId === selectedUser && data.userId !== loggedInUser?._id) {
        setIsTyping(false);
      }
    });
    // socket.on(
    //   "messagesSeen",
    //   (payload: { chatId: string; seenBy: string; messageIds: string[] }) => {
    //     console.log("messagesSeen payload", payload);
    //     // mark messages as seen in current messages list
    //     setMessages((prev) =>
    //       prev
    //         ? prev.map((m) =>
    //             payload.messageIds.includes(m._id)
    //               ? { ...m, seen: true, seenAt: new Date().toISOString() }
    //               : m
    //           )
    //         : prev
    //     );

    //     // reset unseen count for the chat in chats list
    //     setChats((prev) =>
    //       prev
    //         ? prev.map((c) =>
    //             c.chat._id === payload.chatId
    //               ? { ...c, chat: { ...c.chat, unseenCount: 0 } }
    //               : c
    //           )
    //         : prev
    //     );
    //   }
    // );
    socket?.on("messagesSeen", (data) => {
      console.log("✅ Message seen event received:", data);

      if (selectedUser === data.chatId) {
        setMessages((prev) => {
          if (!prev) return null;

          return prev.map((msg) => {
            // Case 1: Backend sends specific message IDs
            if (
              msg.sender === loggedInUser?._id &&
              Array.isArray(data.messageIds) &&
              data.messageIds.includes(msg._id)
            ) {
              return {
                ...msg,
                seen: true,
                seenAt: new Date().toISOString(),
              };
            }

            // Case 2: Backend doesn’t send messageIds but indicates all seen
            if (msg.sender === loggedInUser?._id && !data.messageIds) {
              return {
                ...msg,
                seen: true,
                seenAt: new Date().toISOString(),
              };
            }

            return msg; // no change
          });
        });
      }
    });

    return () => {
      socket?.off("newMessage", handleNewMessage);
      socket?.off("messagesSeen");
      socket?.off("userTyping");
      socket?.off("userStoppedTyping");
    };
  }, [socket, selectedUser, loggedInUser?._id]);

  // ✅ Join/Leave chat room logic
  useEffect(() => {
    if (selectedUser && socket) {
      fetchChat();
      setIsTyping(false);
      resetUnseenCount(selectedUser);
      socket.emit("joinChat", selectedUser);

      return () => {
        socket.emit("leaveChat", selectedUser);
        setMessages([]);
      };
    }
  }, [selectedUser, socket]);

  // ✅ Clear typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [typingTimeout]);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen flex bg-gray-900 text-white relative overflow-hidden">
      <ChatSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        showAllUsers={showAllUsers}
        setShowAllUsers={setShowAllUsers}
        users={users}
        loggedInUser={loggedInUser}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        handleLogout={handleLogout}
        chats={chats}
        createChat={createChat}
        onlineUsers={onlineUsers}
      />

      <div className="flex-1 flex flex-col justify-between p-4 backdrop-blur-xl bg-white/5 border-1 border-white/10">
        <ChatHeader
          user={user}
          setSidebarOpen={setSidebarOpen}
          isTyping={isTyping}
          onlineUsers={onlineUsers}
        />
        <ChatMessages
          selectedUser={selectedUser}
          messages={messages}
          loggedInUser={loggedInUser}
        />
        <MessageInput
          selectedUser={selectedUser}
          message={message}
          setMessage={handleTyping}
          handleMessageSend={handleMessageSend}
        />
      </div>
    </div>
  );
};

export default ChatApp;

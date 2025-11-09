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
import ChatHeader from "@/components/ChatHeader";
import ChatMessages from "@/components/ChatMessages";
import MessageInput from "@/components/MessageInput";

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

const ChatApp: React.FC = () => {
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

  // ✅ Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuth && !loading) router.push("/login");
  }, [isAuth, loading, router]);

  const handleLogout = () => {
    logoutUser();
    router.push("/login");
  };

  // ✅ Fetch messages for selected chat
  const fetchChat = async () => {
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
      setUser(data.user || null);
      await fetchChats();
    } catch (error) {
      console.error(error);
      toast.error("Failed to load messages");
    }
  };

  // ✅ Move active chat to top
  const moveChatToTop = (
    chatId: string,
    newMessage: { text: string; sender: string },
    updateUnseen = true
  ) => {
    setChats((prev) => {
      if (!prev) return prev;

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
            updatedAt: new Date().toISOString(),
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

  // ✅ Reset unseen message count
  const resetUnseenCount = (chatId: string) => {
    setChats((prev) => {
      if (!prev) return prev;
      return prev.map((chat) =>
        chat.chat._id === chatId
          ? { ...chat, chat: { ...chat.chat, unseenCount: 0 } }
          : chat
      );
    });
  };

  // ✅ Create a new chat
  const createChat = async (u: User) => {
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
      console.error(error);
      toast.error("Failed to start chat");
    }
  };

  // ✅ Send message (text or image)
  const handleMessageSend = async (e: React.FormEvent, imageFile?: File | null) => {
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
        const exists = prev.some((msg) => msg._id === data.message._id);
        return exists ? prev : [...prev, data.message];
      });

      const displayText = message || (imageFile ? "📷 Photo" : "");
      setMessage("");

      moveChatToTop(selectedUser, {
        text: displayText,
        sender: data.sender,
      });
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to send message");
    }
  };

  // ✅ Handle typing indicator
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

  // ✅ Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg: Message) => {
      if (newMsg.chatId === selectedUser) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === newMsg._id);
          return exists ? prev : [...prev, newMsg];
        });
        moveChatToTop(newMsg.chatId, newMsg, false);

        socket.emit("markMessagesSeen", {
          chatId: selectedUser,
          messageIds: [newMsg._id],
        });
      } else {
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

    socket.on("messagesSeen", (data) => {
      if (selectedUser === data.chatId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender === loggedInUser?._id &&
            (!data.messageIds || data.messageIds.includes(msg._id))
              ? { ...msg, seen: true, seenAt: new Date().toISOString() }
              : msg
          )
        );
      }
    });

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesSeen");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
    };
  }, [socket, selectedUser, loggedInUser?._id]);

  // ✅ Join/leave chat room
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

  // ✅ Clear typing timeout
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

      <div className="flex-1 flex flex-col justify-between p-4 backdrop-blur-xl bg-white/5 border border-white/10">
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

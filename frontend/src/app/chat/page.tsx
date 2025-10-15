"use client";
import React, { useEffect, useState } from "react";
import { useAppData, User, chat_service } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import ChatSidebar from "@/components/ChatSidebar";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import axios from "axios";
// import {} from "../../context/AppContext";
import ChatHeader from "../../components/ChatHeader";

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

  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login");
    }
  }, [isAuth, loading, router]);

  const handleLogout = () => {
    logoutUser();
    router.push("/login");
  };

  async function fetchChat() {
    const token = Cookies.get("token");
    try {
      const { data } = await axios.post(
        `${chat_service}/api/v1/message/${selectedUser}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessages(data.messages);
      setUser(data.user);
      await fetchChats();
    } catch (error) {
      console.log(error);
      toast.error("failed to laod messages");
    }
  }

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
          headers: {
            Authorization: `Bearer ${token}`,
          },
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

  useEffect(() => {
    if (selectedUser) {
      fetchChat();
    }
  }, [selectedUser]);

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
      />

      <div className="flex-1 flex flex-col justify-between p-4 backdrop-blur-xl bg-white/5 border-1 border-white/10">
        <ChatHeader
          user={user}
          setSidebarOpen={setSidebarOpen}
          isTyping={isTyping}
        />
      </div>
    </div>
  );
};

export default ChatApp;

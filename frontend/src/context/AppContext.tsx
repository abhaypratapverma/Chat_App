"use client";

import React, { createContext, useState, ReactNode, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

export const user_service = "http://localhost:5000";
export const chat_service = "http://localhost:5002";

export interface User {
  _id: string;
  name: string;
  email: string;
}
export interface Chat {
  _id: string;
  // chatName: string;
  // isGroupChat: boolean;
  users: string[];
  latestMessage: {
    text: string;
    sender: string;
  };
  // groupAdmin?: User;
  updatedAt: string;
  createdAt: string;
  unseenCount: number;
}

export interface Chats {
  _id: string;
  iser: User;
  chat: Chat;
}

interface AppContextType {
  user: User | null;
  loading: boolean;
  isAuth: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
  // setLoading : React.Dispatch<React.SetStateAction<boolean>>;
  logoutUser?: () => Promise<void>;
  fetchChats?: () => Promise<void>;
  fetchUsers?: () => Promise<void>;
  chats?: Chat[];
  users?: User[] | null;
  setChats?: React.Dispatch<React.SetStateAction<Chat[]>>;
  // setUsers?: React.Dispatch<React.SetStateAction<User[] | null>>;
}

const Appcontext = createContext<AppContextType | null>(null);

interface AppProviderProps {
  children: ReactNode;
}
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [isAuth, setIsAuth] = React.useState<boolean>(false);

  // async function fetchUser() {
  //   try {
  //     const token = Cookies.get("token");
  //     if (!token) {
  //       setLoading(false);
  //       return;
  //     }
  //     const { data } = await axios.get(`${user_service}/api/v1/me`, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });
  //     setUser(data);
  //     setIsAuth(true);
  //     setLoading(false);
  //   } catch (error) {
  //     console.error("Error fetching user:", error);
  //     setUser(null);
  //     setIsAuth(false);
  //     setLoading(false);
  //   } finally {
  //     setLoading(false);
  //   }
  // }
  // async function fetchUser() {
  //   try {
  //     const token = Cookies.get("token");
  //     if (!token) {
  //       setLoading(false);
  //       return;
  //     }
  //     const { data } = await axios.get(`${user_service}/api/v1/me`, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });
  //     -setUser(data);
  //     +(
  //       // API returns { user }, so store data.user to keep shape consistent
  //       (+setUser(data.user || data))
  //     );
  //     setIsAuth(true);
  //     setLoading(false);
  //   } catch (error) {
  //     console.error("Error fetching user:", error);
  //     setUser(null);
  //     setIsAuth(false);
  //     setLoading(false);
  //   } finally {
  //     setLoading(false);
  //   }
  // }
  async function fetchUser() {
    try {
      const token = Cookies.get("token");
      if (!token) {
        setLoading(false);
        return;
      }
      const { data } = await axios.get(`${user_service}/api/v1/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Normalize response: API may return { user } or the user object directly
      const userData = data?.user ?? data;
      setUser(userData || null);
      setIsAuth(true);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
      setIsAuth(false);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }

  async function logoutUser() {
    Cookies.remove("token");
    setUser(null);
    setIsAuth(false);
    toast.success("Logged out successfully");
  }

  const [chats, setChats] = useState<Chat[]>([]);
  async function fetchChats() {
    try {
      const token = Cookies.get("token");
      if (!token) {
        setLoading(false);
        return;
      }
      const { data } = await axios.get(`${chat_service}/api/v1/chat/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setChats(data.chats);
      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  }

  const [users, setUsers] = useState<User[] | null>(null);

  async function fetchUsers() {
    try {
      const token = Cookies.get("token");
      if (!token) {
        setLoading(false);
        return;
      }
      const { data } = await axios.get(`${user_service}/api/v1/user/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(data.users);
      setLoading(false);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    fetchUser();
    fetchChats();
    fetchUsers();
  }, []);

  return (
    <Appcontext.Provider
      value={{
        user,
        setUser,
        loading,
        isAuth,
        setIsAuth,
        logoutUser,
        fetchChats,
        chats,
        setChats,
        fetchUsers,
        users,
      }}
    >
      {children}
      <Toaster />
    </Appcontext.Provider>
  );
};

export const useAppData = (): AppContextType => {
  const context = React.useContext(Appcontext);
  if (!context) {
    throw new Error("useAppData must be used within an AppProvider");
  }
  return context;
};

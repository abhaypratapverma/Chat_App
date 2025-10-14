"use client";
import React from "react";
import { useEffect } from "react";
import { useAppData } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import Loading from "../../components/Loading";
const ChatApp = () => {
  const { loading, isAuth } = useAppData();
  const router = useRouter();
  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login");
    }
  }, [isAuth, loading, router]);

  if (loading) return <Loading />;
  return <div>Chat Appp Page</div>;
};

export default ChatApp;

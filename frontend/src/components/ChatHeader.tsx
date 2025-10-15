import React from "react";
import { Menu, UserCircle } from "lucide-react";
import { User } from "@/context/AppContext";

interface User {
  name: string;
  email?: string;
  // add other fields if needed
}

interface ChatHeaderProps {
  user: User | null;
  setSidebarOpen: (open: boolean) => void;
  isTyping: boolean;
}

const ChatHeader = ({ user, setSidebarOpen, isTyping }: ChatHeaderProps) => {
  console.log("this is user", user);
  return (
    <>
      {/* Mobile menu toggle button */}
      <div className="sm:hidden fixed top-4 right-4 z-30">
        <button
          className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          onClick={() => setSidebarOpen(true)} // toggle handled in parent
        >
          <Menu className="w-5 h-5 text-gray-200" />
        </button>
      </div>

      {/* Chat Header */}
      <div className="mb-6 bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
                  <UserCircle className="w-8 h-8 text-gray-300" />
                </div>
                {/* online user indicator can go here */}
              </div>

              {/* user info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-white truncate">
                    {user.name}
                  </h2>
                  {isTyping && (
                    <span className="text-sm text-gray-400">Typing...</span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center ">
                <UserCircle className="w-8 h-8 text-gray-300" />
              </div>
              <div className="">
                <h2 className="font-bold text-2xl text-gray-400">
                  Select a Conversation
                </h2>
                <p className="text-sm text-gray-500  mt-1">
                  Choose a chat from the sidebar to start the messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatHeader;

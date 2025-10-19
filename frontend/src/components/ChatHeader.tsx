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
  onlineUsers: string[];
}

const ChatHeader = ({
  user,
  setSidebarOpen,
  isTyping,
  onlineUsers,
}: ChatHeaderProps) => {
  // console.log("this is user", user);
  const isOnlineUser = user && onlineUsers.includes(user._id);
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
                {isOnlineUser && (
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-gray-800">
                    <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></span>
                  </span>
                )}
              </div>

              {/* user info */}
              <div className="flex-1 min-w-0">
                {/* User name */}
                <h2 className="text-xl sm:text-2xl font-semibold text-white truncate">
                  {user.name}
                </h2>

                {/* Status line (below name) */}
                {isTyping ? (
                  <div className="flex items-center gap-2 mt-1 text-sm">
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0s]" />
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                    </div>
                    <span className="text-blue-400 font-medium italic">
                      typing...
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1 text-sm">
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        isOnlineUser
                          ? "bg-green-500 shadow-[0_0_6px_2px_rgba(34,197,94,0.5)]"
                          : "bg-gray-500"
                      }`}
                    />
                    <span
                      className={`font-medium ${
                        isOnlineUser ? "text-green-400" : "text-gray-500"
                      }`}
                    >
                      {isOnlineUser ? "Online" : "Offline"}
                    </span>
                  </div>
                )}
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

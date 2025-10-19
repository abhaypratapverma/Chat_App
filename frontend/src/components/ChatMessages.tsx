"use client";
import type { Message } from "@/app/chat/page";
import React, { useRef, useEffect, useMemo } from "react";
import type { User } from "@/context/AppContext";
import moment from "moment";
import { Check, CheckCheck } from "lucide-react";

interface ChatMessagesProps {
  selectedUser: string | null;
  messages: Message[] | null;
  loggedInUser: User | null;
}

const ChatMessages = ({
  selectedUser,
  messages,
  loggedInUser,
}: ChatMessagesProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // seen feature to be add after socket
  const uniqueMessages = useMemo(() => {
    if (!messages) return [];
    const seen = new Set();
    return messages.filter((message) => {
      if (seen.has(message._id)) {
        return false;
      }
      seen.add(message._id);
      return true;
    });
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedUser, uniqueMessages]);

  return (
    <div className="flex-1 overflow-hidden">
      {/* {uniqueMessages.length === 0 && (
        <div className="text-center text-sm text-gray-400">No messages</div>
      )}

      {uniqueMessages.map((m) => (
        <div
          key={m._id}
          className={`my-2 max-w-[70%] p-2 rounded-md break-words ${
            {
              true: "bg-blue-600 self-end",
              false: "bg-gray-700 self-start",
            }[m.sender === loggedInUser?._id]
          }`}
        >
          <div className="text-sm">{m.text}</div>
          {m.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.image.url} alt="msg" className="mt-2 max-w-full" />
          )}
          <div className="text-xs text-gray-300 mt-1">
            {new Date(m.createdAt).toLocaleString()}
          </div>
        </div>
      ))}

      <div ref={bottomRef} /> */}
      <div className="h-full max-h-[calc(100vh-215px)] overflow-y-auto p-2 space-y-2">
        {!selectedUser ? (
          <p className="text-gray-400 text-center mt-20">
            Please select a user to start chatting 📩
          </p>
        ) : (
          <>
            {uniqueMessages.map((e, i) => {
              const isSentByMe = e.sender === loggedInUser?._id;
              const uniqueKey = `${e._id}-${i}`;

              return (
                <div
                  key={uniqueKey}
                  className={`flex flex-col gap-1 mt-2 ${
                    isSentByMe ? "items-end" : "items-start"
                  }`}
                >
                  {/* message bubble */}
                  <div
                    className={`rounded-lg p-3 max-w-sm ${
                      isSentByMe
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    {e.messageType === "image" && e.image && (
                      <div className="relative group">
                        <img
                          src={e.image.url}
                          alt="shared image"
                          className="max-w-full h-auto rounded-lg"
                        />
                      </div>
                    )}

                    {e.text && <p className="mt-1">{e.text}</p>}
                  </div>

                  {/* time & seen indicators */}
                  <div
                    className={`flex items-center gap-1 text-xs text-gray-400 ${
                      isSentByMe ? "pr-2 flex-row-reverse" : "pl-2"
                    }`}
                  >
                    <span>{moment(e.createdAt).format("hh:mm A, MMM D")}</span>

                    {/* {e.seen ? (
                      <div className="flex items-center gap-1 text-blue-400">
                        <CheckCheck className="w-3 h-3" />
                        {e.seenAt && (
                          <span>{moment(e.seenAt).format("hh:mm A")}</span>
                        )}
                      </div>
                    ) : (
                      <Check className="w-3 h-3 text-gray-500" />
                    )} */}
                    {isSentByMe && (
                      <>
                        {e.seen ? (
                          <div className="flex items-center gap-1 text-blue-400">
                            <CheckCheck className="w-3 h-3" />
                          </div>
                        ) : (
                          <Check className="w-3 h-3 text-gray-500" />
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  );
};

export default ChatMessages;

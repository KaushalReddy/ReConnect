"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  sendMessage,
  subscribeToMessages,
} from "@/lib/firestore/chats";
import { initials } from "@/lib/utils";
import type { Conversation, ChatMessage, UserDoc } from "@/types";

interface ChatWindowProps {
  conversation: Conversation;
  currentUserId: string;
  counterpart: UserDoc | null;
}

export default function ChatWindow({
  conversation,
  currentUserId,
  counterpart,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(
      conversation.conversationId,
      (msgs) => {
        setMessages(msgs);
      },
      () => {
        setError("Failed to load live messages.");
      }
    );
    return () => unsubscribe();
  }, [conversation.conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const clean = inputText.trim();
    if (!clean || sending) return;

    setSending(true);
    setError(null);
    try {
      setInputText("");
      await sendMessage(conversation.conversationId, currentUserId, clean);
    } catch {
      setError("Could not send message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function formatTime(ms: number) {
    const d = new Date(ms);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function formatDate(ms: number) {
    return new Date(ms).toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
  }

  const counterpartName = counterpart?.name || "Mentorship Partner";

  return (
    <div className="flex h-[600px] flex-col rounded-2xl border border-ink/10 bg-white/80 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink font-body text-xs font-semibold text-paper">
            {initials(counterpartName)}
          </div>
          <div>
            <h2 className="font-body text-base font-semibold text-ink">
              {counterpartName}
            </h2>
            <p className="font-mono text-xs text-brass-dark">
              {counterpart?.role ? counterpart.role : "Active Mentorship"}
            </p>
          </div>
        </div>

        {conversation.mentorshipRequestId && (
          <Link
            href={`/meetings?requestId=${conversation.mentorshipRequestId}`}
            className="btn-secondary !px-3 !py-1.5 text-xs"
          >
            📅 Mentorship Meeting
          </Link>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {error && (
          <p className="rounded-lg bg-rust/10 p-3 text-center font-body text-xs text-rust">
            {error}
          </p>
        )}

        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center text-ink-400">
            <span className="text-3xl">💬</span>
            <p className="mt-2 font-body text-sm font-medium text-ink">
              No messages yet
            </p>
            <p className="mt-1 font-body text-xs text-ink-400">
              Send a greeting below to start your mentorship discussion!
            </p>
          </div>
        )}

        {messages.map((msg, index) => {
          const isMe = msg.senderId === currentUserId;
          const isSystem = msg.senderId === "system";

          // Show date divider if previous message is from a different day
          const showDate =
            index === 0 ||
            new Date(messages[index - 1].createdAt).toDateString() !==
              new Date(msg.createdAt).toDateString();

          return (
            <div key={msg.messageId} className="space-y-2">
              {showDate && (
                <div className="flex justify-center my-3">
                  <span className="rounded-full bg-ink/5 px-3 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-400">
                    {formatDate(msg.createdAt)}
                  </span>
                </div>
              )}

              {isSystem ? (
                <div className="flex justify-center">
                  <p className="max-w-md rounded-xl bg-brass/10 px-4 py-2 text-center font-body text-xs text-brass-dark">
                    {msg.text}
                  </p>
                </div>
              ) : (
                <div
                  className={`flex flex-col ${
                    isMe ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 font-body text-sm shadow-sm ${
                      isMe
                        ? "bg-ink text-paper rounded-br-none"
                        : "bg-ink/5 text-ink border border-ink/10 rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  </div>
                  <span className="mt-1 font-mono text-[10px] text-ink-400">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-3 border-t border-ink/10 p-4 bg-paper/40 rounded-b-2xl"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Message ${counterpartName}…`}
          className="input-field flex-1"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !inputText.trim()}
          className="btn-primary !px-5 !py-2.5 text-xs"
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}

"use client";

import { initials } from "@/lib/utils";
import type { Conversation, UserDoc } from "@/types";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conv: Conversation) => void;
  counterparts: Record<string, UserDoc>;
  currentUserId: string;
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  counterparts,
  currentUserId,
}: ConversationListProps) {
  function formatTime(ms?: number) {
    if (!ms) return "";
    const d = new Date(ms);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  return (
    <div className="flex flex-col divide-y divide-ink/10 overflow-y-auto rounded-2xl border border-ink/10 bg-white/70 shadow-card">
      {conversations.map((conv) => {
        const otherId =
          conv.studentId === currentUserId ? conv.alumniId : conv.studentId;
        const counterpart = counterparts[otherId];
        const name = counterpart?.name || "Mentorship Chat";
        const isSelected = selectedId === conv.conversationId;

        return (
          <button
            key={conv.conversationId}
            onClick={() => onSelect(conv)}
            className={`flex items-start gap-3 p-4 text-left transition-colors ${
              isSelected
                ? "bg-brass/10 border-l-4 border-brass"
                : "hover:bg-ink/[0.03]"
            }`}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink font-body text-xs font-semibold text-paper">
              {initials(name)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-body text-sm font-semibold text-ink">
                  {name}
                </p>
                <span className="shrink-0 font-mono text-[10px] text-ink-400">
                  {formatTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                </span>
              </div>

              <p className="mt-1 truncate font-body text-xs text-ink-500">
                {conv.lastMessage?.text || "Started conversation"}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

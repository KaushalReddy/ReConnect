"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardShell from "@/components/dashboard/DashboardShell";
import EmptyState from "@/components/EmptyState";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import { useAuth } from "@/lib/auth-context";
import { getUserDoc } from "@/lib/firestore/users";
import {
  getUserConversations,
  subscribeToUserConversations,
} from "@/lib/firestore/chats";
import type { Conversation, UserDoc } from "@/types";

function MessagesContent() {
  const { userDoc } = useAuth();
  const searchParams = useSearchParams();
  const paramConvId = searchParams.get("conversationId");

  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [counterparts, setCounterparts] = useState<Record<string, UserDoc>>({});
  const [error, setError] = useState<string | null>(null);

  // Subscribe to live conversations for current user
  useEffect(() => {
    if (!userDoc) return;
    let cancelled = false;

    const unsubscribe = subscribeToUserConversations(userDoc.uid, (convs) => {
      if (cancelled) return;
      setConversations(convs);

      // Fetch counterpart user info for any missing IDs
      const otherIds = convs.map((c) =>
        c.studentId === userDoc.uid ? c.alumniId : c.studentId
      );
      const missing = otherIds.filter((id) => !(id in counterparts));

      if (missing.length > 0) {
        Promise.all(missing.map((id) => getUserDoc(id))).then((docs) => {
          if (cancelled) return;
          setCounterparts((prev) => {
            const next = { ...prev };
            docs.forEach((d, i) => {
              if (d) next[missing[i]] = d;
            });
            return next;
          });
        });
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [userDoc, counterparts]);

  const router = useRouter();

  // On initial load or when paramConvId changes, set selectedConv
  useEffect(() => {
    if (!conversations || conversations.length === 0) return;

    if (paramConvId) {
      const match = conversations.find((c) => c.conversationId === paramConvId);
      if (match) {
        setSelectedConv(match);
        return;
      }
    }

    setSelectedConv((current) => {
      if (current) {
        // Keep current if still exists in conversations list
        const exists = conversations.find((c) => c.conversationId === current.conversationId);
        return exists || conversations[0];
      }
      return conversations[0];
    });
  }, [paramConvId, conversations]);

  function handleSelectConversation(conv: Conversation) {
    setSelectedConv(conv);
    router.replace(`/messages?conversationId=${conv.conversationId}`, { scroll: false });
  }

  if (!userDoc) return null;

  const currentOtherId = selectedConv
    ? selectedConv.studentId === userDoc.uid
      ? selectedConv.alumniId
      : selectedConv.studentId
    : null;
  const currentCounterpart = currentOtherId
    ? counterparts[currentOtherId] || null
    : null;

  return (
    <DashboardShell role={userDoc.role}>
      <div className="space-y-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-brass-dark">
            Mentorship Chat
          </p>
          <h1 className="mt-2 font-display text-3xl font-medium text-ink">
            Messages
          </h1>
        </div>

        {error && (
          <p className="rounded-lg bg-rust/10 px-4 py-3 font-body text-sm text-rust">
            {error}
          </p>
        )}

        {/* Loading state */}
        {conversations === null && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="h-96 animate-pulse rounded-2xl bg-ink/5" />
            <div className="h-96 animate-pulse rounded-2xl bg-ink/5 md:col-span-2" />
          </div>
        )}

        {/* Empty state */}
        {conversations && conversations.length === 0 && (
          <EmptyState
            title="No active conversations"
            description="When a mentorship request is accepted, your private chat will appear here."
            action={
              <Link href="/mentorship" className="btn-primary">
                View Mentorship Requests
              </Link>
            }
          />
        )}

        {/* Active conversation layout */}
        {conversations && conversations.length > 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Conversation sidebar */}
            <div className="lg:col-span-1">
              <h2 className="mb-3 font-display text-base text-ink">
                Conversations ({conversations.length})
              </h2>
              <ConversationList
                conversations={conversations}
                selectedId={selectedConv?.conversationId || null}
                onSelect={handleSelectConversation}
                counterparts={counterparts}
                currentUserId={userDoc.uid}
              />
            </div>

            {/* Main chat window */}
            <div className="lg:col-span-2">
              {selectedConv ? (
                <ChatWindow
                  key={selectedConv.conversationId}
                  conversation={selectedConv}
                  currentUserId={userDoc.uid}
                  counterpart={currentCounterpart}
                />
              ) : (
                <div className="flex h-[600px] items-center justify-center rounded-2xl border border-ink/10 bg-white/70 p-6 text-center text-ink-400 shadow-card">
                  <p className="font-body text-sm">
                    Select a conversation to start chatting.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

export default function MessagesPage() {
  return (
    <ProtectedRoute allowedRoles={["STUDENT", "ALUMNI", "FACULTY", "ADMIN"]}>
      <Suspense fallback={<div className="p-8 text-center">Loading messages…</div>}>
        <MessagesContent />
      </Suspense>
    </ProtectedRoute>
  );
}

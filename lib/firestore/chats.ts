import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import type { Conversation, ChatMessage } from "@/types";

/**
 * Generate a deterministic conversation ID for a pair of users.
 * This guarantees idempotency and prevents duplicate conversations.
 */
export function getDeterministicConversationId(uidA: string, uidB: string): string {
  const sorted = [uidA, uidB].sort();
  return `conv_${sorted[0]}_${sorted[1]}`;
}

/**
 * Get or create a private 1-on-1 conversation between student and alumnus.
 * Uses a deterministic conversationId so concurrent or repeated calls are completely idempotent.
 */
export async function getOrCreateConversation(
  studentId: string,
  alumniId: string,
  mentorshipRequestId: string
): Promise<Conversation> {
  const conversationId = getDeterministicConversationId(studentId, alumniId);
  const ref = doc(db, "conversations", conversationId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const existing = snap.data() as Conversation;
    // Update mentorshipRequestId if needed
    if (!existing.mentorshipRequestId && mentorshipRequestId) {
      await updateDoc(ref, { mentorshipRequestId, updatedAt: Date.now() });
    }
    return existing;
  }

  const now = Date.now();
  const newConversation: Conversation = {
    conversationId,
    participants: [studentId, alumniId],
    studentId,
    alumniId,
    mentorshipRequestId,
    createdAt: now,
    updatedAt: now,
    lastMessage: {
      text: "Mentorship connected! Send a message to get started.",
      senderId: "system",
      createdAt: now,
    },
  };

  await setDoc(ref, newConversation);

  // Add initial system message to the subcollection
  const messagesRef = collection(db, "conversations", conversationId, "messages");
  const welcomeMsgRef = doc(messagesRef);
  await setDoc(welcomeMsgRef, {
    messageId: welcomeMsgRef.id,
    conversationId,
    senderId: "system",
    text: "Mentorship connected! You can now chat and coordinate your mentorship sessions here.",
    createdAt: now,
  } satisfies ChatMessage);

  return newConversation;
}

/**
 * Fetch a single conversation by ID.
 */
export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const ref = doc(db, "conversations", conversationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as Conversation;
}

/**
 * Fetch all conversations for a user.
 */
export async function getUserConversations(userId: string): Promise<Conversation[]> {
  const convRef = collection(db, "conversations");
  try {
    const q = query(
      convRef,
      where("participants", "array-contains", userId),
      orderBy("updatedAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Conversation);
  } catch {
    // Fallback if composite index is building
    const q = query(convRef, where("participants", "array-contains", userId));
    const snap = await getDocs(q);
    const convs = snap.docs.map((d) => d.data() as Conversation);
    return convs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }
}

/**
 * Send a message in a conversation.
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string
): Promise<ChatMessage> {
  const cleanText = text.trim();
  if (!cleanText) throw new Error("Message cannot be empty");

  const now = Date.now();
  const messagesRef = collection(db, "conversations", conversationId, "messages");
  const messageDocRef = doc(messagesRef);

  const message: ChatMessage = {
    messageId: messageDocRef.id,
    conversationId,
    senderId,
    text: cleanText,
    createdAt: now,
  };

  await setDoc(messageDocRef, message);

  // Update lastMessage on conversation parent
  const convRef = doc(db, "conversations", conversationId);
  await updateDoc(convRef, {
    updatedAt: now,
    lastMessage: {
      text: cleanText,
      senderId,
      createdAt: now,
    },
  });

  return message;
}

/**
 * Real-time listener for messages in a conversation.
 */
export function subscribeToMessages(
  conversationId: string,
  onUpdate: (messages: ChatMessage[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const messagesRef = collection(db, "conversations", conversationId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));

  return onSnapshot(
    q,
    (snap) => {
      const messages = snap.docs.map((d) => d.data() as ChatMessage);
      onUpdate(messages);
    },
    (err) => {
      if (onError) onError(err);
      // Fallback without orderBy
      const fallbackQuery = query(messagesRef);
      return onSnapshot(fallbackQuery, (snap) => {
        const messages = snap.docs.map((d) => d.data() as ChatMessage);
        messages.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        onUpdate(messages);
      });
    }
  );
}

/**
 * Real-time listener for user's conversation list.
 */
export function subscribeToUserConversations(
  userId: string,
  onUpdate: (conversations: Conversation[]) => void
): Unsubscribe {
  const convRef = collection(db, "conversations");
  const q = query(convRef, where("participants", "array-contains", userId));

  return onSnapshot(q, (snap) => {
    const convs = snap.docs.map((d) => d.data() as Conversation);
    convs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    onUpdate(convs);
  });
}

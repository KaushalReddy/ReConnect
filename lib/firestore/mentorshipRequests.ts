import {
  doc,
  collection,
  setDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  getCountFromServer,
} from "firebase/firestore";

import { db } from "@/firebase/config";
import { logEngagement } from "@/lib/firestore/engagementLogs";
import { getOrCreateConversation } from "@/lib/firestore/chats";
import { getOrCreateMeeting } from "@/lib/firestore/meetings";

import type { MentorshipRequest, MentorshipStatus } from "@/types";

/**
 * A student or faculty member sends a mentorship request to an alumnus.
 * Logs a MENTORSHIP_REQUEST_SENT engagement event on success.
 */
export async function sendMentorshipRequest(
  studentId: string,
  alumniId: string,
  message: string
): Promise<MentorshipRequest> {
  const ref = doc(collection(db, "mentorshipRequests"));
  const now = Date.now();

  const request: MentorshipRequest = {
    requestId: ref.id,
    studentId,
    alumniId,
    message: message.trim(),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(ref, request);

  await logEngagement(
    studentId,
    "MENTORSHIP_REQUEST_SENT",
    alumniId
  );

  return request;
}

/**
 * All requests a student/faculty member has sent,
 * most recent first.
 */
export async function getSentRequests(
  studentId: string
): Promise<MentorshipRequest[]> {
  try {
    const q = query(
      collection(db, "mentorshipRequests"),
      where("studentId", "==", studentId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(
      (d) =>
        ({
          requestId: d.id,
          ...d.data(),
        }) as MentorshipRequest
    );
  } catch {
    // Fallback while composite index is building in Firestore
    const q = query(
      collection(db, "mentorshipRequests"),
      where("studentId", "==", studentId)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map(
      (d) =>
        ({
          requestId: d.id,
          ...d.data(),
        }) as MentorshipRequest
    );
    return items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }
}

/**
 * All requests an alumnus has received,
 * most recent first.
 */
export async function getIncomingRequests(
  alumniId: string
): Promise<MentorshipRequest[]> {
  try {
    const q = query(
      collection(db, "mentorshipRequests"),
      where("alumniId", "==", alumniId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(
      (d) =>
        ({
          requestId: d.id,
          ...d.data(),
        }) as MentorshipRequest
    );
  } catch {
    // Fallback while composite index is building in Firestore
    const q = query(
      collection(db, "mentorshipRequests"),
      where("alumniId", "==", alumniId)
    );
    const snap = await getDocs(q);
    const items = snap.docs.map(
      (d) =>
        ({
          requestId: d.id,
          ...d.data(),
        }) as MentorshipRequest
    );
    return items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }
}

/**
 * Returns the existing request, if any, between
 * a specific student and alumnus.
 */
export async function getExistingRequest(
  studentId: string,
  alumniId: string
): Promise<MentorshipRequest | null> {
  const q = query(
    collection(db, "mentorshipRequests"),
    where("studentId", "==", studentId),
    where("alumniId", "==", alumniId),
    limit(1)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    return null;
  }

  return {
    requestId: snap.docs[0].id,
    ...snap.docs[0].data(),
  } as MentorshipRequest;
}

/**
 * Fetch a single mentorship request by ID.
 */
export async function getMentorshipRequest(requestId: string): Promise<MentorshipRequest | null> {
  const ref = doc(db, "mentorshipRequests", requestId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return {
    requestId: snap.id,
    ...snap.data(),
  } as MentorshipRequest;
}

/**
 * Alumni-only: accept or reject an incoming request.
 * When accepted, automatically & idempotently:
 * 1. Updates request status to 'accepted' with linked conversationId & meetingId
 * 2. Creates/retrieves the private chat conversation
 * 3. Creates/retrieves the initial mentorship meeting placeholder
 * 4. Triggers server-side email notification to the student
 * 5. Logs engagement activity
 */
export async function respondToRequest(
  requestId: string,
  status: Extract<MentorshipStatus, "accepted" | "rejected">
): Promise<{ conversationId?: string; meetingId?: string }> {
  const ref = doc(db, "mentorshipRequests", requestId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Request not found");
  }

  const request = snap.data() as MentorshipRequest;
  const now = Date.now();

  let conversationId: string | undefined = request.conversationId;
  let meetingId: string | undefined = request.meetingId;

  if (status === "accepted") {
    // 1. Create or retrieve conversation (idempotent, deterministic ID)
    const conv = await getOrCreateConversation(
      request.studentId,
      request.alumniId,
      requestId
    );
    conversationId = conv.conversationId;

    // 2. Create or retrieve initial meeting (idempotent, deterministic ID)
    const meeting = await getOrCreateMeeting(
      requestId,
      request.studentId,
      request.alumniId
    );
    meetingId = meeting.meetingId;

    // 3. Update mentorship request
    await updateDoc(ref, {
      status,
      conversationId,
      meetingId,
      updatedAt: now,
    });

    // 4. Trigger server-side email notification (asynchronously with idempotency check)
    fetch("/api/notifications/mentorship-accepted", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId,
        studentId: request.studentId,
        alumniId: request.alumniId,
      }),
    }).catch((err) => {
      console.warn("Could not trigger email notification:", err);
    });

    // 5. Log engagement event
    await logEngagement(
      request.alumniId,
      "MENTORSHIP_REQUEST_ACCEPTED",
      request.studentId
    );
  } else {
    // Status is 'rejected'
    await updateDoc(ref, {
      status,
      updatedAt: now,
    });

    await logEngagement(
      request.alumniId,
      "MENTORSHIP_REQUEST_REJECTED",
      request.studentId
    );
  }

  return { conversationId, meetingId };
}

export interface MentorshipStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
}

/**
 * Platform-wide mentorship request counts,
 * used by the admin dashboard.
 */
export async function getMentorshipStats(): Promise<MentorshipStats> {
  const ref = collection(db, "mentorshipRequests");

  const [
    totalSnap,
    pendingSnap,
    acceptedSnap,
    rejectedSnap,
  ] = await Promise.all([
    getCountFromServer(ref),

    getCountFromServer(
      query(ref, where("status", "==", "pending"))
    ),

    getCountFromServer(
      query(ref, where("status", "==", "accepted"))
    ),

    getCountFromServer(
      query(ref, where("status", "==", "rejected"))
    ),
  ]);

  return {
    total: totalSnap.data().count,
    pending: pendingSnap.data().count,
    accepted: acceptedSnap.data().count,
    rejected: rejectedSnap.data().count,
  };
}
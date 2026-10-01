import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { logEngagement } from "@/lib/firestore/engagementLogs";
import type { MentorshipMeeting, MeetingStatus } from "@/types";

/**
 * Generate a deterministic meeting ID based on mentorship requestId.
 * Guarantees exactly one meeting record per mentorship request (prevents duplicates).
 */
export function getDeterministicMeetingId(mentorshipRequestId: string): string {
  return `meet_${mentorshipRequestId}`;
}

/**
 * Get or create an initial mentorship meeting placeholder.
 * Fully idempotent — if called multiple times, returns the existing record.
 */
export async function getOrCreateMeeting(
  mentorshipRequestId: string,
  studentId: string,
  alumniId: string
): Promise<MentorshipMeeting> {
  const meetingId = getDeterministicMeetingId(mentorshipRequestId);
  const ref = doc(db, "mentorshipMeetings", meetingId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data() as MentorshipMeeting;
  }

  const now = Date.now();
  const initialMeeting: MentorshipMeeting = {
    meetingId,
    mentorshipRequestId,
    studentId,
    alumniId,
    status: "pending",
    scheduledAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(ref, initialMeeting);
  return initialMeeting;
}

/**
 * Fetch a meeting by its meetingId.
 */
export async function getMeeting(meetingId: string): Promise<MentorshipMeeting | null> {
  const ref = doc(db, "mentorshipMeetings", meetingId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as MentorshipMeeting;
}

/**
 * Fetch a meeting by its mentorshipRequestId.
 */
export async function getMeetingByRequestId(
  mentorshipRequestId: string
): Promise<MentorshipMeeting | null> {
  const meetingId = getDeterministicMeetingId(mentorshipRequestId);
  return getMeeting(meetingId);
}

/**
 * Fetch all meetings for a user (as student or alumnus).
 */
export async function getUserMeetings(userId: string): Promise<MentorshipMeeting[]> {
  const meetingsRef = collection(db, "mentorshipMeetings");

  const [studentSnap, alumniSnap] = await Promise.all([
    getDocs(query(meetingsRef, where("studentId", "==", userId))),
    getDocs(query(meetingsRef, where("alumniId", "==", userId))),
  ]);

  const map = new Map<string, MentorshipMeeting>();

  studentSnap.docs.forEach((d) => {
    map.set(d.id, d.data() as MentorshipMeeting);
  });
  alumniSnap.docs.forEach((d) => {
    map.set(d.id, d.data() as MentorshipMeeting);
  });

  const all = Array.from(map.values());

  // Sort: upcoming scheduled meetings first, then pending/to_be_scheduled, then completed/cancelled
  return all.sort((a, b) => {
    if (a.status === "scheduled" && b.status === "scheduled") {
      return (a.scheduledAt || 0) - (b.scheduledAt || 0);
    }
    if (a.status === "scheduled") return -1;
    if (b.status === "scheduled") return 1;
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });
}

/**
 * Propose or schedule a date & time for the mentorship meeting.
 */
export async function scheduleMeeting(
  meetingId: string,
  proposedBy: string,
  data: {
    scheduledAt: number;
    location?: string;
    meetingUrl?: string;
    topic?: string;
    notes?: string;
  }
): Promise<void> {
  const ref = doc(db, "mentorshipMeetings", meetingId);
  const now = Date.now();

  await updateDoc(ref, {
    scheduledAt: data.scheduledAt,
    location: data.location?.trim() || "Online Video Call",
    meetingUrl: data.meetingUrl?.trim() || "",
    topic: data.topic?.trim() || "Mentorship Session",
    notes: data.notes?.trim() || "",
    proposedBy,
    status: "scheduled",
    updatedAt: now,
  });

  await logEngagement(proposedBy, "MENTORSHIP_MEETING_SCHEDULED");
}

/**
 * Update meeting status (e.g. mark completed or cancelled or confirmed).
 */
export async function updateMeetingStatus(
  meetingId: string,
  userId: string,
  status: MeetingStatus
): Promise<void> {
  const ref = doc(db, "mentorshipMeetings", meetingId);
  await updateDoc(ref, {
    status,
    updatedAt: Date.now(),
  });

  if (status === "completed" || status === "scheduled") {
    await logEngagement(userId, "MENTORSHIP_MEETING_CONFIRMED");
  }
}

/**
 * Real-time listener for a single meeting doc.
 */
export function subscribeToMeeting(
  meetingId: string,
  onUpdate: (meeting: MentorshipMeeting | null) => void
): Unsubscribe {
  const ref = doc(db, "mentorshipMeetings", meetingId);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      onUpdate(snap.data() as MentorshipMeeting);
    } else {
      onUpdate(null);
    }
  });
}

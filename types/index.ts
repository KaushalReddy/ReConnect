// Central type definitions for ReConnect.
// Keep this file as the single source of truth for Firestore document shapes.

export type UserRole = "ALUMNI" | "STUDENT" | "FACULTY" | "ADMIN";

/**
 * Firestore collection: users/{userId}
 */
export interface UserDoc {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: number; // epoch millis
  profileCompleted: boolean;
  phoneNumber?: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
  verificationMethod?: "EMAIL" | "PHONE" | "BOTH";
}

/**
 * Firestore collection: alumniProfiles/{userId}
 * Document id matches the owning user's uid.
 */
export interface AlumniProfile {
  userId: string;
  fullName: string;
  photoUrl: string;
  department: string;
  graduationYear: number;
  degree: string;
  currentCompany: string;
  jobTitle: string;
  location: string;
  skills: string[];
  linkedinUrl: string;
  bio: string;
  availableForMentorship: boolean;
  createdAt: number;
  updatedAt: number;
}

export type MentorshipStatus = "pending" | "accepted" | "rejected";

/**
 * Firestore collection: mentorshipRequests/{requestId}
 */
export interface MentorshipRequest {
  requestId: string;
  studentId: string; // uid of the student or faculty member requesting mentorship
  alumniId: string; // uid of the alumni being requested
  message: string;
  status: MentorshipStatus;
  conversationId?: string; // linked conversation ID
  meetingId?: string; // linked initial meeting ID
  notificationSent?: boolean; // idempotency flag for acceptance email
  createdAt: number;
  updatedAt: number;
}

/**
 * Firestore collection: conversations/{conversationId}
 */
export interface Conversation {
  conversationId: string;
  participants: [string, string]; // [studentId, alumniId]
  studentId: string;
  alumniId: string;
  mentorshipRequestId: string;
  createdAt: number;
  updatedAt: number;
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: number;
  };
}

/**
 * Firestore subcollection: conversations/{conversationId}/messages/{messageId}
 */
export interface ChatMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: number;
}

export type MeetingStatus = "pending" | "scheduled" | "completed" | "cancelled";

/**
 * Firestore collection: mentorshipMeetings/{meetingId}
 */
export interface MentorshipMeeting {
  meetingId: string;
  mentorshipRequestId: string;
  studentId: string;
  alumniId: string;
  status: MeetingStatus; // "pending" initially (meaning to be scheduled)
  scheduledAt: number | null; // epoch millis when scheduled, or null
  location?: string; // e.g., "Google Meet", "Zoom", "Room 302"
  meetingUrl?: string; // video call URL if any
  topic?: string;
  notes?: string;
  proposedBy?: string; // uid of who last proposed/modified the schedule
  createdAt: number;
  updatedAt: number;
}

export type EngagementAction =
  | "PROFILE_CREATED"
  | "PROFILE_UPDATED"
  | "MENTORSHIP_REQUEST_SENT"
  | "MENTORSHIP_REQUEST_ACCEPTED"
  | "MENTORSHIP_REQUEST_REJECTED"
  | "MENTORSHIP_MEETING_SCHEDULED"
  | "MENTORSHIP_MEETING_CONFIRMED";

/**
 * Firestore collection: engagementLogs/{logId}
 */
export interface EngagementLog {
  logId: string;
  userId: string;
  action: EngagementAction;
  timestamp: number;
  relatedUserId?: string;
}

/**
 * Firestore collection: events/{eventId}
 */
export interface EventDoc {
  eventId: string;
  title: string;
  description: string;
  date: number; // epoch millis
  location: string;
  createdBy: string;
  createdAt: number;
}

export type OpportunityType = "JOB" | "INTERNSHIP";

/**
 * Firestore collection: opportunities/{opportunityId}
 */
export interface OpportunityDoc {
  opportunityId: string;
  type: OpportunityType;
  title: string;
  company: string;
  description: string;
  location: string;
  applyUrl: string;
  postedBy: string;
  createdAt: number;
}

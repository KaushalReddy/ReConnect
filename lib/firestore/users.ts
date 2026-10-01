import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import type { UserDoc, UserRole } from "@/types";

/**
 * Create the Firestore user document immediately after Firebase Auth
 * account creation. Mirrors the `users` collection schema documented
 * in the project README.
 */
export async function createUserDoc(
  uid: string,
  name: string,
  email: string,
  role: UserRole,
  extra?: {
    phoneNumber?: string;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    verificationMethod?: "EMAIL" | "PHONE" | "BOTH";
  }
): Promise<void> {
  const ref = doc(db, "users", uid);
  const data: UserDoc = {
    uid,
    name,
    email,
    role,
    createdAt: Date.now(),
    profileCompleted: false,
    ...(extra?.phoneNumber ? { phoneNumber: extra.phoneNumber } : {}),
    ...(extra?.isEmailVerified !== undefined ? { isEmailVerified: extra.isEmailVerified } : {}),
    ...(extra?.isPhoneVerified !== undefined ? { isPhoneVerified: extra.isPhoneVerified } : {}),
    ...(extra?.verificationMethod ? { verificationMethod: extra.verificationMethod } : {}),
  };
  await setDoc(ref, data);
}

/**
 * Update verification status (email/phone) for an existing user.
 */
export async function updateUserVerification(
  uid: string,
  data: {
    phoneNumber?: string;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    verificationMethod?: "EMAIL" | "PHONE" | "BOTH";
  }
): Promise<void> {
  const ref = doc(db, "users", uid);
  await setDoc(ref, data, { merge: true });
}

/**
 * Fetch a single user document by uid. Returns null if it does not exist
 * (for example, mid-registration before the doc has been written).
 */
export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as UserDoc;
}

/**
 * Mark a user's profile as completed (called after alumni finish the
 * profile form in Phase 3).
 */
export async function markProfileCompleted(uid: string): Promise<void> {
  const ref = doc(db, "users", uid);
  await setDoc(ref, { profileCompleted: true }, { merge: true });
}

export interface UserRoleCounts {
  total: number;
  alumni: number;
  student: number;
  faculty: number;
  admin: number;
}

/**
 * Live counts of users by role, used by the admin dashboard. Uses
 * Firestore's server-side count aggregation so this stays cheap even as
 * the users collection grows (no documents are downloaded).
 */
export async function getUserRoleCounts(): Promise<UserRoleCounts> {
  const usersRef = collection(db, "users");

  const [totalSnap, alumniSnap, studentSnap, facultySnap, adminSnap] =
    await Promise.all([
      getCountFromServer(usersRef),
      getCountFromServer(query(usersRef, where("role", "==", "ALUMNI"))),
      getCountFromServer(query(usersRef, where("role", "==", "STUDENT"))),
      getCountFromServer(query(usersRef, where("role", "==", "FACULTY"))),
      getCountFromServer(query(usersRef, where("role", "==", "ADMIN"))),
    ]);

  return {
    total: totalSnap.data().count,
    alumni: alumniSnap.data().count,
    student: studentSnap.data().count,
    faculty: facultySnap.data().count,
    admin: adminSnap.data().count,
  };
}

/**
 * Most recently registered users, used by the admin dashboard's
 * "Recent registrations" panel.
 */
export async function getRecentUsers(count = 5): Promise<UserDoc[]> {
  const usersRef = collection(db, "users");
  const q = query(usersRef, orderBy("createdAt", "desc"), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as UserDoc);
}

/**
 * Every registered user, ordered newest first — used by the admin
 * /admin/users full user table.
 */
export async function getAllUsers(): Promise<UserDoc[]> {
  const usersRef = collection(db, "users");
  const q = query(usersRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as UserDoc);
}

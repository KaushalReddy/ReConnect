import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { markProfileCompleted } from "@/lib/firestore/users";
import { logEngagement } from "@/lib/firestore/engagementLogs";
import type { AlumniProfile } from "@/types";

export type AlumniProfileInput = Omit<
  AlumniProfile,
  "userId" | "createdAt" | "updatedAt"
>;

/**
 * Fetch a single alumni profile by the owning user's uid.
 * Document id in `alumniProfiles` always matches the user's uid.
 */
export async function getAlumniProfile(uid: string): Promise<AlumniProfile | null> {
  const ref = doc(db, "alumniProfiles", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as AlumniProfile;
}

/**
 * Create or update the signed-in alumni's profile. Also flips
 * users/{uid}.profileCompleted to true so the directory and dashboard
 * both reflect a finished profile immediately.
 */
export async function saveAlumniProfile(
  uid: string,
  input: AlumniProfileInput
): Promise<void> {
  const ref = doc(db, "alumniProfiles", uid);
  const existing = await getDoc(ref);
  const now = Date.now();
  const isNew = !existing.exists();

  const profile: AlumniProfile = {
    ...input,
    userId: uid,
    createdAt: isNew ? now : (existing.data() as AlumniProfile).createdAt,
    updatedAt: now,
  };

  await setDoc(ref, profile);
  await markProfileCompleted(uid);
  await logEngagement(uid, isNew ? "PROFILE_CREATED" : "PROFILE_UPDATED");
}

/**
 * All alumni profiles, for the searchable directory. Filtering (name,
 * department, graduation year, company, skills, location) happens
 * client-side over this result set — appropriate at MVP scale, and it
 * avoids needing a composite Firestore index for every filter
 * combination a user might pick.
 */
export async function getAllAlumniProfiles(): Promise<AlumniProfile[]> {
  const snap = await getDocs(collection(db, "alumniProfiles"));
  return snap.docs.map((d) => d.data() as AlumniProfile);
}

import { doc, collection, setDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/firebase/config";
import type { EngagementLog, EngagementAction } from "@/types";

/**
 * Record an engagement event. Called from the write paths that cause it
 * (profile save, mentorship request sent/accepted/rejected) rather than
 * from the UI directly, so a log is never missed or duplicated by a retry.
 */
export async function logEngagement(
  userId: string,
  action: EngagementAction,
  relatedUserId?: string
): Promise<void> {
  const ref = doc(collection(db, "engagementLogs"));
  const log: EngagementLog = {
    logId: ref.id,
    userId,
    action,
    timestamp: Date.now(),
    ...(relatedUserId ? { relatedUserId } : {}),
  };
  await setDoc(ref, log);
}

/**
 * Most recent engagement events across all users, for the admin
 * "engagement activity" view (Phase 5).
 */
export async function getRecentEngagementLogs(count = 25): Promise<EngagementLog[]> {
  const q = query(collection(db, "engagementLogs"), orderBy("timestamp", "desc"), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as EngagementLog);
}

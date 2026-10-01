import {
  doc,
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import type { OpportunityDoc, OpportunityType } from "@/types";

export type OpportunityInput = Omit<
  OpportunityDoc,
  "opportunityId" | "postedBy" | "createdAt"
>;

/** Admin: post a new job or internship opportunity. */
export async function createOpportunity(
  adminId: string,
  input: OpportunityInput
): Promise<OpportunityDoc> {
  const ref = doc(collection(db, "opportunities"));
  const opportunity: OpportunityDoc = {
    opportunityId: ref.id,
    ...input,
    postedBy: adminId,
    createdAt: Date.now(),
  };
  await setDoc(ref, opportunity);
  return opportunity;
}

/** Admin: update an existing opportunity. */
export async function updateOpportunity(
  opportunityId: string,
  input: Partial<OpportunityInput>
): Promise<void> {
  const ref = doc(db, "opportunities", opportunityId);
  await updateDoc(ref, input as Record<string, unknown>);
}

/** Admin: delete an opportunity. */
export async function deleteOpportunity(opportunityId: string): Promise<void> {
  await deleteDoc(doc(db, "opportunities", opportunityId));
}

/** All opportunities, newest first. */
export async function getOpportunities(
  type?: OpportunityType
): Promise<OpportunityDoc[]> {
  const ref = collection(db, "opportunities");
  try {
    const q = type
      ? query(ref, where("type", "==", type), orderBy("createdAt", "desc"))
      : query(ref, orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as OpportunityDoc);
  } catch (err: unknown) {
    const q = type ? query(ref, where("type", "==", type)) : query(ref);
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => d.data() as OpportunityDoc);
    return items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }
}

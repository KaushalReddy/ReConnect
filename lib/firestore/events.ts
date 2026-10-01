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
import type { EventDoc } from "@/types";

export type EventInput = Omit<EventDoc, "eventId" | "createdBy" | "createdAt">;

/** Admin: create a new event. */
export async function createEvent(
  adminId: string,
  input: EventInput
): Promise<EventDoc> {
  const ref = doc(collection(db, "events"));
  const event: EventDoc = {
    eventId: ref.id,
    ...input,
    createdBy: adminId,
    createdAt: Date.now(),
  };
  await setDoc(ref, event);
  return event;
}

/** Admin: update an existing event. */
export async function updateEvent(
  eventId: string,
  input: Partial<EventInput>
): Promise<void> {
  const ref = doc(db, "events", eventId);
  await updateDoc(ref, input as Record<string, unknown>);
}

/** Admin: delete an event. */
export async function deleteEvent(eventId: string): Promise<void> {
  await deleteDoc(doc(db, "events", eventId));
}

/** All upcoming events (date >= now), ordered by date ascending. */
export async function getUpcomingEvents(): Promise<EventDoc[]> {
  const q = query(
    collection(db, "events"),
    where("date", ">=", Date.now()),
    orderBy("date", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as EventDoc);
}

/** All events (upcoming + past), for the admin panel. */
export async function getAllEvents(): Promise<EventDoc[]> {
  const q = query(collection(db, "events"), orderBy("date", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as EventDoc);
}

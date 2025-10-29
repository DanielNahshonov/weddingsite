import type { Collection, DeleteResult } from "mongodb";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";

export type GuestLanguage = "ru" | "he";

export interface GuestRecord {
  firstName: string;
  lastName: string;
  phone: string;
  partySize: number;
  attending: boolean | null;
  language: GuestLanguage;
  lastInviteSentAt: Date | null;
  updatedAt: Date;
  createdAt: Date;
}

export type GuestDocument = GuestRecord & { _id: ObjectId };

export interface GuestInput {
  firstName: string;
  lastName: string;
  phone: string;
  partySize: number;
  attending?: boolean | null;
  language: GuestLanguage;
}

export interface GuestUpdateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  partySize?: number;
  attending?: boolean | null;
  language?: GuestLanguage;
  lastInviteSentAt?: Date | null;
}

let indexesInitialised = false;

async function guestsCollection() {
  const db = await getDatabase();
  const collection: Collection<GuestRecord> = db.collection("guests");

  if (!indexesInitialised) {
    await collection.createIndex({ phone: 1 }, { unique: true });
    indexesInitialised = true;
  }

  return collection;
}

export async function createGuest(data: GuestInput) {
  const col = await guestsCollection();
  const now = new Date();
  const newGuest: GuestRecord = {
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    partySize: data.partySize,
    attending: data.attending ?? null,
    language: data.language,
    lastInviteSentAt: null,
    createdAt: now,
    updatedAt: now,
  };
  const result = await col.insertOne(newGuest);

  return result.insertedId;
}

export async function upsertGuestByPhone(data: GuestInput) {
  const col = await guestsCollection();
  const now = new Date();
  const result = (await col.findOneAndUpdate(
    { phone: data.phone },
    {
      $set: {
        firstName: data.firstName,
        lastName: data.lastName,
        partySize: data.partySize,
        attending: data.attending ?? null,
        language: data.language,
        updatedAt: now,
      },
      $setOnInsert: {
        language: data.language,
        lastInviteSentAt: null,
        createdAt: now,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
    },
  )) as { value?: GuestDocument | null } | null;

  return result?.value ?? null;
}

export async function findGuestById(id: string) {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  const col = await guestsCollection();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  return doc as GuestDocument | null;
}

export async function listGuests() {
  const col = await guestsCollection();
  const docs = await col
    .find({})
    .sort({ updatedAt: -1 })
    .toArray();

  return docs as GuestDocument[];
}

export async function deleteGuest(id: string) {
  if (!ObjectId.isValid(id)) {
    return { acknowledged: false, deletedCount: 0 } satisfies DeleteResult;
  }
  const col = await guestsCollection();
  return col.deleteOne({ _id: new ObjectId(id) });
}

export async function updateGuest(id: string, data: GuestUpdateData) {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  const col = await guestsCollection();
  const now = new Date();
  const update: Record<string, unknown> = {
    updatedAt: now,
  };

  if ("firstName" in data) {
    update.firstName = data.firstName;
  }
  if ("lastName" in data) {
    update.lastName = data.lastName;
  }
  if ("phone" in data) {
    update.phone = data.phone;
  }
  if ("partySize" in data) {
    update.partySize = data.partySize;
  }
  if ("attending" in data) {
    update.attending = data.attending ?? null;
  }
  if ("language" in data && data.language) {
    update.language = data.language;
  }
  if ("lastInviteSentAt" in data) {
    update.lastInviteSentAt =
      data.lastInviteSentAt !== undefined ? data.lastInviteSentAt : null;
  }

  const result = (await col.findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: update,
    },
    { returnDocument: "after" },
  )) as { value?: GuestDocument | null } | null;

  return result?.value ?? null;
}

export async function markInvitationSent(id: string) {
  return updateGuest(id, { lastInviteSentAt: new Date() });
}

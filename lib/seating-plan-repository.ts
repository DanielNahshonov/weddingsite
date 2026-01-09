import type { Collection } from "mongodb";
import { ObjectId } from "mongodb";
import { randomUUID } from "crypto";
import { getDatabase } from "@/lib/mongodb";

export type SeatingTableType = "round" | "rect";

export interface SeatingTable {
  id: string;
  label: string;
  type: SeatingTableType;
  x: number;
  y: number;
  rotation: number;
  capacity: number;
  guestIds: string[];
}

export interface SeatingPlanRecord {
  slug: string;
  name: string;
  width: number;
  height: number;
  tables: SeatingTable[];
  createdAt: Date;
  updatedAt: Date;
}

export type SeatingPlanDocument = SeatingPlanRecord & { _id: ObjectId };

export interface SeatingPlanInput {
  slug: string;
  name: string;
  width: number;
  height: number;
  tables?: SeatingTable[];
}

export interface SeatingPlanUpdate {
  name?: string;
  width?: number;
  height?: number;
  tables?: SeatingTable[];
}

let seatingIndexesInitialised = false;

async function seatingPlansCollection() {
  const db = await getDatabase();
  const collection: Collection<SeatingPlanRecord> = db.collection("seatingPlans");

  if (!seatingIndexesInitialised) {
    await collection.createIndex({ slug: 1 }, { unique: true });
    seatingIndexesInitialised = true;
  }

  return collection;
}

export function createTablePlaceholder(data?: Partial<SeatingTable>): SeatingTable {
  return {
    id: randomUUID(),
    label: data?.label ?? "Стол",
    type: data?.type ?? "round",
    x: data?.x ?? 100,
    y: data?.y ?? 100,
    rotation: data?.rotation ?? 0,
    capacity: data?.capacity ?? 8,
    guestIds: data?.guestIds ?? [],
  };
}

export async function getSeatingPlan(slug: string) {
  const col = await seatingPlansCollection();
  const plan = await col.findOne({ slug });
  return plan as SeatingPlanDocument | null;
}

export async function upsertSeatingPlan(input: SeatingPlanInput) {
  const col = await seatingPlansCollection();
  const now = new Date();

  const result = await col.findOneAndUpdate(
    { slug: input.slug },
    {
      $set: {
        name: input.name,
        width: input.width,
        height: input.height,
        tables: input.tables ?? [],
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
    },
  );

  return (result ?? null) as SeatingPlanDocument | null;
}

export async function updateSeatingPlan(slug: string, update: SeatingPlanUpdate) {
  const col = await seatingPlansCollection();
  const now = new Date();
  const setUpdate: Partial<SeatingPlanRecord> = {
    updatedAt: now,
  };

  if (typeof update.name === "string") {
    setUpdate.name = update.name;
  }
  if (typeof update.width === "number") {
    setUpdate.width = update.width;
  }
  if (typeof update.height === "number") {
    setUpdate.height = update.height;
  }
  if (Array.isArray(update.tables)) {
    setUpdate.tables = update.tables;
  }

  const result = await col.findOneAndUpdate(
    { slug },
    { $set: setUpdate },
    { returnDocument: "after" },
  );

  return (result ?? null) as SeatingPlanDocument | null;
}

export async function removeTable(slug: string, tableId: string) {
  const col = await seatingPlansCollection();
  const plan = await col.findOne({ slug });
  if (!plan) {
    return null;
  }

  const tables = plan.tables.filter((table) => table.id !== tableId);
  return updateSeatingPlan(slug, { tables });
}

export async function replaceTable(slug: string, table: SeatingTable) {
  const col = await seatingPlansCollection();
  const plan = await col.findOne({ slug });
  if (!plan) {
    return null;
  }

  const tables = plan.tables.map((existing) =>
    existing.id === table.id ? table : existing,
  );

  if (!tables.some((existing) => existing.id === table.id)) {
    tables.push(table);
  }

  return updateSeatingPlan(slug, { tables });
}

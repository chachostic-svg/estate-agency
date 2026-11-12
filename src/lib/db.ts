import fs from "fs";
import path from "path";
import { DatabaseSchema, Lead, LeadStatus, Property } from "@/types/estate";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

const DEFAULT_DB: DatabaseSchema = {
  properties: [],
  leads: [],
};

export function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), "utf-8");
      return DEFAULT_DB;
    }
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw) as DatabaseSchema;
  } catch (error) {
    console.error("Failed to read DB:", error);
    return DEFAULT_DB;
  }
}

export function writeDb(data: DatabaseSchema): void {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function getProperties(): Property[] {
  return readDb().properties;
}

export function addProperty(
  input: Omit<Property, "id" | "createdAt">
): Property {
  const db = readDb();
  const newProp: Property = {
    ...input,
    id: `prop-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  db.properties.unshift(newProp);
  writeDb(db);
  return newProp;
}

export function deleteProperty(id: string): boolean {
  const db = readDb();
  const initialLength = db.properties.length;
  db.properties = db.properties.filter((p) => p.id !== id);
  if (db.properties.length !== initialLength) {
    writeDb(db);
    return true;
  }
  return false;
}

export function getLeads(): Lead[] {
  return readDb().leads;
}

export function addLead(
  input: Omit<Lead, "id" | "createdAt" | "status"> & { status?: LeadStatus }
): Lead {
  const db = readDb();
  const newLead: Lead = {
    ...input,
    id: `lead-${Date.now()}`,
    status: input.status || "new",
    createdAt: new Date().toISOString(),
  };
  db.leads.unshift(newLead);
  writeDb(db);
  return newLead;
}

export function updateLeadStatus(id: string, status: LeadStatus): Lead | null {
  const db = readDb();
  const lead = db.leads.find((l) => l.id === id);
  if (!lead) return null;
  lead.status = status;
  writeDb(db);
  return lead;
}

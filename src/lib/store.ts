import fs from "fs/promises";
import path from "path";
import { UserProfile, TrackingRecord, Opportunity, SecurityLog } from "../types";

const DATA_DIR = path.join(process.cwd(), "data");
const PROFILE_FILE = path.join(DATA_DIR, "profile.json");
const TRACKING_FILE = path.join(DATA_DIR, "tracking.json");
const OPPORTUNITIES_FILE = path.join(DATA_DIR, "opportunities.json");
const SECURITY_LOGS_FILE = path.join(DATA_DIR, "security_logs.json");

// Ensure data directory and files exist
async function initStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  
  const files = [
    { path: PROFILE_FILE, defaultContent: "{}" },
    { path: TRACKING_FILE, defaultContent: "[]" },
    { path: OPPORTUNITIES_FILE, defaultContent: "[]" },
    { path: SECURITY_LOGS_FILE, defaultContent: "[]" }
  ];

  for (const file of files) {
    try {
      await fs.access(file.path);
    } catch {
      await fs.writeFile(file.path, file.defaultContent, "utf-8");
    }
  }
}

// User Profile
export async function getUserProfile(): Promise<UserProfile | null> {
  await initStore();
  const data = await fs.readFile(PROFILE_FILE, "utf-8");
  const parsed = JSON.parse(data);
  return Object.keys(parsed).length === 0 ? null : (parsed as UserProfile);
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await initStore();
  await fs.writeFile(PROFILE_FILE, JSON.stringify(profile, null, 2), "utf-8");
}

// Tracking Records
export async function getTrackingRecords(): Promise<TrackingRecord[]> {
  await initStore();
  const data = await fs.readFile(TRACKING_FILE, "utf-8");
  return JSON.parse(data) as TrackingRecord[];
}

export async function saveTrackingRecord(record: TrackingRecord): Promise<void> {
  const records = await getTrackingRecords();
  const index = records.findIndex((r) => r.opportunity_id === record.opportunity_id);
  
  if (index >= 0) {
    records[index] = record;
  } else {
    records.push(record);
  }
  
  await fs.writeFile(TRACKING_FILE, JSON.stringify(records, null, 2), "utf-8");
}

// Opportunities
export async function getOpportunities(): Promise<Opportunity[]> {
  await initStore();
  const data = await fs.readFile(OPPORTUNITIES_FILE, "utf-8");
  return JSON.parse(data) as Opportunity[];
}

export async function saveOpportunities(opportunities: Opportunity[]): Promise<void> {
  await initStore();
  await fs.writeFile(OPPORTUNITIES_FILE, JSON.stringify(opportunities, null, 2), "utf-8");
}

// Security Logs
export async function getSecurityLogs(): Promise<SecurityLog[]> {
  await initStore();
  const data = await fs.readFile(SECURITY_LOGS_FILE, "utf-8");
  return JSON.parse(data) as SecurityLog[];
}

export async function saveSecurityLog(log: SecurityLog): Promise<void> {
  const logs = await getSecurityLogs();
  logs.unshift(log); // Add to beginning
  await fs.writeFile(SECURITY_LOGS_FILE, JSON.stringify(logs, null, 2), "utf-8");
}

// Email Opportunities
const EMAIL_OPPS_FILE = path.join(DATA_DIR, "email_opportunities.json");

export async function getEmailOpportunities(): Promise<any[]> {
  try {
    await fs.access(EMAIL_OPPS_FILE);
  } catch {
    await fs.writeFile(EMAIL_OPPS_FILE, "[]", "utf-8");
  }
  const data = await fs.readFile(EMAIL_OPPS_FILE, "utf-8");
  return JSON.parse(data);
}

export async function saveEmailOpportunities(opps: any[]): Promise<void> {
  await fs.writeFile(EMAIL_OPPS_FILE, JSON.stringify(opps, null, 2), "utf-8");
}

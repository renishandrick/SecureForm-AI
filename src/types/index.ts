// Stage 1 - User Profile
export interface Education {
  degree: string;
  institution: string;
  cgpa: number;
  year: number;
}

export interface Experience {
  role: string;
  org: string;
  duration: string;
  description: string;
}

export interface Documents {
  resume_url: string;
  transcript_url: string;
}

export interface Preferences {
  opportunity_types: string[];
  locations: string[];
  min_stipend: number;
}

export interface UserProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  education: Education[];
  skills: string[];
  certifications: string[];
  experience: Experience[];
  documents: Documents;
  preferences: Preferences;
}

// Stage 2 - Opportunity
export interface Requirements {
  min_cgpa: number;
  required_skills: string[];
  eligibility_text: string;
}

export interface Opportunity {
  opportunity_id: string;
  title: string;
  org: string;
  type: "scholarship" | "internship" | "job";
  requirements: Requirements;
  deadline: string | null; // ISO-8601 or null
  apply_url: string;
  data_quality: "complete" | "incomplete";
}

// Stage 3 - Eligibility
export interface EligibilityResult {
  opportunity_id: string;
  verdict: "eligible" | "not_eligible" | "uncertain";
  reasons: string[];
}

// Stage 4 - Security Check
export interface SecurityCheckResult {
  apply_url: string;
  classification: "safe" | "suspicious" | "unsafe";
  signals: string[];
  user_override: boolean;
}

// Stage 5 - Auto-Fill Form
export interface FieldMapping {
  field_name: string;
  value: string;
  source: "profile" | "ai_generated" | "unmapped";
  confidence: number;
}

export interface AutoFillResult {
  opportunity_id: string;
  field_mappings: FieldMapping[];
}

// Stage 8 - Tracking
export interface TrackingRecord {
  opportunity_id: string;
  org: string;
  title: string;
  status: "submitted" | "confirmed" | "interview" | "selected" | "rejected" | "awaiting_update";
  last_updated: string;
}

// Stage 9 - Updates
export interface EmailUpdate {
  email_id: string;
  opportunity_id: string | null;
  category: "application_confirmation" | "interview" | "selection" | "rejection" | "deadline_update" | "unrelated";
  confidence: number;
  needs_review: boolean;
}

// Security Logs
export interface SecurityLog {
  id: string;
  url: string;
  timestamp: string;
  classification: "safe" | "suspicious" | "unsafe";
  signals: string[];
}

// Code Scanner
export interface CodeScannerResult {
  repoUrl: string;
  status: "safe" | "vulnerable" | "error";
  hardcoded_secrets: string[];
  vulnerabilities: {
    package: string;
    version: string;
    vulnerability: any;
  }[];
}

// Infra Scanner
export interface InfraScannerResult {
  target: string;
  status: "secure" | "vulnerable" | "error";
  open_ports: number[];
  security_headers: {
    cors: boolean;
    csp: boolean;
    hsts: boolean;
    details: Record<string, string>;
  };
}

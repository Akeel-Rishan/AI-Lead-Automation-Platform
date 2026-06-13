export type TenantPlan = "starter" | "pro" | "enterprise" | string;
export type UserRole = "owner" | "admin" | "agent" | string;
export type LeadSource =
  | "website"
  | "facebook"
  | "google"
  | "sms"
  | "email"
  | "phone"
  | "manual"
  | string;
export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "unqualified"
  | "converted"
  | "lost"
  | string;
export type Urgency = "low" | "medium" | "high" | string;
export type Qualification = "cold" | "warm" | "hot" | string;
export type MessageDirection = "inbound" | "outbound" | string;
export type MessageChannel = "sms" | "email" | "chat" | "internal" | string;
export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "cancelled"
  | "completed"
  | string;
export type FollowUpStatus = "pending" | "sent" | "failed" | "skipped" | string;
export type AutomationTrigger =
  | "new_lead"
  | "qualified"
  | "no_response"
  | "appointment_booked"
  | string;

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  industry?: string | null;
  plan: TenantPlan;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  tenantId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  source: LeadSource;
  status: LeadStatus;
  service?: string | null;
  urgency?: Urgency | null;
  budget?: string | null;
  leadScore?: number | null;
  qualification?: Qualification | null;
  notes?: string | null;
  assignedTo?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadQualification {
  id: string;
  leadId: string;
  service?: string | null;
  urgency?: Urgency | null;
  budget?: string | null;
  leadScore: number;
  qualification: Qualification;
  intent?: string | null;
  rawResponse?: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  leadId: string;
  tenantId: string;
  direction: MessageDirection;
  channel: MessageChannel;
  content: string;
  status: "sent" | "delivered" | "failed" | "read" | string;
  sentAt: string;
  metadata?: Record<string, unknown> | null;
}

export interface KnowledgeDoc {
  id: string;
  tenantId: string;
  name: string;
  type: "pdf" | "txt" | "docx" | "faq" | "pricing" | "policy" | string;
  content: string;
  fileUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  leadId: string;
  tenantId: string;
  title: string;
  scheduledAt: string;
  duration: number;
  status: AppointmentStatus;
  calEventId?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUp {
  id: string;
  leadId: string;
  tenantId: string;
  stepNumber: number;
  channel: "sms" | "email" | string;
  status: FollowUpStatus;
  scheduledAt: string;
  sentAt?: string | null;
  content: string;
}

export interface AutomationStep {
  id: string;
  sequenceId: string;
  stepNumber: number;
  delayHours: number;
  channel: "sms" | "email" | string;
  templateBody: string;
  subject?: string | null;
  createdAt: string;
}

export interface AutomationSequence {
  id: string;
  tenantId: string;
  name: string;
  trigger: AutomationTrigger;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  steps?: AutomationStep[];
}

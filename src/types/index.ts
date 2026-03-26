// ────────────────────────────────────────────────
//  Tipos compartilhados – Apollo Interface Hub
// ────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface City {
  id: string;
  name: string;
  state: string;
  active: boolean;
  createdAt: string;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  linkedin?: string;
  companyId?: string;
  companyName?: string;
  city?: string;
  state?: string;
  tags: string[];
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  segment?: string;
  website?: string;
  city?: string;
  state?: string;
  employees?: number;
  annualRevenue?: string;
  status: "active" | "inactive" | "prospect";
  temperature: "hot" | "warm" | "cold";
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "done";
  priority: "low" | "normal" | "high" | "critical";
  dueDate?: string;
  personId?: string;
  personName?: string;
  companyId?: string;
  companyName?: string;
  funnelId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SequenceStep {
  id: string;
  order: number;
  type: "whatsapp" | "email" | "call" | "task" | "linkedin";
  content: string;
  delayDays: number; // absolute day number (Dia 1, Dia 3, etc.)
  personId?: string;
  personName?: string;
}

export interface Sequence {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  playType?: string;
  steps: SequenceStep[];
  contactIds: string[];
  companyIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppMessage {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  direction: "in" | "out";
  content: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
}

export interface WhatsAppConversation {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  messages: WhatsAppMessage[];
}

export interface FunnelStage {
  id: string;
  title: string;
  description?: string;
  color: string;
  order: number;
}

export interface DealHistoryEntry {
  id: string;
  type: "created" | "stage_moved" | "note";
  description: string;
  date: string;
}

export interface DealTask {
  id: string;
  title: string;
  status: "pending" | "done";
  dueDate?: string;
  createdAt: string;
}

export interface DealProduct {
  id: string;
  name: string;
  quantity: number;
  unitPrice: string;
}

export interface DealFile {
  id: string;
  name: string;
  url?: string;
  uploadedAt: string;
}

export interface DealProposal {
  id: string;
  title: string;
  value: string;
  status: "draft" | "sent" | "accepted" | "rejected";
  createdAt: string;
}

export interface DealEmail {
  id: string;
  subject: string;
  body: string;
  direction: "in" | "out";
  sentAt: string;
}

export interface FunnelCard {
  id: string;
  companyId?: string;
  companyName: string;
  temperature: "hot" | "warm" | "cold";
  revenue: string;
  stageId: string;
  funnelId: string;
  createdAt: string;
  // Extended deal fields
  title?: string;
  qualification?: string;
  totalValue?: string;
  forecastDate?: string;
  campaign?: string;
  source?: string;
  contactIds?: string[];
  responsibleId?: string;
  responsibleName?: string;
  history?: DealHistoryEntry[];
  dealTasks?: DealTask[];
  products?: DealProduct[];
  files?: DealFile[];
  proposals?: DealProposal[];
  emails?: DealEmail[];
}

export interface Funnel {
  id: string;
  name: string;
  stages: FunnelStage[];
  cards: FunnelCard[];
  createdAt: string;
}

export interface FunnelTransition {
  id: string;
  label?: string;
  sourceFunnelId: string;
  sourceStageId: string;
  targetFunnelId: string;
  targetStageId: string;
  active: boolean;
  createdAt: string;
}

// ── Agentes de IA ────────────────────────────────────────────

export interface Agent {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  model: "openai" | "gemini";
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Growth Lab ────────────────────────────────────

export type GrowthCategory = "acquisition" | "activation" | "retention" | "revenue" | "referral";
export type GrowthStatus   = "backlog" | "running" | "done" | "killed";

export interface GrowthExperiment {
  id: string;
  weekId: string;
  hypothesis: string;
  category: GrowthCategory;
  status: GrowthStatus;
  impact: number;     // 1–10
  confidence: number; // 1–10
  ease: number;       // 1–10
  iceScore: number;   // (impact + confidence + ease) / 3
  result?: string;
  learnings?: string;
  owner?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GrowthWeek {
  id: string;
  week: string;      // "2026-W12"
  northStar: string; // objetivo qualitativo
  metric: string;    // nome da métrica
  target: number;
  current: number;
  createdAt: string;
}

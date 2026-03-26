// ────────────────────────────────────────────────────────────
//  Camada de dados – Supabase (substitui localStorage)
// ────────────────────────────────────────────────────────────
import { supabase } from "./supabase";
import type { Person, Company, Task, Sequence, WhatsAppConversation, Funnel, City, GrowthWeek, GrowthExperiment, FunnelTransition, Agent } from "@/types";

// helper: lança erro se houver
function unwrap<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  return data as T;
}

// ─── Cidades ─────────────────────────────────────────────────
export const CityDB = {
  async getAll(): Promise<City[]> {
    const { data, error } = await supabase.from("cities").select("*").order("name");
    return unwrap(data, error) ?? [];
  },
  async save(d: Omit<City, "id" | "createdAt">): Promise<City> {
    const { data, error } = await supabase.from("cities").insert({
      name: d.name, state: d.state, active: d.active,
    }).select().single();
    return unwrap(data, error);
  },
  async update(id: string, d: Partial<City>): Promise<void> {
    const { error } = await supabase.from("cities").update(d).eq("id", id);
    if (error) throw new Error(error.message);
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("cities").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

// ─── Empresas ────────────────────────────────────────────────
export const CompanyDB = {
  async getAll(): Promise<Company[]> {
    const { data, error } = await supabase.from("companies").select("*").order("name");
    return (unwrap(data, error) ?? []).map(toCompany);
  },
  async save(d: Omit<Company, "id" | "createdAt" | "updatedAt">): Promise<Company> {
    const { data, error } = await supabase.from("companies").insert(fromCompany(d)).select().single();
    return toCompany(unwrap(data, error));
  },
  async update(id: string, d: Partial<Company>): Promise<void> {
    const { error } = await supabase.from("companies")
      .update({ ...fromCompany(d as Company), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

function fromCompany(d: Partial<Company>) {
  return {
    name: d.name, cnpj: d.cnpj, segment: d.segment, website: d.website,
    city: d.city, state: d.state, employees: d.employees,
    annual_revenue: d.annualRevenue, status: d.status,
    temperature: d.temperature, tags: d.tags,
  };
}
function toCompany(r: Record<string, unknown>): Company {
  return {
    id: r.id as string,
    name: r.name as string,
    cnpj: r.cnpj as string,
    segment: r.segment as string,
    website: r.website as string,
    city: r.city as string,
    state: r.state as string,
    employees: r.employees as number,
    annualRevenue: r.annual_revenue as string,
    status: r.status as Company["status"],
    temperature: r.temperature as Company["temperature"],
    tags: (r.tags as string[]) ?? [],
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

// ─── Pessoas ─────────────────────────────────────────────────
export const PersonDB = {
  async getAll(): Promise<Person[]> {
    const { data, error } = await supabase.from("people").select("*").order("name");
    return (unwrap(data, error) ?? []).map(toPerson);
  },
  async save(d: Omit<Person, "id" | "createdAt" | "updatedAt">): Promise<Person> {
    const { data, error } = await supabase.from("people").insert(fromPerson(d)).select().single();
    return toPerson(unwrap(data, error));
  },
  async update(id: string, d: Partial<Person>): Promise<void> {
    const { error } = await supabase.from("people")
      .update({ ...fromPerson(d as Person), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("people").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

function fromPerson(d: Partial<Person>) {
  return {
    name: d.name, email: d.email, phone: d.phone, role: d.role,
    linkedin: d.linkedin || null,
    company_id: d.companyId || null,
    company_name: d.companyName,
    city: d.city, state: d.state, tags: d.tags, status: d.status,
  };
}
function toPerson(r: Record<string, unknown>): Person {
  return {
    id: r.id as string,
    name: r.name as string,
    email: r.email as string,
    phone: r.phone as string,
    role: r.role as string,
    linkedin: (r.linkedin as string) || undefined,
    companyId: r.company_id as string,
    companyName: r.company_name as string,
    city: r.city as string,
    state: r.state as string,
    tags: (r.tags as string[]) ?? [],
    status: r.status as Person["status"],
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

// ─── Tarefas ─────────────────────────────────────────────────
export const TaskDB = {
  async getAll(): Promise<Task[]> {
    const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    return (unwrap(data, error) ?? []).map(toTask);
  },
  async save(d: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<Task> {
    const { data, error } = await supabase.from("tasks").insert(fromTask(d)).select().single();
    return toTask(unwrap(data, error));
  },
  async update(id: string, d: Partial<Task>): Promise<void> {
    const { error } = await supabase.from("tasks")
      .update({ ...fromTask(d as Task), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

function fromTask(d: Partial<Task>) {
  return {
    title: d.title, description: d.description, status: d.status,
    priority: d.priority, due_date: d.dueDate || null,
    person_id: d.personId || null, person_name: d.personName,
    company_id: d.companyId || null, company_name: d.companyName,
  };
}
function toTask(r: Record<string, unknown>): Task {
  return {
    id: r.id as string,
    title: r.title as string,
    description: r.description as string,
    status: r.status as Task["status"],
    priority: r.priority as Task["priority"],
    dueDate: r.due_date as string,
    personId: r.person_id as string,
    personName: r.person_name as string,
    companyId: r.company_id as string,
    companyName: r.company_name as string,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

// ─── Sequências ──────────────────────────────────────────────
export const SequenceDB = {
  async getAll(): Promise<Sequence[]> {
    const { data, error } = await supabase.from("sequences").select("*").order("name");
    return (unwrap(data, error) ?? []).map(toSequence);
  },
  async save(d: Omit<Sequence, "id" | "createdAt" | "updatedAt">): Promise<Sequence> {
    const { data, error } = await supabase.from("sequences").insert({
      name: d.name, description: d.description, active: d.active,
      steps: d.steps, contact_ids: d.contactIds, company_ids: d.companyIds,
    }).select().single();
    return toSequence(unwrap(data, error));
  },
  async update(id: string, d: Partial<Sequence>): Promise<void> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (d.name        !== undefined) patch.name        = d.name;
    if (d.description !== undefined) patch.description = d.description;
    if (d.active      !== undefined) patch.active      = d.active;
    if (d.steps       !== undefined) patch.steps       = d.steps;
    if (d.contactIds  !== undefined) patch.contact_ids = d.contactIds;
    if (d.companyIds  !== undefined) patch.company_ids = d.companyIds;
    const { error } = await supabase.from("sequences").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("sequences").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

function toSequence(r: Record<string, unknown>): Sequence {
  return {
    id: r.id as string,
    name: r.name as string,
    description: r.description as string,
    active: r.active as boolean,
    steps: (r.steps as Sequence["steps"]) ?? [],
    contactIds: (r.contact_ids as string[]) ?? [],
    companyIds: (r.company_ids as string[]) ?? [],
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

// ─── WhatsApp ────────────────────────────────────────────────
export const WhatsAppDB = {
  async getAll(): Promise<WhatsAppConversation[]> {
    const { data, error } = await supabase
      .from("whatsapp_conversations").select("*")
      .order("last_message_at", { ascending: false });
    return (unwrap(data, error) ?? []).map(toConv);
  },
  async save(d: Omit<WhatsAppConversation, "id">): Promise<WhatsAppConversation> {
    const { data, error } = await supabase.from("whatsapp_conversations").insert({
      contact_id: d.contactId, contact_name: d.contactName,
      contact_phone: d.contactPhone, last_message: d.lastMessage,
      last_message_at: d.lastMessageAt, unread: d.unread, messages: d.messages,
    }).select().single();
    return toConv(unwrap(data, error));
  },
  async update(id: string, d: Partial<WhatsAppConversation>): Promise<void> {
    const patch: Record<string, unknown> = {};
    if (d.messages       !== undefined) patch.messages        = d.messages;
    if (d.lastMessage    !== undefined) patch.last_message    = d.lastMessage;
    if (d.lastMessageAt  !== undefined) patch.last_message_at = d.lastMessageAt;
    if (d.unread         !== undefined) patch.unread          = d.unread;
    const { error } = await supabase.from("whatsapp_conversations").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
  },
};

function toConv(r: Record<string, unknown>): WhatsAppConversation {
  return {
    id: r.id as string,
    contactId: r.contact_id as string,
    contactName: r.contact_name as string,
    contactPhone: r.contact_phone as string,
    lastMessage: r.last_message as string,
    lastMessageAt: r.last_message_at as string,
    unread: r.unread as number,
    messages: (r.messages as WhatsAppConversation["messages"]) ?? [],
  };
}

// ─── Agentes de IA ───────────────────────────────────────────
export const AgentDB = {
  async getAll(): Promise<Agent[]> {
    const { data, error } = await supabase.from("agents").select("*").order("created_at");
    return (unwrap(data, error) ?? []).map(toAgent);
  },
  async save(d: Omit<Agent, "id" | "createdAt" | "updatedAt">): Promise<Agent> {
    const { data, error } = await supabase.from("agents").insert({
      name: d.name, role: d.role, system_prompt: d.systemPrompt,
      model: d.model ?? "openai", active: d.active,
    }).select().single();
    return toAgent(unwrap(data, error));
  },
  async update(id: string, d: Partial<Agent>): Promise<void> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (d.name         !== undefined) patch.name          = d.name;
    if (d.role         !== undefined) patch.role          = d.role;
    if (d.systemPrompt !== undefined) patch.system_prompt = d.systemPrompt;
    if (d.model        !== undefined) patch.model         = d.model;
    if (d.active       !== undefined) patch.active        = d.active;
    const { error } = await supabase.from("agents").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("agents").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

function toAgent(r: Record<string, unknown>): Agent {
  return {
    id:           r.id as string,
    name:         r.name as string,
    role:         r.role as string,
    systemPrompt: r.system_prompt as string,
    model:        (r.model as Agent["model"]) ?? "openai",
    active:       r.active as boolean,
    createdAt:    r.created_at as string,
    updatedAt:    r.updated_at as string,
  };
}

// ─── Transições de Funil ─────────────────────────────────────
export const FunnelTransitionDB = {
  async getAll(): Promise<FunnelTransition[]> {
    const { data, error } = await supabase.from("funnel_transitions").select("*").order("created_at");
    return (unwrap(data, error) ?? []).map(toTransition);
  },
  async save(d: Omit<FunnelTransition, "id" | "createdAt">): Promise<FunnelTransition> {
    const { data, error } = await supabase.from("funnel_transitions").insert({
      label: d.label ?? null,
      source_funnel_id: d.sourceFunnelId,
      source_stage_id: d.sourceStageId,
      target_funnel_id: d.targetFunnelId,
      target_stage_id: d.targetStageId,
      active: d.active,
    }).select().single();
    return toTransition(unwrap(data, error));
  },
  async update(id: string, d: Partial<FunnelTransition>): Promise<void> {
    const patch: Record<string, unknown> = {};
    if (d.label            !== undefined) patch.label             = d.label;
    if (d.active           !== undefined) patch.active            = d.active;
    if (d.sourceFunnelId   !== undefined) patch.source_funnel_id  = d.sourceFunnelId;
    if (d.sourceStageId    !== undefined) patch.source_stage_id   = d.sourceStageId;
    if (d.targetFunnelId   !== undefined) patch.target_funnel_id  = d.targetFunnelId;
    if (d.targetStageId    !== undefined) patch.target_stage_id   = d.targetStageId;
    const { error } = await supabase.from("funnel_transitions").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("funnel_transitions").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

function toTransition(r: Record<string, unknown>): FunnelTransition {
  return {
    id: r.id as string,
    label: r.label as string | undefined,
    sourceFunnelId: r.source_funnel_id as string,
    sourceStageId: r.source_stage_id as string,
    targetFunnelId: r.target_funnel_id as string,
    targetStageId: r.target_stage_id as string,
    active: r.active as boolean,
    createdAt: r.created_at as string,
  };
}

// ─── Growth Lab ──────────────────────────────────────────────
export const GrowthWeekDB = {
  async getAll(): Promise<GrowthWeek[]> {
    const { data, error } = await supabase.from("growth_weeks").select("*").order("week", { ascending: false });
    return (unwrap(data, error) ?? []).map(toGrowthWeek);
  },
  async save(d: Omit<GrowthWeek, "id" | "createdAt">): Promise<GrowthWeek> {
    const { data, error } = await supabase.from("growth_weeks").insert({
      week: d.week, north_star: d.northStar, metric: d.metric,
      target: d.target, current: d.current,
    }).select().single();
    return toGrowthWeek(unwrap(data, error));
  },
  async update(id: string, d: Partial<GrowthWeek>): Promise<void> {
    const patch: Record<string, unknown> = {};
    if (d.northStar !== undefined) patch.north_star = d.northStar;
    if (d.metric    !== undefined) patch.metric     = d.metric;
    if (d.target    !== undefined) patch.target     = d.target;
    if (d.current   !== undefined) patch.current    = d.current;
    const { error } = await supabase.from("growth_weeks").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("growth_weeks").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

function toGrowthWeek(r: Record<string, unknown>): GrowthWeek {
  return {
    id: r.id as string,
    week: r.week as string,
    northStar: r.north_star as string,
    metric: r.metric as string,
    target: r.target as number,
    current: r.current as number,
    createdAt: r.created_at as string,
  };
}

export const GrowthExperimentDB = {
  async getAll(): Promise<GrowthExperiment[]> {
    const { data, error } = await supabase.from("growth_experiments").select("*").order("created_at", { ascending: false });
    return (unwrap(data, error) ?? []).map(toGrowthExp);
  },
  async getByWeek(weekId: string): Promise<GrowthExperiment[]> {
    const { data, error } = await supabase.from("growth_experiments").select("*")
      .eq("week_id", weekId).order("ice_score", { ascending: false });
    return (unwrap(data, error) ?? []).map(toGrowthExp);
  },
  async save(d: Omit<GrowthExperiment, "id" | "iceScore" | "createdAt" | "updatedAt">): Promise<GrowthExperiment> {
    const ice = Math.round(((d.impact + d.confidence + d.ease) / 3) * 10) / 10;
    const { data, error } = await supabase.from("growth_experiments").insert({
      week_id: d.weekId, hypothesis: d.hypothesis, category: d.category,
      status: d.status, impact: d.impact, confidence: d.confidence,
      ease: d.ease, ice_score: ice,
      result: d.result ?? null, learnings: d.learnings ?? null, owner: d.owner ?? null,
    }).select().single();
    return toGrowthExp(unwrap(data, error));
  },
  async update(id: string, d: Partial<GrowthExperiment>): Promise<void> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (d.hypothesis  !== undefined) patch.hypothesis  = d.hypothesis;
    if (d.category    !== undefined) patch.category    = d.category;
    if (d.status      !== undefined) patch.status      = d.status;
    if (d.impact      !== undefined) patch.impact      = d.impact;
    if (d.confidence  !== undefined) patch.confidence  = d.confidence;
    if (d.ease        !== undefined) patch.ease        = d.ease;
    if (d.result      !== undefined) patch.result      = d.result;
    if (d.learnings   !== undefined) patch.learnings   = d.learnings;
    if (d.owner       !== undefined) patch.owner       = d.owner;
    if (d.impact !== undefined || d.confidence !== undefined || d.ease !== undefined) {
      const impact = (d.impact ?? 5);
      const conf   = (d.confidence ?? 5);
      const ease   = (d.ease ?? 5);
      patch.ice_score = Math.round(((impact + conf + ease) / 3) * 10) / 10;
    }
    const { error } = await supabase.from("growth_experiments").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("growth_experiments").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

function toGrowthExp(r: Record<string, unknown>): GrowthExperiment {
  return {
    id: r.id as string,
    weekId: r.week_id as string,
    hypothesis: r.hypothesis as string,
    category: r.category as GrowthExperiment["category"],
    status: r.status as GrowthExperiment["status"],
    impact: r.impact as number,
    confidence: r.confidence as number,
    ease: r.ease as number,
    iceScore: r.ice_score as number,
    result: r.result as string | undefined,
    learnings: r.learnings as string | undefined,
    owner: r.owner as string | undefined,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

// ─── Funis ───────────────────────────────────────────────────
export const FunnelDB = {
  async getAll(): Promise<Funnel[]> {
    const { data, error } = await supabase.from("funnels").select("*").order("created_at");
    return (unwrap(data, error) ?? []).map(toFunnel);
  },
  async save(d: Omit<Funnel, "id" | "createdAt">): Promise<Funnel> {
    const { data, error } = await supabase.from("funnels").insert({
      name: d.name, stages: d.stages, cards: d.cards,
    }).select().single();
    return toFunnel(unwrap(data, error));
  },
  async update(id: string, d: Partial<Funnel>): Promise<void> {
    const patch: Record<string, unknown> = {};
    if (d.name   !== undefined) patch.name   = d.name;
    if (d.stages !== undefined) patch.stages = d.stages;
    if (d.cards  !== undefined) patch.cards  = d.cards;
    const { error } = await supabase.from("funnels").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("funnels").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

function toFunnel(r: Record<string, unknown>): Funnel {
  return {
    id: r.id as string,
    name: r.name as string,
    stages: (r.stages as Funnel["stages"]) ?? [],
    cards: (r.cards as Funnel["cards"]) ?? [],
    createdAt: r.created_at as string,
  };
}

// ─── Sprint Config ─────────────────────────────────────────────
export interface SprintConfigRow {
  id: string; startDate: string; endDate: string;
  revenueGoal: number; avgTicket: number;
  rateReunToSale: number; rateProspToReun: number;
  targetCompanies: number; active: boolean; createdAt: string;
}
export const SprintConfigDB = {
  async getActive(): Promise<SprintConfigRow | null> {
    const { data, error } = await supabase.from("sprint_config")
      .select("*").eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      id: data.id, startDate: data.start_date, endDate: data.end_date,
      revenueGoal: Number(data.revenue_goal), avgTicket: Number(data.avg_ticket),
      rateReunToSale: Number(data.rate_reun_to_sale), rateProspToReun: Number(data.rate_prosp_to_reun),
      targetCompanies: Number(data.target_companies), active: data.active, createdAt: data.created_at,
    };
  },
  async upsert(d: Omit<SprintConfigRow, "id" | "createdAt">): Promise<SprintConfigRow> {
    // Deactivate old sprints
    await supabase.from("sprint_config").update({ active: false }).eq("active", true);
    const { data, error } = await supabase.from("sprint_config").insert({
      start_date: d.startDate, end_date: d.endDate,
      revenue_goal: d.revenueGoal, avg_ticket: d.avgTicket,
      rate_reun_to_sale: d.rateReunToSale, rate_prosp_to_reun: d.rateProspToReun,
      target_companies: d.targetCompanies, active: true,
    }).select().single();
    const r = unwrap(data, error);
    return {
      id: r.id, startDate: r.start_date, endDate: r.end_date,
      revenueGoal: Number(r.revenue_goal), avgTicket: Number(r.avg_ticket),
      rateReunToSale: Number(r.rate_reun_to_sale), rateProspToReun: Number(r.rate_prosp_to_reun),
      targetCompanies: Number(r.target_companies), active: r.active, createdAt: r.created_at,
    };
  },
  async patch(id: string, d: Partial<Omit<SprintConfigRow, "id" | "createdAt">>): Promise<void> {
    const mapped: Record<string, unknown> = {};
    if (d.startDate        !== undefined) mapped.start_date          = d.startDate;
    if (d.endDate          !== undefined) mapped.end_date            = d.endDate;
    if (d.revenueGoal      !== undefined) mapped.revenue_goal        = d.revenueGoal;
    if (d.avgTicket        !== undefined) mapped.avg_ticket          = d.avgTicket;
    if (d.rateReunToSale   !== undefined) mapped.rate_reun_to_sale   = d.rateReunToSale;
    if (d.rateProspToReun  !== undefined) mapped.rate_prosp_to_reun  = d.rateProspToReun;
    if (d.targetCompanies  !== undefined) mapped.target_companies    = d.targetCompanies;
    const { error } = await supabase.from("sprint_config").update(mapped).eq("id", id);
    if (error) throw new Error(error.message);
  },
};

// ─── Funnel Conversion Stages ─────────────────────────────────
export interface ConversionStageRow {
  id: string; name: string; currentRate: number;
  targetRate: number; avgDays: number; sortOrder: number; createdAt: string;
}
export const ConversionStageDB = {
  async getAll(): Promise<ConversionStageRow[]> {
    const { data, error } = await supabase.from("funnel_conversion_stages")
      .select("*").order("sort_order");
    return (unwrap(data, error) ?? []).map((r) => ({
      id: r.id, name: r.name, currentRate: Number(r.current_rate),
      targetRate: Number(r.target_rate), avgDays: Number(r.avg_days),
      sortOrder: Number(r.sort_order), createdAt: r.created_at,
    }));
  },
  async save(d: Omit<ConversionStageRow, "id" | "createdAt">): Promise<ConversionStageRow> {
    const { data, error } = await supabase.from("funnel_conversion_stages").insert({
      name: d.name, current_rate: d.currentRate, target_rate: d.targetRate,
      avg_days: d.avgDays, sort_order: d.sortOrder,
    }).select().single();
    const r = unwrap(data, error);
    return { id: r.id, name: r.name, currentRate: Number(r.current_rate),
      targetRate: Number(r.target_rate), avgDays: Number(r.avg_days),
      sortOrder: Number(r.sort_order), createdAt: r.created_at };
  },
  async patch(id: string, d: Partial<Omit<ConversionStageRow, "id" | "createdAt">>): Promise<void> {
    const mapped: Record<string, unknown> = {};
    if (d.name        !== undefined) mapped.name         = d.name;
    if (d.currentRate !== undefined) mapped.current_rate = d.currentRate;
    if (d.targetRate  !== undefined) mapped.target_rate  = d.targetRate;
    if (d.avgDays     !== undefined) mapped.avg_days     = d.avgDays;
    if (d.sortOrder   !== undefined) mapped.sort_order   = d.sortOrder;
    const { error } = await supabase.from("funnel_conversion_stages").update(mapped).eq("id", id);
    if (error) throw new Error(error.message);
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("funnel_conversion_stages").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
  async replaceAll(stages: Omit<ConversionStageRow, "id" | "createdAt">[]): Promise<void> {
    await supabase.from("funnel_conversion_stages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (stages.length === 0) return;
    const { error } = await supabase.from("funnel_conversion_stages").insert(
      stages.map((s, i) => ({ name: s.name, current_rate: s.currentRate, target_rate: s.targetRate, avg_days: s.avgDays, sort_order: i }))
    );
    if (error) throw new Error(error.message);
  },
};

// ─── Daily Logs ───────────────────────────────────────────────
export interface DailyLogRow {
  id: string; logDate: string; prospected: number; meetings: number; notes: string; createdAt: string;
}
export const DailyLogDB = {
  async getAll(): Promise<DailyLogRow[]> {
    const { data, error } = await supabase.from("daily_logs").select("*").order("log_date");
    return (unwrap(data, error) ?? []).map((r) => ({
      id: r.id, logDate: r.log_date, prospected: Number(r.prospected),
      meetings: Number(r.meetings), notes: r.notes ?? "", createdAt: r.created_at,
    }));
  },
  async upsertDay(logDate: string, prospected: number, meetings: number, notes = ""): Promise<void> {
    const { error } = await supabase.from("daily_logs").upsert(
      { log_date: logDate, prospected, meetings, notes, updated_at: new Date().toISOString() },
      { onConflict: "log_date" }
    );
    if (error) throw new Error(error.message);
  },
};

// ─── Sprint Progress ──────────────────────────────────────────
export interface SprintProgressRow {
  id: string; sprintId: string; revenueClosed: number;
  forecastValue: number; prospectedTotal: number; reunioesTotal: number; updatedAt: string;
}
export const SprintProgressDB = {
  async get(sprintId: string): Promise<SprintProgressRow | null> {
    const { data, error } = await supabase.from("sprint_progress")
      .select("*").eq("sprint_id", sprintId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      id: data.id, sprintId: data.sprint_id,
      revenueClosed: Number(data.revenue_closed), forecastValue: Number(data.forecast_value),
      prospectedTotal: Number(data.prospected_total), reunioesTotal: Number(data.reunioes_total),
      updatedAt: data.updated_at,
    };
  },
  async upsert(sprintId: string, d: Omit<SprintProgressRow, "id" | "sprintId" | "updatedAt">): Promise<void> {
    const existing = await SprintProgressDB.get(sprintId);
    if (existing) {
      const { error } = await supabase.from("sprint_progress").update({
        revenue_closed: d.revenueClosed, forecast_value: d.forecastValue,
        prospected_total: d.prospectedTotal, reunioes_total: d.reunioesTotal,
        updated_at: new Date().toISOString(),
      }).eq("sprint_id", sprintId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("sprint_progress").insert({
        sprint_id: sprintId, revenue_closed: d.revenueClosed, forecast_value: d.forecastValue,
        prospected_total: d.prospectedTotal, reunioes_total: d.reunioesTotal,
      });
      if (error) throw new Error(error.message);
    }
  },
};

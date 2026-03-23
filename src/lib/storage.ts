// ────────────────────────────────────────────────
//  Camada de persistência – localStorage
// ────────────────────────────────────────────────
import type {
  User, City, Person, Company, Task, Sequence,
  WhatsAppConversation, Funnel,
} from "@/types";

const KEYS = {
  users: "apollo_users",
  currentUser: "apollo_current_user",
  cities: "apollo_cities",
  people: "apollo_people",
  companies: "apollo_companies",
  tasks: "apollo_tasks",
  sequences: "apollo_sequences",
  whatsapp: "apollo_whatsapp",
  funnels: "apollo_funnels",
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function now(): string {
  return new Date().toISOString();
}

// ─── Usuários / Auth ──────────────────────────────
export const AuthStore = {
  getAll: (): User[] => read<User[]>(KEYS.users, []),
  getCurrent: (): User | null => read<User | null>(KEYS.currentUser, null),

  register(name: string, email: string, password: string): { ok: boolean; error?: string } {
    const users = AuthStore.getAll();
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: "E-mail já cadastrado." };
    }
    const user: User = {
      id: uid(),
      name,
      email,
      passwordHash: btoa(password), // simple base64, not for prod
      createdAt: now(),
    };
    write(KEYS.users, [...users, user]);
    const { passwordHash: _, ...safe } = user;
    write(KEYS.currentUser, { ...safe, passwordHash: "" });
    return { ok: true };
  },

  login(email: string, password: string): { ok: boolean; error?: string } {
    const users = AuthStore.getAll();
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === btoa(password)
    );
    if (!user) return { ok: false, error: "E-mail ou senha incorretos." };
    write(KEYS.currentUser, user);
    return { ok: true };
  },

  logout(): void {
    localStorage.removeItem(KEYS.currentUser);
  },
};

// ─── Cidades ──────────────────────────────────────
export const CityStore = {
  getAll: (): City[] => read<City[]>(KEYS.cities, []),
  getActive: (): City[] => CityStore.getAll().filter((c) => c.active),

  save(data: Omit<City, "id" | "createdAt">): City {
    const cities = CityStore.getAll();
    const city: City = { id: uid(), createdAt: now(), ...data };
    write(KEYS.cities, [...cities, city]);
    return city;
  },

  update(id: string, data: Partial<City>): void {
    const cities = CityStore.getAll().map((c) =>
      c.id === id ? { ...c, ...data } : c
    );
    write(KEYS.cities, cities);
  },

  remove(id: string): void {
    write(KEYS.cities, CityStore.getAll().filter((c) => c.id !== id));
  },

  seed(): void {
    if (CityStore.getAll().length > 0) return;
    const defaults = [
      { name: "São Paulo", state: "SP", active: true },
      { name: "Rio de Janeiro", state: "RJ", active: true },
      { name: "Belo Horizonte", state: "MG", active: true },
      { name: "Curitiba", state: "PR", active: true },
      { name: "Porto Alegre", state: "RS", active: true },
      { name: "Brasília", state: "DF", active: true },
      { name: "Salvador", state: "BA", active: false },
      { name: "Recife", state: "PE", active: false },
    ];
    defaults.forEach((d) => CityStore.save(d));
  },
};

// ─── Pessoas ──────────────────────────────────────
export const PersonStore = {
  getAll: (): Person[] => read<Person[]>(KEYS.people, []),

  save(data: Omit<Person, "id" | "createdAt" | "updatedAt">): Person {
    const people = PersonStore.getAll();
    const person: Person = { id: uid(), createdAt: now(), updatedAt: now(), ...data };
    write(KEYS.people, [...people, person]);
    return person;
  },

  update(id: string, data: Partial<Person>): void {
    const people = PersonStore.getAll().map((p) =>
      p.id === id ? { ...p, ...data, updatedAt: now() } : p
    );
    write(KEYS.people, people);
  },

  remove(id: string): void {
    write(KEYS.people, PersonStore.getAll().filter((p) => p.id !== id));
  },
};

// ─── Empresas ─────────────────────────────────────
export const CompanyStore = {
  getAll: (): Company[] => read<Company[]>(KEYS.companies, []),

  save(data: Omit<Company, "id" | "createdAt" | "updatedAt">): Company {
    const companies = CompanyStore.getAll();
    const company: Company = { id: uid(), createdAt: now(), updatedAt: now(), ...data };
    write(KEYS.companies, [...companies, company]);
    return company;
  },

  update(id: string, data: Partial<Company>): void {
    const companies = CompanyStore.getAll().map((c) =>
      c.id === id ? { ...c, ...data, updatedAt: now() } : c
    );
    write(KEYS.companies, companies);
  },

  remove(id: string): void {
    write(KEYS.companies, CompanyStore.getAll().filter((c) => c.id !== id));
  },
};

// ─── Tarefas ──────────────────────────────────────
export const TaskStore = {
  getAll: (): Task[] => read<Task[]>(KEYS.tasks, []),

  save(data: Omit<Task, "id" | "createdAt" | "updatedAt">): Task {
    const tasks = TaskStore.getAll();
    const task: Task = { id: uid(), createdAt: now(), updatedAt: now(), ...data };
    write(KEYS.tasks, [...tasks, task]);
    return task;
  },

  update(id: string, data: Partial<Task>): void {
    const tasks = TaskStore.getAll().map((t) =>
      t.id === id ? { ...t, ...data, updatedAt: now() } : t
    );
    write(KEYS.tasks, tasks);
  },

  remove(id: string): void {
    write(KEYS.tasks, TaskStore.getAll().filter((t) => t.id !== id));
  },
};

// ─── Sequências ───────────────────────────────────
export const SequenceStore = {
  getAll: (): Sequence[] => read<Sequence[]>(KEYS.sequences, []),

  save(data: Omit<Sequence, "id" | "createdAt" | "updatedAt">): Sequence {
    const sequences = SequenceStore.getAll();
    const seq: Sequence = { id: uid(), createdAt: now(), updatedAt: now(), ...data };
    write(KEYS.sequences, [...sequences, seq]);
    return seq;
  },

  update(id: string, data: Partial<Sequence>): void {
    const sequences = SequenceStore.getAll().map((s) =>
      s.id === id ? { ...s, ...data, updatedAt: now() } : s
    );
    write(KEYS.sequences, sequences);
  },

  remove(id: string): void {
    write(KEYS.sequences, SequenceStore.getAll().filter((s) => s.id !== id));
  },
};

// ─── WhatsApp ─────────────────────────────────────
export const WhatsAppStore = {
  getAll: (): WhatsAppConversation[] =>
    read<WhatsAppConversation[]>(KEYS.whatsapp, []),

  save(data: Omit<WhatsAppConversation, "id">): WhatsAppConversation {
    const convs = WhatsAppStore.getAll();
    const conv: WhatsAppConversation = { id: uid(), ...data };
    write(KEYS.whatsapp, [...convs, conv]);
    return conv;
  },

  update(id: string, data: Partial<WhatsAppConversation>): void {
    const convs = WhatsAppStore.getAll().map((c) =>
      c.id === id ? { ...c, ...data } : c
    );
    write(KEYS.whatsapp, convs);
  },
};

// ─── Funis ────────────────────────────────────────
export const FunnelStore = {
  getAll: (): Funnel[] => read<Funnel[]>(KEYS.funnels, []),

  save(data: Omit<Funnel, "id" | "createdAt">): Funnel {
    const funnels = FunnelStore.getAll();
    const funnel: Funnel = { id: uid(), createdAt: now(), ...data };
    write(KEYS.funnels, [...funnels, funnel]);
    return funnel;
  },

  update(id: string, data: Partial<Funnel>): void {
    const funnels = FunnelStore.getAll().map((f) =>
      f.id === id ? { ...f, ...data } : f
    );
    write(KEYS.funnels, funnels);
  },

  remove(id: string): void {
    write(KEYS.funnels, FunnelStore.getAll().filter((f) => f.id !== id));
  },

  seed(): void {
    if (FunnelStore.getAll().length > 0) return;
    const preSales: Funnel = {
      id: uid(),
      name: "PRÉ-VENDAS",
      createdAt: now(),
      cards: [],
      stages: [
        { id: uid(), title: "Prospecção", color: "blue", order: 0 },
        { id: uid(), title: "Qualificação", color: "amber", order: 1 },
        { id: uid(), title: "Reunião Agendada", color: "purple", order: 2 },
        { id: uid(), title: "Qualificado/Passagem", color: "emerald", order: 3 },
      ],
    };
    const sales: Funnel = {
      id: uid(),
      name: "VENDAS",
      createdAt: now(),
      cards: [],
      stages: [
        { id: uid(), title: "Diagnóstico", color: "blue", order: 0 },
        { id: uid(), title: "Proposta", color: "amber", order: 1 },
        { id: uid(), title: "Negociação", color: "purple", order: 2 },
        { id: uid(), title: "Fechado/Ganho", color: "emerald", order: 3 },
        { id: uid(), title: "Fechado/Perdido", color: "red", order: 4 },
      ],
    };
    write(KEYS.funnels, [preSales, sales]);
  },
};

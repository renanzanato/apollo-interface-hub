import { useState, useEffect, useMemo } from "react";
import {
  Send, Plus, Search, Pencil, Trash2, X,
  MessageSquare, Mail, Phone, CheckSquare as TaskIcon, Linkedin,
  ToggleLeft, ToggleRight, Building2, User, Users, BookTemplate, Copy,
  CalendarDays, Zap, Target, TrendingUp, Heart,
} from "lucide-react";
import { SequenceDB, PersonDB, CompanyDB } from "@/lib/db";
import type { Sequence, SequenceStep, Person, Company } from "@/types";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────
interface PersonaForm {
  personId: string;
  personName: string;
  personRole?: string;
  steps: SequenceStep[];
}

interface SequenceTemplate {
  id: string;
  name: string;
  description?: string;
  playType?: string;
  steps: Omit<SequenceStep, "personId" | "personName">[];
  createdAt: string;
}

// ─── Play types ───────────────────────────────────────────────
const PLAY_TYPES = [
  { value: "pre-venda",  label: "Pré-venda",   icon: Zap,        cls: "text-amber-500",   bg: "bg-amber-500/10"  },
  { value: "sales",      label: "Sales R1→R2", icon: Target,     cls: "text-blue-500",    bg: "bg-blue-500/10"   },
  { value: "cs",         label: "CS / Engajamento", icon: Heart, cls: "text-rose-500",    bg: "bg-rose-500/10"   },
  { value: "campanha",   label: "Campanha",    icon: TrendingUp, cls: "text-purple-500",  bg: "bg-purple-500/10" },
] as const;

// ─── Template storage (localStorage) ─────────────────────────
const TEMPLATES_KEY = "pipa_sequence_templates_v2";

const DEFAULT_TEMPLATES: SequenceTemplate[] = [
  {
    id: "tpl-pre-venda-21",
    name: "Pré-venda 21 dias",
    description: "Aquecimento frio até conseguir a primeira reunião",
    playType: "pre-venda",
    createdAt: new Date().toISOString(),
    steps: [
      { id: "s1",  order: 0,  type: "linkedin", delayDays: 1,  content: "Adicionar conexão no LinkedIn — personalizar com: 'Vi que você é {{cargo}} na {{empresa}}. Trabalho com soluções para [área]. Gostaria de conectar!'" },
      { id: "s2",  order: 1,  type: "whatsapp", delayDays: 3,  content: "Oi {{nome}}! Sou [seu nome] da [empresa]. Vi que vocês da {{empresa}} estão [contexto relevante]. Tenho algo que pode fazer sentido pra vocês. Posso te mandar um áudio rápido?" },
      { id: "s3",  order: 2,  type: "linkedin", delayDays: 4,  content: "Mensagem LinkedIn: 'Oi {{nome}}, obrigado por conectar! {{empresa}} está em um momento interessante. Trabalho com [solução] e acho que posso agregar. Vale 15 min essa semana?'" },
      { id: "s4",  order: 3,  type: "email",    delayDays: 6,  content: "Assunto: {{empresa}} + [sua solução]\n\nOi {{nome}},\n\nVi que você é {{cargo}} na {{empresa}} e queria trazer algo relevante: [breve pitch 2 linhas].\n\nValeria uma conversa de 15 min essa semana?\n\n[seu nome]" },
      { id: "s5",  order: 4,  type: "whatsapp", delayDays: 9,  content: "{{nome}}, mandei um e-mail semana passada. Sei que a caixa de entrada tá sempre cheia. Resumindo: [uma frase do valor]. Faz sentido pra {{empresa}} agora?" },
      { id: "s6",  order: 5,  type: "linkedin", delayDays: 12, content: "Mensagem LinkedIn: 'Compartilhei um conteúdo sobre [tema relevante para o setor de {{empresa}}}] — acho que pode ser útil pra você, {{nome}}. [link ou resumo]'" },
      { id: "s7",  order: 6,  type: "email",    delayDays: 15, content: "Assunto: Case — como [empresa similar] resolveu [problema]\n\nOi {{nome}},\n\nCase rápido: [empresa similar no setor de {{empresa}}] tinha [problema X] e resolveu com [solução] em [prazo].\n\nQual o seu maior desafio em [área] hoje?\n\n[seu nome]" },
      { id: "s8",  order: 7,  type: "call",     delayDays: 18, content: "Ligação direta para {{nome}} na {{empresa}}. Abertura: 'Oi {{nome}}, sou [nome] da [empresa]. Te mandei algumas mensagens, queria entender se faz sentido uma conversa de 15 min sobre [tema].'" },
      { id: "s9",  order: 8,  type: "whatsapp", delayDays: 21, content: "{{nome}}, última tentativa. Sei que você tem mil coisas. Se não fizer sentido agora, sem problema. Mas se [dor principal] for relevante pra {{empresa}}, vale 15 min. Qual o melhor horário?" },
    ],
  },
  {
    id: "tpl-sales-r1r2",
    name: "Sales R1 → R2 (14 dias)",
    description: "Do pós-reunião 1 até fechar a reunião 2",
    playType: "sales",
    createdAt: new Date().toISOString(),
    steps: [
      { id: "r1",  order: 0,  type: "whatsapp", delayDays: 1,  content: "{{nome}}, foi ótimo conversar hoje! Como combinado, vou te mandar o material que mencionei. Qualquer dúvida, pode me chamar aqui." },
      { id: "r2",  order: 1,  type: "email",    delayDays: 1,  content: "Assunto: Próximos passos — {{empresa}} x [sua empresa]\n\nOi {{nome}},\n\nResumindo o que conversamos: [3 pontos principais].\n\nMaterial prometido: [link/anexo]\n\nSugiro que a gente se reúna novamente em [prazo] para avançar. Quando você tem disponibilidade?\n\n[seu nome]" },
      { id: "r3",  order: 2,  type: "whatsapp", delayDays: 3,  content: "{{nome}}, conseguiu dar uma olhada no material? Tenho algumas ideias específicas para {{empresa}} que queria compartilhar na nossa próxima conversa." },
      { id: "r4",  order: 3,  type: "linkedin", delayDays: 5,  content: "Mensagem LinkedIn: '{{nome}}, complementando nossa conversa — vi esse artigo sobre [tema discutido] e achei relevante pra {{empresa}}. [link]'" },
      { id: "r5",  order: 4,  type: "email",    delayDays: 7,  content: "Assunto: [Pergunta direta sobre a dor]\n\nOi {{nome}},\n\n[Case ou dado relevante para o segmento de {{empresa}}].\n\nIsto se conecta diretamente com o que conversamos sobre [ponto específico]. Quando podemos dar o próximo passo?\n\n[seu nome]" },
      { id: "r6",  order: 5,  type: "call",     delayDays: 10, content: "Ligação para {{nome}}. Objetivo: confirmar interesse, remover objeções, agendar R2. Pergunta principal: 'O que precisa acontecer internamente para avançarmos?'" },
      { id: "r7",  order: 6,  type: "whatsapp", delayDays: 14, content: "{{nome}}, quero muito ajudar {{empresa}} a [resultado]. Sei que você tem outras prioridades — qual seria o melhor momento para a gente dar continuidade?" },
    ],
  },
  {
    id: "tpl-cs-engajamento",
    name: "CS / Engajamento contínuo",
    description: "Manter conta quente e expandir relacionamento",
    playType: "cs",
    createdAt: new Date().toISOString(),
    steps: [
      { id: "c1",  order: 0,  type: "whatsapp", delayDays: 1,  content: "{{nome}}, tudo certo por aí? Queria checar como estão as coisas na {{empresa}} e se posso ajudar em algo." },
      { id: "c2",  order: 1,  type: "email",    delayDays: 7,  content: "Assunto: Conteúdo relevante para {{empresa}}\n\nOi {{nome}},\n\n[conteúdo/insight relevante para o setor]. Achei que poderia ser útil dado o que conversamos sobre [tema].\n\n[seu nome]" },
      { id: "c3",  order: 2,  type: "linkedin", delayDays: 14, content: "Interagir com post recente de {{nome}} ou da {{empresa}} no LinkedIn — comentar com algo relevante e genuíno." },
      { id: "c4",  order: 3,  type: "whatsapp", delayDays: 21, content: "{{nome}}, vi que {{empresa}} [conquista/notícia recente]. Parabéns! Como estão as coisas por lá?" },
      { id: "c5",  order: 4,  type: "email",    delayDays: 30, content: "Assunto: Check-in — {{empresa}}\n\nOi {{nome}},\n\nFaz um tempo que não nos falamos. Queria entender como está [área específica] na {{empresa}} e se há algo em que posso ajudar.\n\n[seu nome]" },
    ],
  },
];

function loadTemplates(): SequenceTemplate[] {
  try {
    const saved = JSON.parse(localStorage.getItem(TEMPLATES_KEY) ?? "[]") as SequenceTemplate[];
    // Merge: defaults first, then user-saved (user can't delete defaults with same id)
    const userIds = new Set(saved.map((t) => t.id));
    const defaults = DEFAULT_TEMPLATES.filter((d) => !userIds.has(d.id));
    return [...defaults, ...saved];
  } catch { return DEFAULT_TEMPLATES; }
}
function saveTemplates(tpls: SequenceTemplate[]) {
  // Only persist user-created templates (not defaults)
  const defaults = new Set(DEFAULT_TEMPLATES.map((d) => d.id));
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(tpls.filter((t) => !defaults.has(t.id))));
}

// ─── Constants ────────────────────────────────────────────────
const STEP_TYPES: { value: SequenceStep["type"]; label: string; icon: React.ElementType; cls: string; bg: string }[] = [
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare, cls: "text-emerald-500", bg: "bg-emerald-500" },
  { value: "email",    label: "E-mail",   icon: Mail,          cls: "text-blue-500",    bg: "bg-blue-500"    },
  { value: "call",     label: "Ligação",  icon: Phone,         cls: "text-amber-500",   bg: "bg-amber-500"   },
  { value: "task",     label: "Tarefa",   icon: TaskIcon,      cls: "text-purple-500",  bg: "bg-purple-500"  },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin,      cls: "text-blue-600",    bg: "bg-blue-600"    },
];

const STEP_ABBR: Record<string, string> = { whatsapp: "W", email: "E", call: "L", task: "T", linkedin: "Li" };

const PHASE_MAP: Record<string, string> = {
  "pre-venda": "sales",
  "sales": "cs",
  "cs": "",
};

// ─── Progress tracking (localStorage) ────────────────────────
const PROGRESS_KEY = "pipa_seq_progress_v1";

interface StepResult {
  result: "pending" | "sent" | "no_response" | "replied" | "meeting";
  updatedAt: string;
}
interface ContactProgress {
  sequenceId: string;
  personId: string;
  results: Record<string, StepResult>;
  currentStepIdx: number;
  funnelStage: string;
}

function loadProgress(): ContactProgress[] {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "[]"); } catch { return []; }
}
function saveProgress(list: ContactProgress[]) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(list));
}

function uid() { return `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

function addDays(base: string, n: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + n - 1);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function emptyStep(day = 1): SequenceStep {
  return { id: uid(), order: 0, type: "whatsapp", content: "", delayDays: day };
}

// ─── Reconstruct personas from flat steps ─────────────────────
function stepsToPersonas(steps: SequenceStep[], contactIds: string[], people: Person[]): PersonaForm[] {
  const byPerson: Record<string, PersonaForm> = {};
  for (const step of steps) {
    if (!step.personId) continue;
    if (!byPerson[step.personId]) {
      const person = people.find((p) => p.id === step.personId);
      byPerson[step.personId] = {
        personId: step.personId,
        personName: step.personName ?? person?.name ?? "—",
        personRole: person?.role,
        steps: [],
      };
    }
    byPerson[step.personId].steps.push(step);
  }
  // Sort each persona's steps by day
  for (const p of Object.values(byPerson)) {
    p.steps.sort((a, b) => a.delayDays - b.delayDays);
  }
  // Ensure all contactIds have a persona entry even if no steps yet
  for (const id of contactIds) {
    if (!byPerson[id]) {
      const person = people.find((p) => p.id === id);
      if (person) {
        byPerson[id] = { personId: id, personName: person.name, personRole: person.role, steps: [] };
      }
    }
  }
  return Object.values(byPerson);
}

// ─── Main Page ────────────────────────────────────────────────
export default function SequencesPage() {
  const [sequences, setSequences]   = useState<Sequence[]>([]);
  const [people, setPeople]         = useState<Person[]>([]);
  const [companies, setCompanies]   = useState<Company[]>([]);
  const [search, setSearch]         = useState("");
  const [filterActive, setFilterActive] = useState<"" | "true" | "false">("");
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState<Sequence | null>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [activeTab, setActiveTab]   = useState<"sequences" | "templates">("sequences");
  const [templates, setTemplates]   = useState<SequenceTemplate[]>(loadTemplates);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [startDate, setStartDate]   = useState(() => new Date().toISOString().split("T")[0]);
  const [activeSeq, setActiveSeq]   = useState<Sequence | null>(null);
  const [progress, setProgress]     = useState<ContactProgress[]>(loadProgress);
  const [tplFilterPlay, setTplFilterPlay] = useState("");
  const [advanceModal, setAdvanceModal] = useState<{ personId: string; personName: string; currentPlay: string } | null>(null);

  // Form state
  const [formName, setFormName]             = useState("");
  const [formDesc, setFormDesc]             = useState("");
  const [formActive, setFormActive]         = useState(false);
  const [formPlayType, setFormPlayType]     = useState("");
  const [formCompanyId, setFormCompanyId]   = useState("");
  const [formCompanyName, setFormCompanyName] = useState("");
  const [formPersonas, setFormPersonas]     = useState<PersonaForm[]>([]);
  const [expandedPersonas, setExpandedPersonas] = useState<Set<string>>(new Set());

  async function reload() {
    const [p, c] = await Promise.all([PersonDB.getAll(), CompanyDB.getAll()]);
    setPeople(p);
    setCompanies(c);
    try {
      const s = await SequenceDB.getAll();
      setSequences(s);
    } catch {
      setSequences([]);
    }
  }

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    let list = sequences;
    if (search.trim()) list = list.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
    if (filterActive === "true")  list = list.filter((s) => s.active);
    if (filterActive === "false") list = list.filter((s) => !s.active);
    return list;
  }, [sequences, search, filterActive]);

  // People available for this company (prefer those linked, then all)
  const companyPeople = useMemo(() => {
    if (!formCompanyId) return people;
    const linked = people.filter((p) => p.companyId === formCompanyId);
    return linked.length > 0 ? linked : people;
  }, [people, formCompanyId]);

  function openCreate() {
    setEditing(null);
    setFormName(""); setFormDesc(""); setFormActive(false);
    setFormPlayType("");
    setFormCompanyId(""); setFormCompanyName("");
    setFormPersonas([]); setExpandedPersonas(new Set());
    setShowForm(true);
  }

  function openEdit(seq: Sequence) {
    setEditing(seq);
    setFormName(seq.name);
    setFormDesc(seq.description ?? "");
    setFormActive(seq.active);
    setFormPlayType(seq.playType ?? "");
    setFormCompanyId(seq.companyIds[0] ?? "");
    const co = companies.find((c) => c.id === seq.companyIds[0]);
    setFormCompanyName(co?.name ?? "");
    const personas = stepsToPersonas(seq.steps, seq.contactIds, people);
    setFormPersonas(personas);
    setExpandedPersonas(new Set(personas.map((p) => p.personId)));
    setShowForm(true);
  }

  function closeForm() { setShowForm(false); setEditing(null); }

  // ─── Company selection ────────────────────────────────────
  function selectCompany(id: string) {
    const co = companies.find((c) => c.id === id);
    setFormCompanyId(id);
    setFormCompanyName(co?.name ?? "");
    // Reset personas that are no longer from this company
    setFormPersonas([]);
    setExpandedPersonas(new Set());
  }

  // ─── Persona management ───────────────────────────────────
  function togglePersona(person: Person) {
    const exists = formPersonas.find((p) => p.personId === person.id);
    if (exists) {
      setFormPersonas((prev) => prev.filter((p) => p.personId !== person.id));
      setExpandedPersonas((prev) => { const s = new Set(prev); s.delete(person.id); return s; });
    } else {
      const newPersona: PersonaForm = {
        personId: person.id,
        personName: person.name,
        personRole: person.role,
        steps: [emptyStep(1)],
      };
      setFormPersonas((prev) => [...prev, newPersona]);
      setExpandedPersonas((prev) => new Set([...prev, person.id]));
    }
  }

  function toggleExpanded(personId: string) {
    setExpandedPersonas((prev) => {
      const s = new Set(prev);
      s.has(personId) ? s.delete(personId) : s.add(personId);
      return s;
    });
  }

  // ─── Step management per persona ──────────────────────────
  function addStep(personId: string) {
    setFormPersonas((prev) => prev.map((p) => {
      if (p.personId !== personId) return p;
      const maxDay = p.steps.reduce((m, s) => Math.max(m, s.delayDays), 0);
      return { ...p, steps: [...p.steps, emptyStep(maxDay + 1)] };
    }));
  }

  function removeStep(personId: string, stepId: string) {
    setFormPersonas((prev) => prev.map((p) =>
      p.personId !== personId ? p : { ...p, steps: p.steps.filter((s) => s.id !== stepId) }
    ));
  }

  function updateStep(personId: string, stepId: string, patch: Partial<SequenceStep>) {
    setFormPersonas((prev) => prev.map((p) =>
      p.personId !== personId ? p : {
        ...p,
        steps: p.steps
          .map((s) => s.id === stepId ? { ...s, ...patch } : s)
          .sort((a, b) => a.delayDays - b.delayDays),
      }
    ));
  }

  // ─── Submit ───────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) { toast.error("Nome é obrigatório."); return; }
    if (formPersonas.length === 0) { toast.error("Adicione ao menos uma pessoa."); return; }
    for (const persona of formPersonas) {
      if (persona.steps.length === 0) { toast.error(`Adicione ao menos um passo para ${persona.personName}.`); return; }
      if (persona.steps.some((s) => !s.content.trim())) {
        toast.error(`Todos os passos de ${persona.personName} precisam de conteúdo.`); return;
      }
    }

    // Flatten personas into steps
    const allSteps: SequenceStep[] = formPersonas.flatMap((persona) =>
      persona.steps.map((step, i) => ({
        ...step,
        order: i,
        personId: persona.personId,
        personName: persona.personName,
      }))
    );

    const payload = {
      name: formName.trim(),
      description: formDesc.trim(),
      active: formActive,
      playType: formPlayType || undefined,
      steps: allSteps,
      contactIds: formPersonas.map((p) => p.personId),
      companyIds: [formCompanyId],
    };

    try {
      if (editing) {
        await SequenceDB.update(editing.id, payload);
        toast.success("Sequência atualizada.");
      } else {
        await SequenceDB.save(payload);
        toast.success("Sequência criada.");
      }
      closeForm();
      reload();
    } catch {
      toast.error("Erro ao salvar sequência.");
    }
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      await SequenceDB.update(id, { active: !current });
      reload();
      toast.success(current ? "Sequência pausada." : "Sequência ativada.");
    } catch {
      toast.error("Erro ao atualizar sequência.");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await SequenceDB.remove(deleteId);
      setDeleteId(null);
      reload();
      toast.success("Sequência removida.");
    } catch {
      toast.error("Erro ao remover sequência.");
    }
  }

  function saveAsTemplate(seq: Sequence) {
    const tpl: SequenceTemplate = {
      id: uid(),
      name: seq.name,
      description: seq.description,
      steps: seq.steps.map(({ personId: _p, personName: _n, ...rest }) => rest),
      createdAt: new Date().toISOString(),
    };
    const updated = [tpl, ...templates];
    setTemplates(updated);
    saveTemplates(updated);
    toast.success(`Modelo "${tpl.name}" salvo.`);
  }

  function deleteTemplate(id: string) {
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
    toast.success("Modelo removido.");
  }

  function applyTemplate(tpl: SequenceTemplate) {
    setFormName(tpl.name);
    setFormDesc(tpl.description ?? "");
    if (tpl.playType) setFormPlayType(tpl.playType);
    // Assign template steps to each selected persona
    setFormPersonas((prev) =>
      prev.map((persona) => ({
        ...persona,
        steps: tpl.steps.map((s) => ({
          ...s,
          id: uid(),
          personId: persona.personId,
          personName: persona.personName,
        })),
      }))
    );
    setShowTemplateModal(false);
    toast.success(`Modelo "${tpl.name}" aplicado.`);
  }

  // ─── Progress helpers ──────────────────────────────────────
  function getContactProgress(seqId: string, personId: string): ContactProgress {
    return progress.find((p) => p.sequenceId === seqId && p.personId === personId) ?? {
      sequenceId: seqId,
      personId,
      results: {},
      currentStepIdx: 0,
      funnelStage: "tentativa",
    };
  }

  function updateContactResult(seqId: string, personId: string, stepId: string, result: StepResult["result"]) {
    setProgress((prev) => {
      const existing = prev.find((p) => p.sequenceId === seqId && p.personId === personId);
      const seq = sequences.find((s) => s.id === seqId);
      const personSteps = seq?.steps.filter((s) => s.personId === personId).sort((a, b) => a.delayDays - b.delayDays) ?? [];
      const currentIdx = existing?.currentStepIdx ?? 0;
      const nextIdx = result === "pending" ? currentIdx : Math.min(currentIdx + 1, personSteps.length - 1);

      // Determine funnel stage
      let funnelStage = existing?.funnelStage ?? "tentativa";
      if (result === "replied") funnelStage = "conexao";
      if (result === "meeting") funnelStage = "reuniao";
      if (result === "no_response") funnelStage = "sem_resposta";

      const updated: ContactProgress = {
        sequenceId: seqId,
        personId,
        results: { ...(existing?.results ?? {}), [stepId]: { result, updatedAt: new Date().toISOString() } },
        currentStepIdx: nextIdx,
        funnelStage,
      };
      const newList = [...prev.filter((p) => !(p.sequenceId === seqId && p.personId === personId)), updated];
      saveProgress(newList);
      return newList;
    });
  }

  async function advancePhase(personId: string, personName: string, targetPlayType: string) {
    const tpl = templates.find((t) => t.playType === targetPlayType);
    if (!tpl) { toast.error("Nenhum modelo encontrado para essa fase."); return; }
    const steps: SequenceStep[] = tpl.steps.map((s) => ({
      ...s, id: uid(), personId, personName,
    }));
    const payload = {
      name: `${tpl.name} — ${personName}`,
      description: tpl.description,
      active: true,
      playType: targetPlayType,
      steps,
      contactIds: [personId],
      companyIds: [],
    };
    try {
      await SequenceDB.save(payload as Omit<Sequence, "id" | "createdAt" | "updatedAt">);
      toast.success(`Nova fase "${tpl.name}" criada para ${personName}.`);
      setAdvanceModal(null);
      reload();
    } catch {
      toast.error("Erro ao criar nova fase.");
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Send className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">Sequências</h1>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">
            <Plus className="h-4 w-4" /> Nova Sequência
          </button>
        </div>

        {/* Abas */}
        <div className="flex gap-1 mb-5 border-b border-border">
          {([["sequences", "Sequências", Send], ["templates", "Modelos", BookTemplate]] as const).map(([tab, label, Icon]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <Icon className="h-3.5 w-3.5" />{label}
              {tab === "templates" && templates.length > 0 && (
                <span className="bg-muted text-foreground text-[10px] px-1.5 py-0.5 rounded-full">{templates.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Aba Modelos ──────────────────────────────────────── */}
        {activeTab === "templates" && (
          <div>
            {/* Play type filter */}
            {templates.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                <button onClick={() => setTplFilterPlay("")}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${!tplFilterPlay ? "bg-primary text-primary-foreground border-primary" : "border-input text-muted-foreground hover:border-primary/50"}`}>
                  Todos
                </button>
                {PLAY_TYPES.map((pt) => (
                  <button key={pt.value} onClick={() => setTplFilterPlay(tplFilterPlay === pt.value ? "" : pt.value)}
                    className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full border transition-colors ${tplFilterPlay === pt.value ? `border-current ${pt.cls} ${pt.bg}` : "border-input text-muted-foreground hover:border-primary/50"}`}>
                    <pt.icon className="h-3 w-3" />{pt.label}
                  </button>
                ))}
              </div>
            )}
            {templates.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <BookTemplate className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum modelo salvo ainda.</p>
                <p className="text-xs mt-1">Abra uma sequência e clique em "Salvar como modelo".</p>
              </div>
            ) : (
              <div className="space-y-3">
                {templates.filter((t) => !tplFilterPlay || t.playType === tplFilterPlay).map((tpl) => {
                  const maxDay = tpl.steps.length > 0 ? Math.max(...tpl.steps.map((s) => s.delayDays)) : 0;
                  const tplPlay = PLAY_TYPES.find((pt) => pt.value === tpl.playType);
                  return (
                    <div key={tpl.id} className="bg-card border border-border rounded-lg px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-foreground">{tpl.name}</p>
                            {tplPlay && (
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${tplPlay.bg} ${tplPlay.cls}`}>
                                <tplPlay.icon className="h-3 w-3" />{tplPlay.label}
                              </span>
                            )}
                          </div>
                          {tpl.description && <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>}
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">{tpl.steps.length} passo{tpl.steps.length !== 1 ? "s" : ""} · até dia {maxDay}</span>
                            {tpl.steps.map((s, i) => {
                              const st = STEP_TYPES.find((t) => t.value === s.type);
                              return (
                                <span key={i} className={`text-[10px] text-white px-1.5 py-0.5 rounded font-bold ${st?.bg ?? "bg-muted"}`}>
                                  D{s.delayDays} {STEP_ABBR[s.type] ?? s.type}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => { openCreate(); setTimeout(() => applyTemplate(tpl), 50); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:opacity-90">
                            <Copy className="h-3 w-3" /> Usar
                          </button>
                          {!DEFAULT_TEMPLATES.find((d) => d.id === tpl.id) && (
                            <button onClick={() => deleteTemplate(tpl.id)}
                              className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "sequences" && <>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar sequências..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="relative">
            <select value={filterActive} onChange={(e) => setFilterActive(e.target.value as "" | "true" | "false")}
              className="appearance-none border border-input bg-background rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Todas</option>
              <option value="true">Ativas</option>
              <option value="false">Pausadas</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
          {(search || filterActive) && (
            <button onClick={() => { setSearch(""); setFilterActive(""); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-input rounded-md px-3 py-2">
              <X className="h-3.5 w-3.5" /> Limpar
            </button>
          )}
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <EmptyState onNew={openCreate} hasFilter={!!(search || filterActive)} />
        ) : (
          <div className="space-y-3">
            {filtered.map((seq) => {
              const account = companies.find((c) => c.id === seq.companyIds[0]);
              // Group steps by persona
              const personaGroups: Record<string, { name: string; count: number }> = {};
              for (const step of seq.steps) {
                if (!step.personId) continue;
                if (!personaGroups[step.personId]) {
                  personaGroups[step.personId] = { name: step.personName ?? "—", count: 0 };
                }
                personaGroups[step.personId].count++;
              }
              // Also include contactIds with 0 steps
              for (const id of seq.contactIds) {
                if (!personaGroups[id]) {
                  const person = people.find((p) => p.id === id);
                  if (person) personaGroups[id] = { name: person.name, count: 0 };
                }
              }
              const personaList = Object.values(personaGroups);
              const totalDays = seq.steps.length > 0 ? Math.max(...seq.steps.map((s) => s.delayDays)) : 0;

              const playDef = PLAY_TYPES.find((pt) => pt.value === seq.playType);

              return (
                <div key={seq.id} className="bg-card border border-border rounded-lg px-5 py-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-foreground">{seq.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${seq.active ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                          {seq.active ? "Ativa" : "Pausada"}
                        </span>
                        {playDef && (
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${playDef.bg} ${playDef.cls}`}>
                            <playDef.icon className="h-3 w-3" />{playDef.label}
                          </span>
                        )}
                      </div>
                      {seq.description && <p className="text-xs text-muted-foreground mb-2">{seq.description}</p>}

                      {/* Account */}
                      {account && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                          <Building2 className="h-3.5 w-3.5" />
                          <span className="font-medium text-foreground">{account.name}</span>
                          {account.segment && <span>· {account.segment}</span>}
                        </div>
                      )}

                      {/* Personas */}
                      {personaList.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {personaList.map((p, i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-2 py-0.5">
                              <User className="h-3 w-3" />
                              {p.name}
                              {p.count > 0 && <span className="text-muted-foreground">({p.count} passo{p.count !== 1 ? "s" : ""})</span>}
                            </span>
                          ))}
                          {totalDays > 0 && <span className="text-xs text-muted-foreground ml-1">· até dia {totalDays}</span>}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setActiveSeq(seq)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-md hover:bg-primary/20"
                        title="Executar sequência">
                        <Zap className="h-3.5 w-3.5" /> Executar
                      </button>
                      <button onClick={() => toggleActive(seq.id, seq.active)}
                        className={`p-1.5 rounded ${seq.active ? "text-emerald-500 hover:text-emerald-600" : "text-muted-foreground hover:text-foreground"}`}
                        title={seq.active ? "Pausar" : "Ativar"}>
                        {seq.active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                      </button>
                      <button onClick={() => saveAsTemplate(seq)} title="Salvar como modelo"
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary">
                        <BookTemplate className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => openEdit(seq)} className="p-1.5 rounded hover:bg-muted text-muted-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(seq.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="text-xs text-muted-foreground pt-1">{filtered.length} sequência{filtered.length !== 1 ? "s" : ""}</div>
          </div>
        )}
        </> }
      </div>

      {/* ─── Modal Formulário ─────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h2 className="font-semibold text-foreground">{editing ? "Editar Sequência" : "Nova Sequência"}</h2>
              <button onClick={closeForm} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-5">

                {/* ── Info básica ─────────────────────────── */}
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nome <span className="text-destructive">*</span></label>
                      <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                        className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="ex: Cadência Executivos Tech Q1" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                        <CalendarDays className="inline h-3 w-3 mr-0.5" /> Data início
                      </label>
                      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                        className="border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={1}
                      placeholder="Descrição (opcional)"
                      className="flex-1 border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                    <div className="flex items-center gap-2 shrink-0">
                      {templates.length > 0 && (
                        <button type="button" onClick={() => setShowTemplateModal(true)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs border border-input rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
                          <BookTemplate className="h-3.5 w-3.5" /> Usar modelo
                        </button>
                      )}
                      <button type="button" onClick={() => setFormActive((v) => !v)}
                        className={`flex items-center gap-1.5 text-xs ${formActive ? "text-emerald-500" : "text-muted-foreground"}`}>
                        {formActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                        {formActive ? "Ativa" : "Pausada"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Play Type ───────────────────────────── */}
                <div className="border-t border-border pt-4">
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Tipo de play</label>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setFormPlayType("")}
                      className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${!formPlayType ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground hover:border-primary/50"}`}>
                      Nenhum
                    </button>
                    {PLAY_TYPES.map((pt) => (
                      <button key={pt.value} type="button" onClick={() => setFormPlayType(pt.value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors ${formPlayType === pt.value ? `border-current ${pt.cls} ${pt.bg}` : "border-input text-muted-foreground hover:border-primary/50"}`}>
                        <pt.icon className="h-3.5 w-3.5" />{pt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Conta (opcional) ─────────────────────── */}
                <div className="border-t border-border pt-4">
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    <Building2 className="inline h-3.5 w-3.5 mr-1" />Conta <span className="text-muted-foreground/60">(opcional)</span>
                  </label>
                  <select value={formCompanyId} onChange={(e) => selectCompany(e.target.value)}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">Sem empresa vinculada</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}{c.segment ? ` — ${c.segment}` : ""}</option>
                    ))}
                  </select>
                </div>

                {/* ── Pessoas ──────────────────────────────── */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      <Users className="inline h-3.5 w-3.5 mr-1" />Pessoas <span className="text-destructive">*</span>
                    </label>
                    <span className="text-xs text-muted-foreground">{formPersonas.length} selecionada{formPersonas.length !== 1 ? "s" : ""}</span>
                  </div>
                  {people.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Nenhuma pessoa cadastrada.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-1 max-h-44 overflow-y-auto pr-1">
                      {companyPeople.map((person) => {
                        const selected = formPersonas.some((p) => p.personId === person.id);
                        const initials = person.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                        return (
                          <label key={person.id}
                            className={`flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-2 border transition-colors ${selected ? "border-primary bg-primary/5 text-foreground" : "border-border hover:border-primary/40 hover:bg-muted/40"}`}>
                            <input type="checkbox" checked={selected} onChange={() => togglePersona(person)} className="sr-only" />
                            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">{person.name}</p>
                              {person.role && <p className="text-[10px] text-muted-foreground truncate">{person.role}</p>}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ── Touch points por pessoa ──────────────── */}
                {formPersonas.length > 0 && (
                  <div className="border-t border-border pt-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Send className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold text-foreground">Touch points</span>
                      <div className="flex gap-2 ml-auto">
                        {STEP_TYPES.map((t) => (
                          <span key={t.value} className={`text-[10px] flex items-center gap-0.5 ${t.cls}`}>
                            <t.icon className="h-3 w-3" />{t.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {formPersonas.map((persona) => (
                      <div key={persona.personId} className="border border-border rounded-lg overflow-hidden">
                        {/* Persona header */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border">
                          <div className="h-6 w-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                            {persona.personName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-xs font-medium">{persona.personName}</span>
                          {persona.personRole && <span className="text-[10px] text-muted-foreground">· {persona.personRole}</span>}
                          <button type="button" onClick={() => addStep(persona.personId)}
                            className="ml-auto flex items-center gap-1 text-[10px] text-primary hover:opacity-70">
                            <Plus className="h-3 w-3" /> Passo
                          </button>
                        </div>

                        {/* Steps */}
                        <div className="p-3 space-y-2">
                          {persona.steps.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-2">Nenhum passo. Clique em "+ Passo" acima.</p>
                          )}
                          {persona.steps.map((step) => {
                            const typeInfo = STEP_TYPES.find((t) => t.value === step.type)!;
                            return (
                              <div key={step.id} className="flex gap-2 items-start">
                                <div className="flex items-center gap-1 shrink-0 pt-1">
                                  <span className="text-[10px] text-muted-foreground">D</span>
                                  <input type="number" min={1} value={step.delayDays}
                                    onChange={(e) => updateStep(persona.personId, step.id, { delayDays: Math.max(1, Number(e.target.value)) })}
                                    className="w-10 border border-input bg-background rounded px-1 py-0.5 text-xs text-center focus:outline-none" />
                                </div>
                                <select value={step.type}
                                  onChange={(e) => updateStep(persona.personId, step.id, { type: e.target.value as SequenceStep["type"] })}
                                  className="border border-input bg-background rounded px-1.5 py-1 text-xs focus:outline-none shrink-0">
                                  {STEP_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                                <textarea value={step.content}
                                  onChange={(e) => updateStep(persona.personId, step.id, { content: e.target.value })}
                                  rows={1}
                                  placeholder={
                                    step.type === "whatsapp" ? "Mensagem..." :
                                    step.type === "email"    ? "Assunto — corpo do e-mail..." :
                                    step.type === "call"     ? "Script da ligação..." : "Tarefa..."
                                  }
                                  className="flex-1 border border-input bg-background rounded px-2 py-1 text-xs focus:outline-none resize-none" />
                                <button type="button" onClick={() => removeStep(persona.personId, step.id)}
                                  className="pt-1 text-muted-foreground hover:text-destructive shrink-0">
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* ── Calendário visual ─────────────────── */}
                    {formPersonas.some((p) => p.steps.length > 0) && (() => {
                      const maxDay = Math.max(...formPersonas.flatMap((p) => p.steps.map((s) => s.delayDays)), 1);
                      const days = Array.from({ length: maxDay }, (_, i) => i + 1);
                      const dateLabel = (d: number) => startDate ? `${d}\n${addDays(startDate, d)}` : `${d}`;
                      // Use global STEP_TYPES and STEP_ABBR
                      return (
                        <div className="border border-border rounded-lg overflow-hidden">
                          <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b border-border">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Calendário</span>
                          </div>
                          <div className="overflow-x-auto p-3">
                            <table className="text-[10px] border-collapse w-full">
                              <thead>
                                <tr>
                                  <th className="text-left pr-3 pb-1.5 text-muted-foreground font-medium w-24">Pessoa</th>
                                  {days.map((d) => (
                                    <th key={d} className="text-center pb-1.5 text-muted-foreground font-medium min-w-[36px] whitespace-pre-line leading-tight">
                                      {dateLabel(d)}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {formPersonas.map((persona) => (
                                  <tr key={persona.personId}>
                                    <td className="pr-3 py-1 text-foreground font-medium truncate max-w-[96px]">
                                      {persona.personName.split(" ")[0]}
                                    </td>
                                    {days.map((d) => {
                                      const stepsOnDay = persona.steps.filter((s) => s.delayDays === d);
                                      return (
                                        <td key={d} className="py-1 text-center">
                                          <div className="flex justify-center gap-0.5 flex-wrap">
                                            {stepsOnDay.map((s) => {
                                              const st = STEP_TYPES.find((t) => t.value === s.type);
                                              return (
                                                <span key={s.id}
                                                  className={`inline-flex items-center justify-center h-4 w-4 rounded text-white text-[9px] font-bold ${st?.bg ?? "bg-muted"}`}
                                                  title={`${st?.label}: ${s.content.slice(0, 40)}`}>
                                                  {STEP_ABBR[s.type] ?? s.type[0].toUpperCase()}
                                                </span>
                                              );
                                            })}
                                          </div>
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-border flex justify-end gap-3 shrink-0">
                <button type="button" onClick={closeForm} className="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90">
                  {editing ? "Salvar alterações" : "Criar Sequência"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Selecionar Modelo ──────────────────────────── */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Escolher modelo</h3>
              <button onClick={() => setShowTemplateModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {templates.map((tpl) => {
                const maxDay = tpl.steps.length > 0 ? Math.max(...tpl.steps.map((s) => s.delayDays)) : 0;
                return (
                  <button key={tpl.id} type="button" onClick={() => applyTemplate(tpl)}
                    className="w-full text-left border border-border rounded-lg px-4 py-3 hover:border-primary/50 hover:bg-muted/40 transition-colors">
                    <p className="text-sm font-medium text-foreground">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tpl.steps.length} passo{tpl.steps.length !== 1 ? "s" : ""} · até dia {maxDay}
                      {tpl.description ? ` · ${tpl.description}` : ""}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── Painel de Execução ───────────────────────────────── */}
      {activeSeq && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-0 sm:px-4">
          <div className="bg-card border border-border rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">{activeSeq.name}</span>
                {(() => { const pd = PLAY_TYPES.find((p) => p.value === activeSeq.playType); return pd ? (
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${pd.bg} ${pd.cls}`}>
                    <pd.icon className="h-3 w-3" />{pd.label}
                  </span>
                ) : null; })()}
              </div>
              <button onClick={() => setActiveSeq(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Contacts execution grid */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeSeq.contactIds.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum contato nesta sequência.</p>
              )}
              {activeSeq.contactIds.map((pid) => {
                const person = people.find((p) => p.id === pid);
                const personName = activeSeq.steps.find((s) => s.personId === pid)?.personName ?? person?.name ?? "—";
                const personSteps = activeSeq.steps
                  .filter((s) => s.personId === pid)
                  .sort((a, b) => a.delayDays - b.delayDays);
                const cp = getContactProgress(activeSeq.id, pid);
                const currentStep = personSteps[cp.currentStepIdx] ?? personSteps[personSteps.length - 1];
                const completedCount = Object.values(cp.results).filter((r) => r.result !== "pending").length;
                const hasPositive = Object.values(cp.results).some((r) => r.result === "replied" || r.result === "meeting");
                const nextPlay = PHASE_MAP[activeSeq.playType ?? ""] ?? "";

                const STAGE_LABELS: Record<string, string> = {
                  tentativa: "Tentativa de contato",
                  conexao: "Contato com sucesso",
                  reuniao: "Reunião agendada",
                  sem_resposta: "Sem resposta",
                };

                return (
                  <div key={pid} className={`bg-background border rounded-xl p-4 ${hasPositive ? "border-emerald-500/40" : "border-border"}`}>
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="flex-shrink-0 h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                        {personName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-foreground">{personName}</span>
                          {person?.role && <span className="text-xs text-muted-foreground">{person.role}</span>}
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${cp.funnelStage === "reuniao" ? "bg-emerald-500/15 text-emerald-600" : cp.funnelStage === "conexao" ? "bg-blue-500/15 text-blue-600" : "bg-muted text-muted-foreground"}`}>
                            {STAGE_LABELS[cp.funnelStage] ?? cp.funnelStage}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          {personSteps.map((s, i) => {
                            const res = cp.results[s.id]?.result ?? "pending";
                            const st = STEP_TYPES.find((t) => t.value === s.type);
                            return (
                              <div key={s.id} className="flex flex-col items-center gap-0.5">
                                <span className={`text-[9px] text-muted-foreground`}>D{s.delayDays}</span>
                                <span className={`h-5 w-5 rounded flex items-center justify-center text-[9px] font-bold text-white ${res === "pending" && i === cp.currentStepIdx ? (st?.bg ?? "bg-muted") : res !== "pending" ? "bg-emerald-500" : "bg-muted opacity-40"}`}
                                  title={`${st?.label} D${s.delayDays}: ${res}`}>
                                  {STEP_ABBR[s.type]}
                                </span>
                              </div>
                            );
                          })}
                          <span className="text-xs text-muted-foreground ml-1">{completedCount}/{personSteps.length}</span>
                        </div>
                        {/* Current step */}
                        {currentStep && (
                          <div className="mt-3 bg-muted/40 rounded-lg p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                              {(() => { const st = STEP_TYPES.find((t) => t.value === currentStep.type); return st ? <st.icon className={`h-3.5 w-3.5 ${st.cls}`} /> : null; })()}
                              <span className="text-xs font-medium text-foreground">Dia {currentStep.delayDays} — {STEP_TYPES.find((t) => t.value === currentStep.type)?.label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{currentStep.content}</p>
                            <button onClick={() => { navigator.clipboard.writeText(currentStep.content); toast.success("Copiado!"); }}
                              className="mt-1.5 text-[10px] text-primary hover:underline">Copiar texto</button>
                          </div>
                        )}
                        {/* Result buttons */}
                        {currentStep && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {([
                              { r: "sent",        label: "📨 Enviado",       cls: "border-blue-300 hover:bg-blue-50" },
                              { r: "no_response", label: "🚫 Sem resposta",  cls: "border-slate-300 hover:bg-slate-50" },
                              { r: "replied",     label: "💬 Respondeu",     cls: "border-emerald-400 hover:bg-emerald-50" },
                              { r: "meeting",     label: "📅 Reunião",       cls: "border-purple-400 hover:bg-purple-50" },
                            ] as const).map(({ r, label, cls }) => {
                              const active = cp.results[currentStep.id]?.result === r;
                              return (
                                <button key={r} type="button"
                                  onClick={() => updateContactResult(activeSeq.id, pid, currentStep.id, r)}
                                  className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : `bg-background text-foreground dark:text-foreground ${cls}`}`}>
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {/* Advance phase banner */}
                        {hasPositive && nextPlay && (
                          <div className="mt-3 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
                            <span className="text-xs text-emerald-700 dark:text-emerald-400 flex-1">
                              🎉 {personName} respondeu — pronto para avançar de fase!
                            </span>
                            <button onClick={() => setAdvanceModal({ personId: pid, personName, currentPlay: activeSeq.playType ?? "" })}
                              className="text-xs font-medium bg-emerald-600 text-white px-2.5 py-1 rounded-md hover:bg-emerald-700">
                              Avançar fase →
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Avançar Fase ────────────────────────────────── */}
      {advanceModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Avançar fase — {advanceModal.personName}</h3>
              <button onClick={() => setAdvanceModal(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Selecione o template da próxima fase para criar uma nova sequência para este contato:</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {templates
                .filter((t) => t.playType === PHASE_MAP[advanceModal.currentPlay])
                .map((tpl) => {
                  const pd = PLAY_TYPES.find((p) => p.value === tpl.playType);
                  return (
                    <button key={tpl.id} onClick={() => advancePhase(advanceModal.personId, advanceModal.personName, tpl.playType ?? "")}
                      className="w-full text-left border border-border rounded-lg px-4 py-3 hover:border-primary/50 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{tpl.name}</p>
                        {pd && <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${pd.bg} ${pd.cls}`}><pd.icon className="h-3 w-3" />{pd.label}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{tpl.steps.length} passos · até dia {Math.max(...tpl.steps.map((s) => s.delayDays), 0)}</p>
                    </button>
                  );
                })}
              {templates.filter((t) => t.playType === PHASE_MAP[advanceModal.currentPlay]).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum template disponível para a próxima fase.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Delete ─────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-foreground mb-2">Remover Sequência</h2>
            <p className="text-sm text-muted-foreground mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted">Cancelar</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm bg-destructive text-white rounded-md hover:opacity-90">Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ onNew, hasFilter }: { onNew: () => void; hasFilter: boolean }) {
  return (
    <div className="bg-card border border-border rounded-lg p-12 text-center">
      <Send className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">
        {hasFilter ? "Nenhuma sequência encontrada" : "Nenhuma sequência criada"}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
        {hasFilter ? "Ajuste os filtros." : "Crie cadências multi-persona por conta — selecione a empresa e defina passos individuais para cada persona."}
      </p>
      {!hasFilter && (
        <button onClick={onNew} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm font-medium hover:opacity-90">
          Começar
        </button>
      )}
    </div>
  );
}

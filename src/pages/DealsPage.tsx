import { useState, useEffect } from "react";
import {
  Plus, Flame, Sun, Snowflake, DollarSign,
  Pencil, Trash2, X, Settings, Zap, ToggleLeft, ToggleRight, ArrowRight, Sparkles, Loader2,
} from "lucide-react";
import { FunnelDB, CompanyDB, FunnelTransitionDB, PersonDB } from "@/lib/db";
import type { Funnel, FunnelCard, FunnelStage, Company, FunnelTransition, Person, DealHistoryEntry } from "@/types";
import { toast } from "sonner";
import { openaiChat, IntegrationSettings } from "@/lib/integrations";
import DealDetailDrawer from "@/components/DealDetailDrawer";

const TEMP_CONFIG = {
  hot:  { label: "Hot",  icon: Flame,     cls: "bg-red-500/15 text-red-500" },
  warm: { label: "Warm", icon: Sun,       cls: "bg-amber-500/15 text-amber-500" },
  cold: { label: "Cold", icon: Snowflake, cls: "bg-blue-500/15 text-blue-500" },
};

const STAGE_COLORS: Record<string, string> = {
  blue:    "bg-blue-500",
  amber:   "bg-amber-500",
  purple:  "bg-purple-500",
  emerald: "bg-emerald-500",
  red:     "bg-red-500",
  slate:   "bg-slate-500",
};

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
function now() { return new Date().toISOString(); }

// ─── Card Form Modal ──────────────────────────────────────────
function CardForm({
  funnel, stageId, card, companies, onSave, onClose,
}: {
  funnel: Funnel; stageId: string; card: FunnelCard | null;
  companies: Company[]; onSave: (data: Partial<FunnelCard>) => void; onClose: () => void;
}) {
  const [title, setTitle]               = useState(card?.title ?? "");
  const [companyId, setCompanyId]       = useState(card?.companyId ?? "");
  const [companyName, setCompanyName]   = useState(card?.companyName ?? "");
  const [temperature, setTemperature]   = useState<FunnelCard["temperature"]>(card?.temperature ?? "cold");
  const [revenue, setRevenue]           = useState(card?.revenue ?? "");
  const [selectedStageId, setSelectedStageId] = useState(stageId);

  function handleCompanyChange(id: string) {
    const c = companies.find((co) => co.id === id);
    setCompanyId(id);
    setCompanyName(c?.name ?? "");
    if (c) setTemperature(c.temperature);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) { toast.error("Nome da empresa obrigatório."); return; }
    onSave({ title: title.trim() || undefined, companyId, companyName, temperature, revenue, stageId: selectedStageId });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">{card ? "Editar Card" : "Novo Card"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Nome da negociação</label>
            <input
              type="text" value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
              placeholder="ex: Proposta Empresa XYZ"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Empresa</label>
            {companies.length > 0 && (
              <select
                value={companyId}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none mb-2"
              >
                <option value="">— Digitar manualmente —</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            {!companyId && (
              <input
                type="text" value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                placeholder="Nome da empresa"
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Temperatura</label>
              <select
                value={temperature}
                onChange={(e) => setTemperature(e.target.value as FunnelCard["temperature"])}
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
              >
                <option value="cold">Cold</option>
                <option value="warm">Warm</option>
                <option value="hot">Hot</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Valor (pipeline)</label>
              <input
                type="text" value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                placeholder="R$ 0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Etapa</label>
            <select
              value={selectedStageId}
              onChange={(e) => setSelectedStageId(e.target.value)}
              className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
            >
              {funnel.stages.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90">
              {card ? "Salvar" : "Adicionar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Funnel Form Modal ────────────────────────────────────────
function FunnelForm({
  funnel, onSave, onClose,
}: {
  funnel: Funnel | null;
  onSave: (name: string, stages: { title: string; color: string; description: string }[]) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(funnel?.name ?? "");
  const [stages, setStages] = useState<{ title: string; color: string; description: string }[]>(
    funnel?.stages.map((s) => ({ title: s.title, color: s.color, description: s.description ?? "" })) ?? [
      { title: "Prospecção",    color: "blue",    description: "" },
      { title: "Qualificação",  color: "amber",   description: "" },
      { title: "Proposta",      color: "purple",  description: "" },
      { title: "Fechado/Ganho", color: "emerald", description: "" },
    ]
  );
  const [generatingIdx, setGeneratingIdx] = useState<number | null>(null);
  const COLORS = ["blue", "amber", "purple", "emerald", "red", "slate"];

  async function generateDescription(idx: number) {
    const title = stages[idx].title.trim();
    if (!title) { toast.error("Dê um nome à etapa antes de gerar."); return; }
    if (!IntegrationSettings.isOpenAIReady()) {
      toast.error("Configure sua chave OpenAI primeiro.");
      return;
    }
    setGeneratingIdx(idx);
    const { content, error } = await openaiChat([
      {
        role: "system",
        content: "Você é um especialista em vendas B2B e processos comerciais. Responda sempre em português brasileiro.",
      },
      {
        role: "user",
        content: `Escreva uma descrição objetiva de 1 a 2 frases para a etapa "${title}" em um funil de vendas B2B. Descreva o que acontece nesta etapa, quais critérios qualificam um lead para estar aqui e qual é o objetivo da equipe nesta fase.`,
      },
    ], { temperature: 0.6, maxTokens: 150 });
    setGeneratingIdx(null);
    if (error) { toast.error(error); return; }
    setStages((s) => s.map((st, i) => i === idx ? { ...st, description: content.trim() } : st));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error("Nome do funil obrigatório."); return; }
    if (stages.some((s) => !s.title.trim())) { toast.error("Todas as etapas precisam de nome."); return; }
    onSave(name, stages);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card">
          <h2 className="font-semibold text-foreground">{funnel ? "Editar Funil" : "Novo Funil"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Nome do funil</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
              placeholder="ex: Pré-vendas"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-foreground">Etapas</label>
              <button
                type="button"
                onClick={() => setStages((s) => [...s, { title: "", color: "blue", description: "" }])}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Adicionar etapa
              </button>
            </div>
            <div className="space-y-4">
              {stages.map((stage, idx) => (
                <div key={idx} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={stage.color}
                      onChange={(e) => setStages((s) => s.map((st, i) => i === idx ? { ...st, color: e.target.value } : st))}
                      className="border border-input bg-background rounded px-2 py-1.5 text-xs focus:outline-none"
                    >
                      {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input
                      type="text" value={stage.title}
                      onChange={(e) => setStages((s) => s.map((st, i) => i === idx ? { ...st, title: e.target.value } : st))}
                      className="flex-1 border border-input bg-background rounded px-2 py-1.5 text-sm focus:outline-none"
                      placeholder={`Nome da etapa ${idx + 1}`}
                    />
                    {stages.length > 1 && (
                      <button type="button" onClick={() => setStages((s) => s.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <textarea
                      value={stage.description}
                      onChange={(e) => setStages((s) => s.map((st, i) => i === idx ? { ...st, description: e.target.value } : st))}
                      rows={2}
                      className="w-full border border-input bg-background rounded px-2.5 py-1.5 text-xs focus:outline-none resize-none pr-24"
                      placeholder="Descrição da etapa (o que acontece aqui, critérios de entrada...)"
                    />
                    <button
                      type="button"
                      onClick={() => generateDescription(idx)}
                      disabled={generatingIdx === idx}
                      className="absolute right-2 top-2 flex items-center gap-1 text-[10px] px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 disabled:opacity-60 transition-colors"
                      title="Gerar descrição com IA"
                    >
                      {generatingIdx === idx
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <Sparkles className="h-3 w-3" />
                      }
                      {generatingIdx === idx ? "Gerando..." : "Gerar com IA"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90">
              {funnel ? "Salvar" : "Criar Funil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Automations Modal ────────────────────────────────────────
function AutomationsModal({
  funnels,
  transitions,
  onSave,
  onToggle,
  onDelete,
  onClose,
}: {
  funnels: Funnel[];
  transitions: FunnelTransition[];
  onSave: (t: Omit<FunnelTransition, "id" | "createdAt">) => void;
  onToggle: (t: FunnelTransition) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel]                 = useState("");
  const [sourceFunnelId, setSourceFunnelId] = useState(funnels[0]?.id ?? "");
  const [sourceStageId, setSourceStageId]   = useState("");
  const [targetFunnelId, setTargetFunnelId] = useState("");
  const [targetStageId, setTargetStageId]   = useState("");

  const sourceFunnel = funnels.find((f) => f.id === sourceFunnelId);
  const targetFunnel = funnels.find((f) => f.id === targetFunnelId);

  // reset stage when funnel changes
  useEffect(() => { setSourceStageId(sourceFunnel?.stages[0]?.id ?? ""); }, [sourceFunnelId]);
  useEffect(() => { setTargetStageId(targetFunnel?.stages[0]?.id ?? ""); }, [targetFunnelId]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!sourceFunnelId || !sourceStageId || !targetFunnelId || !targetStageId) {
      toast.error("Preencha todos os campos."); return;
    }
    if (sourceFunnelId === targetFunnelId && sourceStageId === targetStageId) {
      toast.error("Origem e destino não podem ser iguais."); return;
    }
    onSave({ label: label.trim() || undefined, sourceFunnelId, sourceStageId, targetFunnelId, targetStageId, active: true });
    setShowForm(false);
    setLabel(""); setSourceStageId(""); setTargetFunnelId(""); setTargetStageId("");
  }

  function stageName(funnelId: string, stageId: string) {
    const f = funnels.find((f) => f.id === funnelId);
    return f?.stages.find((s) => s.id === stageId)?.title ?? "—";
  }
  function funnelName(id: string) { return funnels.find((f) => f.id === id)?.name ?? "—"; }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> Automações entre Funis
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Explicação */}
          <p className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3">
            Quando um card for movido para a etapa configurada, ele será <strong>automaticamente transferido</strong> para o funil e etapa de destino.
            Configure quantas regras quiser — elas são aplicadas em sequência.
          </p>

          {/* Lista de regras */}
          {transitions.length === 0 && !showForm && (
            <div className="text-center py-8 text-sm text-muted-foreground">Nenhuma automação configurada ainda.</div>
          )}
          {transitions.map((t) => (
            <div key={t.id} className={`flex items-center gap-3 border rounded-lg px-4 py-3 ${t.active ? "border-primary/30 bg-primary/5" : "border-border bg-muted/10"}`}>
              <div className="flex-1 min-w-0">
                {t.label && <div className="text-xs font-semibold text-foreground mb-1">{t.label}</div>}
                <div className="flex items-center gap-1.5 flex-wrap text-xs text-foreground">
                  <span className="font-medium">{funnelName(t.sourceFunnelId)}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="bg-muted px-1.5 py-0.5 rounded">{stageName(t.sourceFunnelId, t.sourceStageId)}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="font-medium">{funnelName(t.targetFunnelId)}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="bg-muted px-1.5 py-0.5 rounded">{stageName(t.targetFunnelId, t.targetStageId)}</span>
                </div>
              </div>
              <button
                onClick={() => onToggle(t)}
                className={`shrink-0 ${t.active ? "text-primary" : "text-muted-foreground"}`}
                title={t.active ? "Desativar" : "Ativar"}
              >
                {t.active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
              </button>
              <button onClick={() => onDelete(t.id)} className="shrink-0 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* Formulário nova regra */}
          {showForm && (
            <form onSubmit={submit} className="border border-dashed border-primary/40 rounded-lg p-4 space-y-4 bg-primary/5">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Nova automação</p>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Nome da regra (opcional)</label>
                <input
                  type="text" value={label} onChange={(e) => setLabel(e.target.value)}
                  className="w-full border border-input bg-background rounded px-3 py-1.5 text-sm focus:outline-none"
                  placeholder="ex: Agendou reunião → Pré-vendas"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Quando chegar em:</p>
                  <div>
                    <label className="block text-xs text-foreground mb-1">Funil de origem</label>
                    <select
                      value={sourceFunnelId}
                      onChange={(e) => setSourceFunnelId(e.target.value)}
                      className="w-full border border-input bg-background rounded px-2 py-1.5 text-sm focus:outline-none"
                    >
                      {funnels.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-foreground mb-1">Etapa</label>
                    <select
                      value={sourceStageId}
                      onChange={(e) => setSourceStageId(e.target.value)}
                      className="w-full border border-input bg-background rounded px-2 py-1.5 text-sm focus:outline-none"
                    >
                      <option value="">Selecionar etapa...</option>
                      {(sourceFunnel?.stages ?? []).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Mover para:</p>
                  <div>
                    <label className="block text-xs text-foreground mb-1">Funil de destino</label>
                    <select
                      value={targetFunnelId}
                      onChange={(e) => setTargetFunnelId(e.target.value)}
                      className="w-full border border-input bg-background rounded px-2 py-1.5 text-sm focus:outline-none"
                    >
                      <option value="">Selecionar funil...</option>
                      {funnels.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-foreground mb-1">Etapa</label>
                    <select
                      value={targetStageId}
                      onChange={(e) => setTargetStageId(e.target.value)}
                      className="w-full border border-input bg-background rounded px-2 py-1.5 text-sm focus:outline-none"
                      disabled={!targetFunnelId}
                    >
                      <option value="">Selecionar etapa...</option>
                      {(targetFunnel?.stages ?? []).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted">Cancelar</button>
                <button type="submit" className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90">Salvar regra</button>
              </div>
            </form>
          )}

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              disabled={funnels.length < 1}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-border rounded-lg py-2.5 text-sm text-muted-foreground hover:text-foreground hover:border-border/70 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" /> Nova regra de automação
            </button>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90">Fechar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main DealsPage ───────────────────────────────────────────
export default function DealsPage() {
  const [funnels, setFunnels]         = useState<Funnel[]>([]);
  const [companies, setCompanies]     = useState<Company[]>([]);
  const [people, setPeople]           = useState<Person[]>([]);
  const [transitions, setTransitions] = useState<FunnelTransition[]>([]);
  const [activeFunnelId, setActiveFunnelId] = useState<string | null>(null);
  const [showCardForm, setShowCardForm]     = useState<{ stageId: string; card: FunnelCard | null } | null>(null);
  const [showFunnelForm, setShowFunnelForm] = useState<Funnel | null | "new">(null);
  const [showAutomations, setShowAutomations] = useState(false);
  const [deleteCardId, setDeleteCardId]     = useState<string | null>(null);
  const [deleteFunnelId, setDeleteFunnelId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  async function reload() {
    const [all, c, tr, ppl] = await Promise.all([FunnelDB.getAll(), CompanyDB.getAll(), FunnelTransitionDB.getAll(), PersonDB.getAll()]);
    setFunnels(all);
    setCompanies(c);
    setTransitions(tr);
    setPeople(ppl);
    if (all.length > 0 && !activeFunnelId) setActiveFunnelId(all[0].id);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, []);

  const activeFunnel = funnels.find((f) => f.id === activeFunnelId) ?? null;

  async function saveCard(data: Partial<FunnelCard>) {
    if (!activeFunnel) return;
    const editing = showCardForm?.card;
    const updatedCards = editing
      ? activeFunnel.cards.map((c) => c.id === editing.id ? { ...c, ...data } : c)
      : (() => {
          const newStageId = data.stageId ?? activeFunnel.stages[0]?.id ?? "";
          const stageName = activeFunnel.stages.find((s) => s.id === newStageId)?.title ?? "";
          const initHistory: DealHistoryEntry[] = [{
            id: uid(), type: "created",
            description: `Negociação criada na etapa "${stageName}"`,
            date: now(),
          }];
          return [
            ...activeFunnel.cards,
            {
              id: uid(), funnelId: activeFunnel.id,
              title: data.title ?? "",
              companyId: data.companyId ?? "",
              companyName: data.companyName ?? "",
              temperature: data.temperature ?? "cold",
              revenue: data.revenue ?? "",
              stageId: newStageId,
              createdAt: now(),
              history: initHistory,
            } as FunnelCard,
          ];
        })();
    try {
      await FunnelDB.update(activeFunnel.id, { cards: updatedCards });
      setShowCardForm(null);
      reload();
      toast.success(editing ? "Card atualizado." : "Card adicionado.");
    } catch {
      toast.error("Erro ao salvar card.");
    }
  }

  async function deleteCard() {
    if (!activeFunnel || !deleteCardId) return;
    try {
      await FunnelDB.update(activeFunnel.id, { cards: activeFunnel.cards.filter((c) => c.id !== deleteCardId) });
      setDeleteCardId(null);
      reload();
      toast.success("Card removido.");
    } catch {
      toast.error("Erro ao remover card.");
    }
  }

  async function updateCard(updated: FunnelCard) {
    if (!activeFunnel) return;
    try {
      await FunnelDB.update(activeFunnel.id, {
        cards: activeFunnel.cards.map((c) => c.id === updated.id ? updated : c),
      });
      reload();
    } catch {
      toast.error("Erro ao atualizar negociação.");
    }
  }

  async function moveCard(cardId: string, toStageId: string) {
    if (!activeFunnel) return;
    try {
      const movingCard = activeFunnel.cards.find((c) => c.id === cardId);
      const fromStage  = activeFunnel.stages.find((s) => s.id === movingCard?.stageId);
      const toStageObj = activeFunnel.stages.find((s) => s.id === toStageId);
      const historyEntry: DealHistoryEntry = {
        id: uid(), type: "stage_moved",
        description: `Movido de "${fromStage?.title ?? "—"}" para "${toStageObj?.title ?? "—"}"`,
        date: now(),
      };
      const movedCards = activeFunnel.cards.map((c) =>
        c.id === cardId
          ? { ...c, stageId: toStageId, history: [...(c.history ?? []), historyEntry] }
          : c
      );
      await FunnelDB.update(activeFunnel.id, { cards: movedCards });

      // ── Verificar automações ──────────────────────────────
      const rule = transitions.find(
        (t) => t.active && t.sourceFunnelId === activeFunnel.id && t.sourceStageId === toStageId
      );
      if (rule) {
        const card = movedCards.find((c) => c.id === cardId);
        const targetFunnel = funnels.find((f) => f.id === rule.targetFunnelId);
        if (card && targetFunnel) {
          // Remove do funil atual
          await FunnelDB.update(activeFunnel.id, { cards: movedCards.filter((c) => c.id !== cardId) });
          // Adiciona no funil destino
          await FunnelDB.update(targetFunnel.id, {
            cards: [
              ...targetFunnel.cards,
              { ...card, stageId: rule.targetStageId, funnelId: targetFunnel.id },
            ],
          });
          toast.success(`Automação: card movido para "${targetFunnel.name}".`);
        }
      }

      reload();
    } catch {
      toast.error("Erro ao mover card.");
    }
  }

  async function moveCardToFunnel(cardId: string, targetFunnelId: string, targetStageId: string) {
    if (!activeFunnel) return;
    try {
      const card = activeFunnel.cards.find((c) => c.id === cardId);
      const targetFunnel = funnels.find((f) => f.id === targetFunnelId);
      if (!card || !targetFunnel) return;
      const fromFunnelName = activeFunnel.name;
      const toFunnelName   = targetFunnel.name;
      const toStageName    = targetFunnel.stages.find((s) => s.id === targetStageId)?.title ?? "—";
      const histEntry: DealHistoryEntry = {
        id: uid(), type: "stage_moved",
        description: `Movido do funil "${fromFunnelName}" para "${toFunnelName}" → ${toStageName}`,
        date: now(),
      };
      const updatedCard = { ...card, stageId: targetStageId, funnelId: targetFunnelId, history: [...(card.history ?? []), histEntry] };
      await FunnelDB.update(activeFunnel.id, { cards: activeFunnel.cards.filter((c) => c.id !== cardId) });
      await FunnelDB.update(targetFunnelId, { cards: [...targetFunnel.cards, updatedCard] });
      setSelectedCardId(null);
      reload();
      toast.success(`Card movido para "${toFunnelName}".`);
    } catch {
      toast.error("Erro ao mover card de funil.");
    }
  }

  async function saveFunnel(name: string, stagesInput: { title: string; color: string; description: string }[]) {
    const stages: FunnelStage[] = stagesInput.map((s, i) => ({ id: uid(), title: s.title, color: s.color, description: s.description, order: i }));
    try {
      if (showFunnelForm && showFunnelForm !== "new") {
        await FunnelDB.update(showFunnelForm.id, { name, stages });
        toast.success("Funil atualizado.");
      } else {
        const created = await FunnelDB.save({ name, stages, cards: [] });
        setActiveFunnelId(created.id);
        toast.success("Funil criado.");
      }
      setShowFunnelForm(null);
      reload();
    } catch {
      toast.error("Erro ao salvar funil.");
    }
  }

  async function deleteFunnel() {
    if (!deleteFunnelId) return;
    try {
      await FunnelDB.remove(deleteFunnelId);
      setDeleteFunnelId(null);
      const remaining = funnels.filter((f) => f.id !== deleteFunnelId);
      setActiveFunnelId(remaining[0]?.id ?? null);
      reload();
      toast.success("Funil removido.");
    } catch {
      toast.error("Erro ao remover funil.");
    }
  }

  async function saveTransition(t: Omit<FunnelTransition, "id" | "createdAt">) {
    try {
      await FunnelTransitionDB.save(t);
      reload();
      toast.success("Automação salva.");
    } catch {
      toast.error("Erro ao salvar automação.");
    }
  }

  async function toggleTransition(t: FunnelTransition) {
    try {
      await FunnelTransitionDB.update(t.id, { active: !t.active });
      reload();
    } catch {
      toast.error("Erro ao atualizar automação.");
    }
  }

  async function deleteTransition(id: string) {
    try {
      await FunnelTransitionDB.remove(id);
      reload();
      toast.success("Automação removida.");
    } catch {
      toast.error("Erro ao remover automação.");
    }
  }

  const activeTransitionsCount = transitions.filter((t) => t.active).length;

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <DollarSign className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">Deals</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAutomations(true)}
              className="flex items-center gap-1.5 border border-input bg-background px-3 py-1.5 rounded-md text-sm text-foreground hover:bg-muted relative"
            >
              <Zap className="h-3.5 w-3.5 text-primary" /> Automações
              {activeTransitionsCount > 0 && (
                <span className="ml-1 text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                  {activeTransitionsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowFunnelForm("new")}
              className="flex items-center gap-2 border border-input bg-background px-3 py-1.5 rounded-md text-sm text-foreground hover:bg-muted"
            >
              <Plus className="h-3.5 w-3.5" /> Novo Funil
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {funnels.map((f) => (
            <div key={f.id} className="flex items-center gap-0.5">
              <button
                onClick={() => setActiveFunnelId(f.id)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  activeFunnelId === f.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {f.name}
              </button>
              {activeFunnelId === f.id && (
                <>
                  <button onClick={() => setShowFunnelForm(f)} className="p-1 text-muted-foreground hover:text-foreground" title="Editar funil">
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteFunnelId(f.id)} className="p-1 text-muted-foreground hover:text-destructive" title="Remover funil">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
          {funnels.length === 0 && <span className="text-sm text-muted-foreground">Nenhum funil criado.</span>}
        </div>
      </div>

      {/* Kanban */}
      {activeFunnel ? (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-4 p-6 h-full min-w-max">
            {activeFunnel.stages
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((stage) => {
                const stageCards = activeFunnel.cards.filter((c) => c.stageId === stage.id);
                const colorBar   = STAGE_COLORS[stage.color] ?? "bg-slate-500";
                // indica se há automação ativa saindo desta etapa
                const hasRule = transitions.some(
                  (t) => t.active && t.sourceFunnelId === activeFunnel.id && t.sourceStageId === stage.id
                );
                return (
                  <div key={stage.id} className="flex flex-col w-64 shrink-0">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${colorBar}`} />
                      <span className="text-sm font-medium text-foreground">{stage.title}</span>
                      {hasRule && (
                        <Zap className="h-3 w-3 text-primary ml-0.5" title="Automação ativa nesta etapa" />
                      )}
                      <span className="ml-auto text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{stageCards.length}</span>
                    </div>
                    {stage.description && (
                      <p className="text-[10px] text-muted-foreground mb-2 leading-relaxed line-clamp-2" title={stage.description}>
                        {stage.description}
                      </p>
                    )}
                    <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                      {stageCards.map((card) => {
                        const temp = TEMP_CONFIG[card.temperature];
                        const TempIcon = temp.icon;
                        return (
                          <div
                            key={card.id}
                            className="bg-card border border-border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => setSelectedCardId(card.id)}
                          >
                            <div className="flex items-start justify-between gap-1 mb-2">
                              <div className="min-w-0">
                                <span className="font-medium text-sm text-foreground leading-tight block truncate">
                                  {card.title || card.companyName}
                                </span>
                                {card.title && <span className="text-xs text-muted-foreground truncate block">{card.companyName}</span>}
                              </div>
                              <div className="flex items-center gap-0.5 shrink-0">
                                <button onClick={(e) => { e.stopPropagation(); setShowCardForm({ stageId: stage.id, card }); }} className="p-1 text-muted-foreground hover:text-foreground">
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setDeleteCardId(card.id); }} className="p-1 text-muted-foreground hover:text-destructive">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full ${temp.cls}`}>
                                <TempIcon className="h-2.5 w-2.5" />{temp.label}
                              </span>
                              {card.revenue && <span className="text-xs text-muted-foreground">{card.revenue}</span>}
                            </div>
                            {activeFunnel.stages.length > 1 && (() => {
                              const stageIdx = activeFunnel.stages.findIndex((s) => s.id === card.stageId);
                              const prevStage = stageIdx > 0 ? activeFunnel.stages[stageIdx - 1] : null;
                              const nextStage = stageIdx < activeFunnel.stages.length - 1 ? activeFunnel.stages[stageIdx + 1] : null;
                              return (
                                <div className="mt-2 pt-2 border-t border-border flex items-center justify-between gap-1" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    disabled={!prevStage}
                                    onClick={() => prevStage && moveCard(card.id, prevStage.id)}
                                    title={prevStage ? `← ${prevStage.title}` : ""}
                                    className="flex-1 text-xs px-2 py-1 rounded border border-input bg-background hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed truncate"
                                  >
                                    {prevStage ? `← ${prevStage.title}` : "←"}
                                  </button>
                                  <button
                                    disabled={!nextStage}
                                    onClick={() => nextStage && moveCard(card.id, nextStage.id)}
                                    title={nextStage ? `${nextStage.title} →` : ""}
                                    className="flex-1 text-xs px-2 py-1 rounded border border-input bg-background hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed truncate"
                                  >
                                    {nextStage ? `${nextStage.title} →` : "→"}
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setShowCardForm({ stageId: stage.id, card: null })}
                      className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Adicionar
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Nenhum funil criado ainda.</p>
            <button onClick={() => setShowFunnelForm("new")} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:opacity-90">
              Criar primeiro funil
            </button>
          </div>
        </div>
      )}

      {showCardForm && activeFunnel && (
        <CardForm funnel={activeFunnel} stageId={showCardForm.stageId} card={showCardForm.card} companies={companies} onSave={saveCard} onClose={() => setShowCardForm(null)} />
      )}
      {showFunnelForm && (
        <FunnelForm funnel={showFunnelForm === "new" ? null : showFunnelForm} onSave={saveFunnel} onClose={() => setShowFunnelForm(null)} />
      )}
      {showAutomations && (
        <AutomationsModal
          funnels={funnels}
          transitions={transitions}
          onSave={saveTransition}
          onToggle={toggleTransition}
          onDelete={deleteTransition}
          onClose={() => setShowAutomations(false)}
        />
      )}
      {selectedCardId && activeFunnel && (() => {
        const selCard = activeFunnel.cards.find((c) => c.id === selectedCardId);
        return selCard ? (
          <DealDetailDrawer
            card={selCard}
            funnel={activeFunnel}
            funnels={funnels}
            people={people}
            onClose={() => setSelectedCardId(null)}
            onUpdate={updateCard}
            onMoveToFunnel={moveCardToFunnel}
          />
        ) : null;
      })()}
      {deleteCardId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-foreground mb-2">Remover Card</h2>
            <p className="text-sm text-muted-foreground mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteCardId(null)} className="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted">Cancelar</button>
              <button onClick={deleteCard} className="px-4 py-2 text-sm bg-destructive text-white rounded-md hover:opacity-90">Remover</button>
            </div>
          </div>
        </div>
      )}
      {deleteFunnelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-foreground mb-2">Remover Funil</h2>
            <p className="text-sm text-muted-foreground mb-5">Todos os cards deste funil serão removidos.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteFunnelId(null)} className="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted">Cancelar</button>
              <button onClick={deleteFunnel} className="px-4 py-2 text-sm bg-destructive text-white rounded-md hover:opacity-90">Remover</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

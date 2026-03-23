import { useState, useEffect, useMemo } from "react";
import {
  Send, Plus, Search, Pencil, Trash2, X, ChevronDown,
  MessageSquare, Mail, Phone, CheckSquare as TaskIcon, ToggleLeft, ToggleRight, GripVertical,
} from "lucide-react";
import { SequenceDB, PersonDB, CompanyDB } from "@/lib/db";
import type { Sequence, SequenceStep, Person, Company } from "@/types";
import { toast } from "sonner";

const STEP_TYPES: { value: SequenceStep["type"]; label: string; icon: React.ElementType }[] = [
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { value: "email",    label: "E-mail",   icon: Mail },
  { value: "call",     label: "Ligação",  icon: Phone },
  { value: "task",     label: "Tarefa",   icon: TaskIcon },
];

const emptyStep = (order: number): SequenceStep => ({
  id: `step-${Date.now()}-${order}`,
  order,
  type: "whatsapp",
  content: "",
  delayDays: order === 0 ? 0 : 1,
});

const emptyForm = (): Omit<Sequence, "id" | "createdAt" | "updatedAt"> => ({
  name: "",
  description: "",
  active: false,
  steps: [emptyStep(0)],
  contactIds: [],
  companyIds: [],
});

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"" | "true" | "false">("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Sequence | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [tab, setTab] = useState<"config" | "contacts">("config");

  async function reload() {
    const [s, p, c] = await Promise.all([SequenceDB.getAll(), PersonDB.getAll(), CompanyDB.getAll()]);
    setSequences(s);
    setPeople(p);
    setCompanies(c);
  }

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    let list = sequences;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    if (filterActive === "true") list = list.filter((s) => s.active);
    if (filterActive === "false") list = list.filter((s) => !s.active);
    return list;
  }, [sequences, search, filterActive]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setTab("config");
    setShowForm(true);
  }

  function openEdit(s: Sequence) {
    setEditing(s);
    setForm({ ...s, steps: s.steps.map((st) => ({ ...st })) });
    setTab("config");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  // ─── Steps management ────────────────────────────
  function addStep() {
    setForm((f) => ({
      ...f,
      steps: [...f.steps, emptyStep(f.steps.length)],
    }));
  }

  function removeStep(idx: number) {
    setForm((f) => ({
      ...f,
      steps: f.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i })),
    }));
  }

  function updateStep(idx: number, patch: Partial<SequenceStep>) {
    setForm((f) => ({
      ...f,
      steps: f.steps.map((s, i) => i === idx ? { ...s, ...patch } : s),
    }));
  }

  // ─── Contact/Company association ─────────────────
  function togglePerson(id: string) {
    setForm((f) => ({
      ...f,
      contactIds: f.contactIds.includes(id)
        ? f.contactIds.filter((c) => c !== id)
        : [...f.contactIds, id],
    }));
  }

  function toggleCompany(id: string) {
    setForm((f) => ({
      ...f,
      companyIds: f.companyIds.includes(id)
        ? f.companyIds.filter((c) => c !== id)
        : [...f.companyIds, id],
    }));
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Nome é obrigatório."); return; }
    if (form.steps.some((s) => !s.content.trim())) {
      toast.error("Todos os passos precisam de conteúdo."); return;
    }

    try {
      if (editing) {
        await SequenceDB.update(editing.id, form);
        toast.success("Sequência atualizada.");
      } else {
        await SequenceDB.save(form);
        toast.success("Sequência criada.");
      }
      closeForm();
      reload();
    } catch {
      toast.error("Erro ao salvar sequência.");
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

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="crm-section-enter flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Send className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-semibold text-foreground">Sequências</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Crie cadências multi-persona por conta com ABM via WhatsApp.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Nova Sequência
          </button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar sequências..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-input bg-background rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="relative">
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as "" | "true" | "false")}
              className="appearance-none border border-input bg-background rounded-md pl-3 pr-8 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Todas</option>
              <option value="true">Ativas</option>
              <option value="false">Pausadas</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
          {(search || filterActive) && (
            <button
              onClick={() => { setSearch(""); setFilterActive(""); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-input rounded-md px-3 py-2"
            >
              <X className="h-3.5 w-3.5" /> Limpar
            </button>
          )}
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <EmptyState onNew={openCreate} hasFilter={!!(search || filterActive)} />
        ) : (
          <div className="space-y-3">
            {filtered.map((seq) => (
              <div key={seq.id} className="bg-card border border-border rounded-lg px-5 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground">{seq.name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        seq.active
                          ? "bg-emerald-500/15 text-emerald-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {seq.active ? "Ativa" : "Pausada"}
                    </span>
                  </div>
                  {seq.description && (
                    <p className="text-xs text-muted-foreground mb-2">{seq.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{seq.steps.length} passo{seq.steps.length !== 1 ? "s" : ""}</span>
                    {seq.contactIds.length > 0 && (
                      <span>{seq.contactIds.length} contato{seq.contactIds.length !== 1 ? "s" : ""}</span>
                    )}
                    {seq.companyIds.length > 0 && (
                      <span>{seq.companyIds.length} empresa{seq.companyIds.length !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                  {/* Steps preview */}
                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    {seq.steps.map((step, idx) => {
                      const stepType = STEP_TYPES.find((t) => t.value === step.type);
                      const Icon = stepType?.icon ?? Send;
                      return (
                        <span key={step.id} className="flex items-center gap-1 text-xs bg-muted rounded px-2 py-0.5">
                          <Icon className="h-3 w-3" />
                          {idx > 0 && <span className="text-muted-foreground">+{step.delayDays}d</span>}
                          {stepType?.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleActive(seq.id, seq.active)}
                    className={`p-1.5 rounded transition-colors ${seq.active ? "text-emerald-500 hover:text-emerald-600" : "text-muted-foreground hover:text-foreground"}`}
                    title={seq.active ? "Pausar" : "Ativar"}
                  >
                    {seq.active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                  </button>
                  <button onClick={() => openEdit(seq)} className="p-1.5 rounded hover:bg-muted text-muted-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteId(seq.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <div className="text-xs text-muted-foreground pt-1">
              {filtered.length} sequência{filtered.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}
      </div>

      {/* Modal Formulário */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">{editing ? "Editar Sequência" : "Nova Sequência"}</h2>
              <button onClick={closeForm} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border px-6">
              {(["config", "contacts"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    tab === t
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "config" ? "Configuração" : "Contatos"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              {tab === "config" && (
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Nome <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Nome da sequência"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Descrição</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      rows={2}
                      className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Ativa ao salvar</label>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                      className={`${form.active ? "text-emerald-500" : "text-muted-foreground"}`}
                    >
                      {form.active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                    </button>
                  </div>

                  {/* Passos */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-foreground">Passos da cadência</label>
                      <button
                        type="button"
                        onClick={addStep}
                        className="text-xs flex items-center gap-1 text-primary hover:underline"
                      >
                        <Plus className="h-3 w-3" /> Adicionar passo
                      </button>
                    </div>
                    <div className="space-y-3">
                      {form.steps.map((step, idx) => {
                        const StepType = STEP_TYPES.find((t) => t.value === step.type);
                        const Icon = StepType?.icon ?? Send;
                        return (
                          <div key={step.id} className="border border-border rounded-lg p-3 bg-background">
                            <div className="flex items-center gap-2 mb-3">
                              <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs font-medium text-foreground">Passo {idx + 1}</span>
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => removeStep(idx)}
                                  className="ml-auto text-muted-foreground hover:text-destructive"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-2">
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
                                <select
                                  value={step.type}
                                  onChange={(e) => updateStep(idx, { type: e.target.value as SequenceStep["type"] })}
                                  className="w-full border border-input bg-card rounded px-2 py-1.5 text-xs focus:outline-none"
                                >
                                  {STEP_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">
                                  {idx === 0 ? "Dia" : "Aguardar (dias)"}
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  value={step.delayDays}
                                  onChange={(e) => updateStep(idx, { delayDays: Number(e.target.value) })}
                                  disabled={idx === 0}
                                  className="w-full border border-input bg-card rounded px-2 py-1.5 text-xs focus:outline-none disabled:opacity-40"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Conteúdo / mensagem</label>
                              <textarea
                                value={step.content}
                                onChange={(e) => updateStep(idx, { content: e.target.value })}
                                rows={3}
                                className="w-full border border-input bg-card rounded px-2 py-1.5 text-xs focus:outline-none resize-none"
                                placeholder="Mensagem ou instrução do passo..."
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {tab === "contacts" && (
                <div className="px-6 py-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3">Pessoas</h3>
                    {people.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhuma pessoa cadastrada.</p>
                    ) : (
                      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                        {people.map((p) => (
                          <label key={p.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/30 rounded px-2 py-1.5">
                            <input
                              type="checkbox"
                              checked={form.contactIds.includes(p.id)}
                              onChange={() => togglePerson(p.id)}
                              className="rounded"
                            />
                            <span className="text-sm text-foreground">{p.name}</span>
                            {p.companyName && <span className="text-xs text-muted-foreground">— {p.companyName}</span>}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-3">Empresas</h3>
                    {companies.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhuma empresa cadastrada.</p>
                    ) : (
                      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                        {companies.map((c) => (
                          <label key={c.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/30 rounded px-2 py-1.5">
                            <input
                              type="checkbox"
                              checked={form.companyIds.includes(c.id)}
                              onChange={() => toggleCompany(c.id)}
                              className="rounded"
                            />
                            <span className="text-sm text-foreground">{c.name}</span>
                            {c.segment && <span className="text-xs text-muted-foreground">— {c.segment}</span>}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
                <button type="button" onClick={closeForm} className="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90">
                  {editing ? "Salvar" : "Criar Sequência"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete */}
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
        {hasFilter ? "Ajuste os filtros." : "Crie cadências multi-canal para engajar seus contatos."}
      </p>
      {!hasFilter && (
        <button onClick={onNew} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm font-medium hover:opacity-90">
          Começar
        </button>
      )}
    </div>
  );
}

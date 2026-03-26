import { useState } from "react";
import {
  X, Plus, Trash2, Check, Clock, Building2, User,
  Mail, Package, Paperclip, FileText, ArrowRight,
  DollarSign, CheckSquare, Square, Shuffle,
} from "lucide-react";
import type {
  FunnelCard, Funnel, Person,
  DealHistoryEntry, DealTask, DealProduct, DealFile, DealProposal, DealEmail,
} from "@/types";
import { toast } from "sonner";

type Tab = "history" | "tasks" | "emails" | "products" | "files" | "proposals";

function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }
function fmtDate(d: string) {
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const TEMP_CONFIG = {
  hot:  { label: "Hot",  cls: "bg-red-500/15 text-red-500" },
  warm: { label: "Warm", cls: "bg-amber-500/15 text-amber-500" },
  cold: { label: "Cold", cls: "bg-blue-500/15 text-blue-500" },
};

const HISTORY_ICONS: Record<string, { icon: React.ElementType; cls: string }> = {
  created:     { icon: Plus,       cls: "text-emerald-500" },
  stage_moved: { icon: ArrowRight, cls: "text-blue-500" },
  note:        { icon: FileText,   cls: "text-muted-foreground" },
};

const SOURCE_OPTIONS = ["Indicação", "Site/Orgânico", "Google Ads", "LinkedIn", "Cold Outbound", "WhatsApp", "Evento", "Outro"];
const QUAL_OPTIONS   = ["Não qualificado", "Baixo potencial", "Médio potencial", "Alto potencial", "Pronto para fechar"];

// ─── HistoryTab ───────────────────────────────────────────────
function HistoryTab({ history, onChange }: { history: DealHistoryEntry[]; onChange: (h: DealHistoryEntry[]) => void }) {
  const [note, setNote] = useState("");
  const [adding, setAdding] = useState(false);

  const sorted = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function addNote() {
    if (!note.trim()) return;
    onChange([...history, { id: uid(), type: "note", description: note.trim(), date: new Date().toISOString() }]);
    setNote(""); setAdding(false);
  }

  return (
    <div>
      {sorted.length === 0 && !adding && (
        <div className="text-center py-6 text-sm text-muted-foreground">Nenhum histórico ainda.</div>
      )}
      <div className="space-y-3 mb-3">
        {sorted.map((entry) => {
          const cfg = HISTORY_ICONS[entry.type] ?? HISTORY_ICONS.note;
          const Icon = cfg.icon;
          return (
            <div key={entry.id} className="flex gap-3">
              <div className={`mt-0.5 shrink-0 ${cfg.cls}`}><Icon className="h-4 w-4" /></div>
              <div className="flex-1">
                <p className="text-sm text-foreground">{entry.description}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(entry.date)}</p>
              </div>
            </div>
          );
        })}
      </div>
      {adding ? (
        <div className="border border-dashed border-border rounded-lg p-3 space-y-2">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Escreva uma nota..." rows={2}
            className="w-full border border-input bg-background rounded px-2.5 py-1.5 text-sm focus:outline-none resize-none" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted">Cancelar</button>
            <button onClick={addNote} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90">Adicionar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:text-foreground">
          <Plus className="h-3.5 w-3.5" /> Adicionar nota
        </button>
      )}
    </div>
  );
}

// ─── TasksTab ─────────────────────────────────────────────────
function TasksTab({ tasks, onChange }: { tasks: DealTask[]; onChange: (t: DealTask[]) => void }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [adding, setAdding] = useState(false);

  function addTask() {
    if (!title.trim()) { toast.error("Digite o título da tarefa."); return; }
    onChange([...tasks, { id: uid(), title: title.trim(), status: "pending", dueDate: dueDate || undefined, createdAt: new Date().toISOString() }]);
    setTitle(""); setDueDate(""); setAdding(false);
  }

  return (
    <div className="space-y-1">
      {tasks.length === 0 && !adding && <div className="text-center py-6 text-sm text-muted-foreground">Nenhuma tarefa vinculada.</div>}
      {tasks.map((t) => (
        <div key={t.id} className="flex items-center gap-2 py-2 border-b border-border">
          <button onClick={() => onChange(tasks.map((x) => x.id === t.id ? { ...x, status: x.status === "done" ? "pending" : "done" } : x))}
            className={t.status === "done" ? "text-emerald-500" : "text-muted-foreground"}>
            {t.status === "done" ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
          </button>
          <div className="flex-1">
            <p className={`text-sm ${t.status === "done" ? "line-through text-muted-foreground" : "text-foreground"}`}>{t.title}</p>
            {t.dueDate && <p className="text-xs text-muted-foreground">Prazo: {new Date(t.dueDate).toLocaleDateString("pt-BR")}</p>}
          </div>
          <button onClick={() => onChange(tasks.filter((x) => x.id !== t.id))} className="text-muted-foreground hover:text-destructive shrink-0">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      {adding ? (
        <div className="border border-dashed border-border rounded-lg p-3 space-y-2 mt-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da tarefa"
            className="w-full border border-input bg-background rounded px-2.5 py-1.5 text-sm focus:outline-none" />
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            className="w-full border border-input bg-background rounded px-2.5 py-1.5 text-sm focus:outline-none" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted">Cancelar</button>
            <button onClick={addTask} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90">Adicionar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:text-foreground mt-2">
          <Plus className="h-3.5 w-3.5" /> Nova tarefa
        </button>
      )}
    </div>
  );
}

// ─── EmailsTab ────────────────────────────────────────────────
function EmailsTab({ emails, onChange }: { emails: DealEmail[]; onChange: (e: DealEmail[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [direction, setDirection] = useState<"in" | "out">("out");

  function addEmail() {
    if (!subject.trim()) { toast.error("Assunto obrigatório."); return; }
    onChange([...emails, { id: uid(), subject: subject.trim(), body: body.trim(), direction, sentAt: new Date().toISOString() }]);
    setSubject(""); setBody(""); setDirection("out"); setAdding(false);
  }

  const sorted = [...emails].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

  return (
    <div className="space-y-2">
      {emails.length === 0 && !adding && <div className="text-center py-6 text-sm text-muted-foreground">Nenhum e-mail registrado.</div>}
      {sorted.map((e) => (
        <div key={e.id} className="border border-border rounded-lg p-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full ${e.direction === "out" ? "bg-blue-500/10 text-blue-500" : "bg-purple-500/10 text-purple-500"}`}>
                {e.direction === "out" ? "Enviado" : "Recebido"}
              </span>
              <span className="text-sm font-medium text-foreground truncate">{e.subject}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground">{new Date(e.sentAt).toLocaleDateString("pt-BR")}</span>
              <button onClick={() => onChange(emails.filter((x) => x.id !== e.id))} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {e.body && <p className="text-xs text-muted-foreground line-clamp-2">{e.body}</p>}
        </div>
      ))}
      {adding ? (
        <div className="border border-dashed border-border rounded-lg p-3 space-y-2">
          <div className="flex gap-2">
            <select value={direction} onChange={(e) => setDirection(e.target.value as "in" | "out")}
              className="border border-input bg-background rounded px-2 py-1.5 text-sm focus:outline-none">
              <option value="out">Enviado</option>
              <option value="in">Recebido</option>
            </select>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Assunto"
              className="flex-1 border border-input bg-background rounded px-2.5 py-1.5 text-sm focus:outline-none" />
          </div>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Corpo do e-mail (opcional)" rows={3}
            className="w-full border border-input bg-background rounded px-2.5 py-1.5 text-sm focus:outline-none resize-none" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted">Cancelar</button>
            <button onClick={addEmail} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90">Registrar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:text-foreground">
          <Plus className="h-3.5 w-3.5" /> Registrar e-mail
        </button>
      )}
    </div>
  );
}

// ─── ProductsTab ──────────────────────────────────────────────
function ProductsTab({ products, onChange }: { products: DealProduct[]; onChange: (p: DealProduct[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");

  function addProduct() {
    if (!name.trim()) { toast.error("Nome do produto obrigatório."); return; }
    onChange([...products, { id: uid(), name: name.trim(), quantity: Number(qty) || 1, unitPrice: price.trim() }]);
    setName(""); setQty("1"); setPrice(""); setAdding(false);
  }

  const total = products.reduce((acc, p) => {
    const val = parseFloat(p.unitPrice.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
    return acc + val * p.quantity;
  }, 0);

  return (
    <div className="space-y-1">
      {products.length === 0 && !adding && <div className="text-center py-6 text-sm text-muted-foreground">Nenhum produto vinculado.</div>}
      {products.map((p) => (
        <div key={p.id} className="flex items-center gap-3 py-2 border-b border-border">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{p.name}</p>
            <p className="text-xs text-muted-foreground">Qtd: {p.quantity}{p.unitPrice ? ` × ${p.unitPrice}` : ""}</p>
          </div>
          <button onClick={() => onChange(products.filter((x) => x.id !== p.id))} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      {products.length > 0 && (
        <div className="flex justify-between py-2 text-sm font-semibold text-foreground border-t border-border">
          <span>Total</span>
          <span>R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
        </div>
      )}
      {adding ? (
        <div className="border border-dashed border-border rounded-lg p-3 space-y-2 mt-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do produto"
            className="w-full border border-input bg-background rounded px-2.5 py-1.5 text-sm focus:outline-none" />
          <div className="flex gap-2">
            <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Qtd" min="1"
              className="w-20 border border-input bg-background rounded px-2.5 py-1.5 text-sm focus:outline-none" />
            <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Preço unitário (ex: 500,00)"
              className="flex-1 border border-input bg-background rounded px-2.5 py-1.5 text-sm focus:outline-none" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted">Cancelar</button>
            <button onClick={addProduct} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90">Adicionar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:text-foreground mt-2">
          <Plus className="h-3.5 w-3.5" /> Adicionar produto
        </button>
      )}
    </div>
  );
}

// ─── FilesTab ─────────────────────────────────────────────────
function FilesTab({ files, onChange }: { files: DealFile[]; onChange: (f: DealFile[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  function addFile() {
    if (!name.trim()) { toast.error("Nome do arquivo obrigatório."); return; }
    onChange([...files, { id: uid(), name: name.trim(), url: url.trim() || undefined, uploadedAt: new Date().toISOString() }]);
    setName(""); setUrl(""); setAdding(false);
  }

  return (
    <div className="space-y-1">
      {files.length === 0 && !adding && <div className="text-center py-6 text-sm text-muted-foreground">Nenhum arquivo anexado.</div>}
      {files.map((f) => (
        <div key={f.id} className="flex items-center gap-3 py-2 border-b border-border">
          <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1">
            {f.url
              ? <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{f.name}</a>
              : <p className="text-sm text-foreground">{f.name}</p>
            }
            <p className="text-xs text-muted-foreground">{new Date(f.uploadedAt).toLocaleDateString("pt-BR")}</p>
          </div>
          <button onClick={() => onChange(files.filter((x) => x.id !== f.id))} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      {adding ? (
        <div className="border border-dashed border-border rounded-lg p-3 space-y-2 mt-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do arquivo"
            className="w-full border border-input bg-background rounded px-2.5 py-1.5 text-sm focus:outline-none" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL do arquivo (opcional)"
            className="w-full border border-input bg-background rounded px-2.5 py-1.5 text-sm focus:outline-none" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted">Cancelar</button>
            <button onClick={addFile} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90">Adicionar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:text-foreground mt-2">
          <Plus className="h-3.5 w-3.5" /> Anexar arquivo
        </button>
      )}
    </div>
  );
}

// ─── ProposalsTab ─────────────────────────────────────────────
function ProposalsTab({ proposals, onChange }: { proposals: DealProposal[]; onChange: (p: DealProposal[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<DealProposal["status"]>("draft");

  const STATUS_CONFIG: Record<DealProposal["status"], { label: string; cls: string }> = {
    draft:    { label: "Rascunho", cls: "bg-gray-500/10 text-gray-500" },
    sent:     { label: "Enviada",  cls: "bg-blue-500/10 text-blue-500" },
    accepted: { label: "Aceita",   cls: "bg-emerald-500/10 text-emerald-500" },
    rejected: { label: "Recusada", cls: "bg-red-500/10 text-red-500" },
  };

  function addProposal() {
    if (!title.trim()) { toast.error("Título obrigatório."); return; }
    onChange([...proposals, { id: uid(), title: title.trim(), value: value.trim(), status, createdAt: new Date().toISOString() }]);
    setTitle(""); setValue(""); setStatus("draft"); setAdding(false);
  }

  return (
    <div className="space-y-2">
      {proposals.length === 0 && !adding && <div className="text-center py-6 text-sm text-muted-foreground">Nenhuma proposta registrada.</div>}
      {proposals.map((p) => (
        <div key={p.id} className="border border-border rounded-lg p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-foreground">{p.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_CONFIG[p.status].cls}`}>{STATUS_CONFIG[p.status].label}</span>
                {p.value && <span className="text-xs text-muted-foreground">{p.value}</span>}
                <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={p.status}
                onChange={(e) => onChange(proposals.map((x) => x.id === p.id ? { ...x, status: e.target.value as DealProposal["status"] } : x))}
                className="text-xs border border-input bg-background rounded px-1.5 py-1 focus:outline-none"
              >
                <option value="draft">Rascunho</option>
                <option value="sent">Enviada</option>
                <option value="accepted">Aceita</option>
                <option value="rejected">Recusada</option>
              </select>
              <button onClick={() => onChange(proposals.filter((x) => x.id !== p.id))} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
      {adding ? (
        <div className="border border-dashed border-border rounded-lg p-3 space-y-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da proposta"
            className="w-full border border-input bg-background rounded px-2.5 py-1.5 text-sm focus:outline-none" />
          <div className="flex gap-2">
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Valor (ex: R$ 5.000)"
              className="flex-1 border border-input bg-background rounded px-2.5 py-1.5 text-sm focus:outline-none" />
            <select value={status} onChange={(e) => setStatus(e.target.value as DealProposal["status"])}
              className="border border-input bg-background rounded px-2 py-1.5 text-sm focus:outline-none">
              <option value="draft">Rascunho</option>
              <option value="sent">Enviada</option>
              <option value="accepted">Aceita</option>
              <option value="rejected">Recusada</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-sm border border-input rounded hover:bg-muted">Cancelar</button>
            <button onClick={addProposal} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90">Adicionar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:text-foreground">
          <Plus className="h-3.5 w-3.5" /> Nova proposta
        </button>
      )}
    </div>
  );
}

// ─── Main DealDetailDrawer ────────────────────────────────────
export default function DealDetailDrawer({ card, funnel, funnels, people, onClose, onUpdate, onMoveToFunnel }: {
  card: FunnelCard;
  funnel: Funnel;
  funnels: Funnel[];
  people: Person[];
  onClose: () => void;
  onUpdate: (updated: FunnelCard) => void;
  onMoveToFunnel: (cardId: string, targetFunnelId: string, targetStageId: string) => void;
}) {
  const [draft, setDraft] = useState<FunnelCard>({ ...card });
  const [dirty, setDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("history");
  const [showMoveFunnel, setShowMoveFunnel] = useState(false);
  const [moveFunnelId, setMoveFunnelId] = useState("");
  const [moveStageId, setMoveStageId] = useState("");

  const otherFunnels = funnels.filter((f) => f.id !== funnel.id);
  const moveTargetFunnel = funnels.find((f) => f.id === moveFunnelId);

  const stage = funnel.stages.find((s) => s.id === draft.stageId);
  const temp  = TEMP_CONFIG[draft.temperature];

  function set<K extends keyof FunnelCard>(key: K, value: FunnelCard[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  }

  function save() {
    onUpdate(draft);
    setDirty(false);
    toast.success("Negociação atualizada.");
  }

  function updateTabData(key: keyof FunnelCard, value: unknown) {
    const updated = { ...draft, [key]: value } as FunnelCard;
    setDraft(updated);
    onUpdate(updated);
  }

  const linkedContacts = people.filter((p) => (draft.contactIds ?? []).includes(p.id));

  const TABS: { id: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { id: "history",   label: "Histórico", icon: Clock,       count: (draft.history ?? []).length },
    { id: "tasks",     label: "Tarefas",   icon: CheckSquare, count: (draft.dealTasks ?? []).length },
    { id: "emails",    label: "E-mails",   icon: Mail,        count: (draft.emails ?? []).length },
    { id: "products",  label: "Produtos",  icon: Package,     count: (draft.products ?? []).length },
    { id: "files",     label: "Arquivos",  icon: Paperclip,   count: (draft.files ?? []).length },
    { id: "proposals", label: "Propostas", icon: FileText,    count: (draft.proposals ?? []).length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="w-[640px] bg-card border-l border-border flex flex-col h-full overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <DollarSign className="h-5 w-5 text-primary shrink-0" />
            <div className="min-w-0">
              <h2 className="font-semibold text-foreground truncate">{draft.title || draft.companyName}</h2>
              {stage && <p className="text-xs text-muted-foreground">{stage.title}</p>}
            </div>
            <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${temp.cls}`}>{temp.label}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            {otherFunnels.length > 0 && (
              <button
                onClick={() => { setShowMoveFunnel(true); setMoveFunnelId(""); setMoveStageId(""); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-input rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <Shuffle className="h-3.5 w-3.5" /> Mover de funil
              </button>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Mover de Funil */}
        {showMoveFunnel && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-xl">
              <h3 className="font-semibold text-foreground mb-4">Mover para outro funil</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Funil destino</label>
                  <select
                    value={moveFunnelId}
                    onChange={(e) => { setMoveFunnelId(e.target.value); setMoveStageId(""); }}
                    className="w-full border border-input bg-background rounded-md px-3 py-1.5 text-sm focus:outline-none"
                  >
                    <option value="">Selecionar funil...</option>
                    {otherFunnels.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                {moveTargetFunnel && (
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Estágio de entrada</label>
                    <select
                      value={moveStageId}
                      onChange={(e) => setMoveStageId(e.target.value)}
                      className="w-full border border-input bg-background rounded-md px-3 py-1.5 text-sm focus:outline-none"
                    >
                      <option value="">Selecionar estágio...</option>
                      {moveTargetFunnel.stages.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end mt-5">
                <button onClick={() => setShowMoveFunnel(false)} className="px-4 py-1.5 text-sm border border-input rounded-md hover:bg-muted">Cancelar</button>
                <button
                  disabled={!moveFunnelId || !moveStageId}
                  onClick={() => { onMoveToFunnel(card.id, moveFunnelId, moveStageId); setShowMoveFunnel(false); }}
                  className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-40"
                >
                  Mover
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* Info section */}
          <div className="px-6 py-5 border-b border-border space-y-4">
            {/* Nome da negociação */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Nome da negociação</label>
              <input value={draft.title ?? ""} onChange={(e) => set("title", e.target.value)}
                placeholder={draft.companyName}
                className="w-full border border-input bg-background rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Qualificação */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Qualificação</label>
                <select value={draft.qualification ?? ""} onChange={(e) => set("qualification", e.target.value)}
                  className="w-full border border-input bg-background rounded-md px-3 py-1.5 text-sm focus:outline-none">
                  <option value="">Selecionar...</option>
                  {QUAL_OPTIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>

              {/* Criado em */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Criado em</label>
                <p className="text-sm text-foreground py-1.5">{fmtDate(draft.createdAt)}</p>
              </div>

              {/* Valor total */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Valor total</label>
                <input value={draft.totalValue ?? ""} onChange={(e) => set("totalValue", e.target.value)}
                  placeholder="R$ 0,00"
                  className="w-full border border-input bg-background rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              {/* Previsão de fechamento */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Previsão de fechamento</label>
                <input type="date" value={draft.forecastDate ?? ""} onChange={(e) => set("forecastDate", e.target.value)}
                  className="w-full border border-input bg-background rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              {/* Campanha */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Campanha</label>
                <input value={draft.campaign ?? ""} onChange={(e) => set("campaign", e.target.value)}
                  placeholder="Nome da campanha"
                  className="w-full border border-input bg-background rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              {/* Fonte */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Fonte</label>
                <select value={draft.source ?? ""} onChange={(e) => set("source", e.target.value)}
                  className="w-full border border-input bg-background rounded-md px-3 py-1.5 text-sm focus:outline-none">
                  <option value="">Selecionar...</option>
                  {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Empresa */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Empresa</label>
                <div className="flex items-center gap-1.5 text-sm text-foreground py-1.5">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{draft.companyName || "—"}</span>
                </div>
              </div>

              {/* Responsável */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Responsável</label>
                <select
                  value={draft.responsibleId ?? ""}
                  onChange={(e) => {
                    const p = people.find((x) => x.id === e.target.value);
                    setDraft((d) => ({ ...d, responsibleId: e.target.value, responsibleName: p?.name ?? "" }));
                    setDirty(true);
                  }}
                  className="w-full border border-input bg-background rounded-md px-3 py-1.5 text-sm focus:outline-none"
                >
                  <option value="">Selecionar...</option>
                  {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            {/* Contatos vinculados */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">Contatos vinculados</label>
              {linkedContacts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {linkedContacts.map((c) => (
                    <span key={c.id} className="inline-flex items-center gap-1 text-xs bg-muted rounded-full px-2.5 py-1">
                      <User className="h-3 w-3" /> {c.name}
                      <button
                        onClick={() => set("contactIds", (draft.contactIds ?? []).filter((id) => id !== c.id))}
                        className="text-muted-foreground hover:text-destructive ml-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <select
                value=""
                onChange={(e) => {
                  if (!e.target.value) return;
                  const ids = draft.contactIds ?? [];
                  if (!ids.includes(e.target.value)) set("contactIds", [...ids, e.target.value]);
                  e.currentTarget.value = "";
                }}
                className="w-full border border-input bg-background rounded-md px-3 py-1.5 text-sm focus:outline-none"
              >
                <option value="">+ Vincular contato...</option>
                {people
                  .filter((p) => !(draft.contactIds ?? []).includes(p.id))
                  .map((p) => <option key={p.id} value={p.id}>{p.name}{p.companyName ? ` (${p.companyName})` : ""}</option>)
                }
              </select>
            </div>

            {dirty && (
              <div className="flex justify-end pt-1">
                <button onClick={save} className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm rounded-md hover:opacity-90">
                  <Check className="h-3.5 w-3.5" /> Salvar alterações
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div>
            <div className="flex border-b border-border overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="bg-muted text-foreground rounded-full px-1.5 py-0.5 text-[10px]">{tab.count}</span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="p-4">
              {activeTab === "history"   && <HistoryTab   history={draft.history ?? []}       onChange={(h) => updateTabData("history", h)} />}
              {activeTab === "tasks"     && <TasksTab     tasks={draft.dealTasks ?? []}        onChange={(t) => updateTabData("dealTasks", t)} />}
              {activeTab === "emails"    && <EmailsTab    emails={draft.emails ?? []}          onChange={(e) => updateTabData("emails", e)} />}
              {activeTab === "products"  && <ProductsTab  products={draft.products ?? []}      onChange={(p) => updateTabData("products", p)} />}
              {activeTab === "files"     && <FilesTab     files={draft.files ?? []}            onChange={(f) => updateTabData("files", f)} />}
              {activeTab === "proposals" && <ProposalsTab proposals={draft.proposals ?? []}    onChange={(p) => updateTabData("proposals", p)} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

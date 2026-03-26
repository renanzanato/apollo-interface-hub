import { useState, useEffect, useMemo } from "react";
import {
  CheckSquare, Plus, Search, Pencil, Trash2, X, ChevronDown,
  CheckCircle2, Circle, Clock, AlertCircle,
} from "lucide-react";
import { TaskDB, PersonDB, CompanyDB } from "@/lib/db";
import type { Task, Person, Company } from "@/types";
import { toast } from "sonner";

const PRIORITY_CONFIG = {
  low:      { label: "Baixa",    cls: "bg-slate-500/15 text-slate-500" },
  normal:   { label: "Normal",   cls: "bg-blue-500/15 text-blue-500" },
  high:     { label: "Alta",     cls: "bg-amber-500/15 text-amber-600" },
  critical: { label: "Crítica",  cls: "bg-red-500/15 text-red-600" },
};

const STATUS_CONFIG: Record<Task["status"], { label: string; icon: React.ElementType; cls: string }> = {
  pending:     { label: "Pendente",    icon: Circle,        cls: "text-muted-foreground" },
  in_progress: { label: "Em andamento", icon: Clock,         cls: "text-amber-500" },
  done:        { label: "Concluída",   icon: CheckCircle2,  cls: "text-emerald-500" },
};

const emptyForm = (): Omit<Task, "id" | "createdAt" | "updatedAt"> => ({
  title: "",
  description: "",
  status: "pending",
  priority: "normal",
  dueDate: "",
  personId: "",
  personName: "",
  companyId: "",
  companyName: "",
});

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | Task["status"]>("");
  const [filterPriority, setFilterPriority] = useState<"" | Task["priority"]>("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function reload() {
    const [t, p, c] = await Promise.all([TaskDB.getAll(), PersonDB.getAll(), CompanyDB.getAll()]);
    setTasks(t);
    setPeople(p);
    setCompanies(c);
    checkNotifications(t);
  }

  const notifiedIds = useState(() => new Set<string>())[0];

  function checkNotifications(taskList: Task[]) {
    if (!("Notification" in window)) return;
    const today = new Date().toISOString().split("T")[0];
    const overdue = taskList.filter(
      (t) => t.status !== "done" && t.dueDate && t.dueDate <= today && !notifiedIds.has(t.id)
    );
    if (overdue.length === 0) return;

    const fire = () => {
      overdue.forEach((t) => {
        notifiedIds.add(t.id);
        new Notification("Tarefa pendente", {
          body: `${t.title}${t.dueDate === today ? " — vence hoje" : " — vencida"}`,
          icon: "/favicon.ico",
        });
      });
    };

    if (Notification.permission === "granted") {
      fire();
    } else if (Notification.permission === "default") {
      Notification.requestPermission().then((perm) => { if (perm === "granted") fire(); });
    }
  }

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    let list = tasks;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.personName ?? "").toLowerCase().includes(q) ||
          (t.companyName ?? "").toLowerCase().includes(q)
      );
    }
    if (filterStatus) list = list.filter((t) => t.status === filterStatus);
    if (filterPriority) list = list.filter((t) => t.priority === filterPriority);
    // Ordenar: pendentes primeiro, depois em andamento, depois concluídas
    return [...list].sort((a, b) => {
      const order = { pending: 0, in_progress: 1, done: 2 };
      return order[a.status] - order[b.status];
    });
  }, [tasks, search, filterStatus, filterPriority]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setShowForm(true);
  }

  function openEdit(t: Task) {
    setEditing(t);
    setForm({ ...t });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  function handlePersonChange(personId: string) {
    const person = people.find((p) => p.id === personId);
    setForm((f) => ({ ...f, personId, personName: person?.name ?? "" }));
  }

  function handleCompanyChange(companyId: string) {
    const company = companies.find((c) => c.id === companyId);
    setForm((f) => ({ ...f, companyId, companyName: company?.name ?? "" }));
  }

  async function toggleStatus(task: Task) {
    const next: Task["status"] =
      task.status === "pending" ? "in_progress" :
      task.status === "in_progress" ? "done" : "pending";
    try {
      await TaskDB.update(task.id, { status: next });
      reload();
    } catch {
      toast.error("Erro ao atualizar status.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Título é obrigatório."); return; }

    try {
      if (editing) {
        await TaskDB.update(editing.id, form);
        toast.success("Tarefa atualizada.");
      } else {
        await TaskDB.save(form);
        toast.success("Tarefa criada.");
      }
      closeForm();
      reload();
    } catch {
      toast.error("Erro ao salvar tarefa.");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await TaskDB.remove(deleteId);
      setDeleteId(null);
      reload();
      toast.success("Tarefa removida.");
    } catch {
      toast.error("Erro ao remover tarefa.");
    }
  }

  const overdue = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "done"
  );

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="crm-section-enter flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <CheckSquare className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-semibold text-foreground">Tarefas</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Acompanhe suas tarefas diárias e follow-ups por conta e contato.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </button>
        </div>

        {/* Alertas de vencimento */}
        {overdue.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm rounded-lg px-4 py-3 mb-5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              {overdue.length} tarefa{overdue.length > 1 ? "s" : ""} vencida{overdue.length > 1 ? "s" : ""}.
            </span>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar tarefas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-input bg-background rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as "" | Task["status"])}
              className="appearance-none border border-input bg-background rounded-md pl-3 pr-8 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="in_progress">Em andamento</option>
              <option value="done">Concluída</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as "" | Task["priority"])}
              className="appearance-none border border-input bg-background rounded-md pl-3 pr-8 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Toda prioridade</option>
              <option value="critical">Crítica</option>
              <option value="high">Alta</option>
              <option value="normal">Normal</option>
              <option value="low">Baixa</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
          {(search || filterStatus || filterPriority) && (
            <button
              onClick={() => { setSearch(""); setFilterStatus(""); setFilterPriority(""); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-input rounded-md px-3 py-2"
            >
              <X className="h-3.5 w-3.5" /> Limpar
            </button>
          )}
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <EmptyState onNew={openCreate} hasFilter={!!(search || filterStatus || filterPriority)} />
        ) : (
          <div className="space-y-2">
            {filtered.map((task) => {
              const status = STATUS_CONFIG[task.status];
              const StatusIcon = status.icon;
              const priority = PRIORITY_CONFIG[task.priority];
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";

              return (
                <div
                  key={task.id}
                  className={`bg-card border border-border rounded-lg px-4 py-3 flex items-start gap-3 hover:shadow-sm transition-shadow ${task.status === "done" ? "opacity-60" : ""}`}
                >
                  {/* Toggle status */}
                  <button
                    onClick={() => toggleStatus(task)}
                    className={`mt-0.5 shrink-0 ${status.cls} hover:scale-110 transition-transform`}
                    title={`Mudar para: ${task.status === "pending" ? "Em andamento" : task.status === "in_progress" ? "Concluída" : "Pendente"}`}
                  >
                    <StatusIcon className="h-5 w-5" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`font-medium text-foreground text-sm ${task.status === "done" ? "line-through" : ""}`}>
                          {task.title}
                        </span>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEdit(task)} className="p-1.5 rounded hover:bg-muted text-muted-foreground">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(task.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center flex-wrap gap-2 mt-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${priority.cls}`}>
                        {priority.label}
                      </span>
                      {task.personName && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {task.personName}
                        </span>
                      )}
                      {task.companyName && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {task.companyName}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className={`text-xs flex items-center gap-1 ${isOverdue ? "text-red-500" : "text-muted-foreground"}`}>
                          <Clock className="h-3 w-3" />
                          {new Date(task.dueDate + "T00:00:00").toLocaleDateString("pt-BR")}
                          {isOverdue && " (vencida)"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="text-xs text-muted-foreground pt-1">
              {filtered.length} tarefa{filtered.length !== 1 ? "s" : ""}
              {filtered.length !== tasks.length && ` (de ${tasks.length} total)`}
            </div>
          </div>
        )}
      </div>

      {/* Modal Formulário */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card">
              <h2 className="font-semibold text-foreground">{editing ? "Editar Tarefa" : "Nova Tarefa"}</h2>
              <button onClick={closeForm} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Título <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="O que precisa ser feito?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder="Detalhes adicionais..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Prioridade</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Task["priority"] }))}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="low">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Task["status"] }))}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="pending">Pendente</option>
                    <option value="in_progress">Em andamento</option>
                    <option value="done">Concluída</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Vencimento</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Pessoa</label>
                  <select
                    value={form.personId}
                    onChange={(e) => handlePersonChange(e.target.value)}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Nenhuma</option>
                    {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Empresa</label>
                  <select
                    value={form.companyId}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Nenhuma</option>
                    {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm} className="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90">
                  {editing ? "Salvar" : "Criar Tarefa"}
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
            <h2 className="font-semibold text-foreground mb-2">Remover Tarefa</h2>
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
      <CheckSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">
        {hasFilter ? "Nenhuma tarefa encontrada" : "Nenhuma tarefa criada"}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
        {hasFilter ? "Ajuste os filtros ou crie uma nova tarefa." : "Organize seus follow-ups criando sua primeira tarefa."}
      </p>
      {!hasFilter && (
        <button onClick={onNew} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm font-medium hover:opacity-90">
          Começar
        </button>
      )}
    </div>
  );
}

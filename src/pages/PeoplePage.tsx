import { useState, useEffect, useMemo, useRef } from "react";
import {
  Users, Plus, Search, Pencil, Trash2, X, ChevronDown, Phone, Mail, Building2,
  Download, Upload, Sparkles, Linkedin,
} from "lucide-react";
import { PersonDB, CompanyDB, CityDB } from "@/lib/db";
import type { Person, Company, City } from "@/types";
import { toast } from "sonner";
import { downloadCSV, parseCSV } from "@/lib/csv";
import { apolloEnrichPerson, perplexityResearch } from "@/lib/integrations";

const STATUS_LABELS: Record<Person["status"], string> = {
  active: "Ativo",
  inactive: "Inativo",
};

const emptyForm = (): Omit<Person, "id" | "createdAt" | "updatedAt"> => ({
  name: "",
  email: "",
  phone: "",
  role: "",
  linkedin: "",
  companyId: "",
  companyName: "",
  city: "",
  state: "",
  tags: [],
  status: "active",
});

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | Person["status"]>("");
  const [filterCity, setFilterCity] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [tagInput, setTagInput] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<Record<string, string>[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichConflicts, setEnrichConflicts] = useState<{ key: string; label: string; current: string; incoming: string; accept: boolean }[]>([]);
  const [researching, setResearching] = useState(false);
  const [researchResult, setResearchResult] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function reload() {
    const [p, c, ci] = await Promise.all([PersonDB.getAll(), CompanyDB.getAll(), CityDB.getAll()]);
    setPeople(p);
    setCompanies(c);
    setCities(ci);
  }

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    let list = people;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          (p.companyName ?? "").toLowerCase().includes(q)
      );
    }
    if (filterStatus) list = list.filter((p) => p.status === filterStatus);
    if (filterCity) list = list.filter((p) => p.city === filterCity);
    return list;
  }, [people, search, filterStatus, filterCity]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setTagInput("");
    setShowForm(true);
  }

  function openEdit(p: Person) {
    setEditing(p);
    setForm({ ...p });
    setTagInput("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setEnrichConflicts([]);
    setResearchResult("");
  }

  function handleCompanyChange(companyId: string) {
    const company = companies.find((c) => c.id === companyId);
    setForm((f) => ({
      ...f,
      companyId,
      companyName: company?.name ?? "",
    }));
  }

  function addTag() {
    const tag = tagInput.trim();
    if (!tag || form.tags.includes(tag)) return;
    setForm((f) => ({ ...f, tags: [...f.tags, tag] }));
    setTagInput("");
  }

  function removeTag(tag: string) {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  }

  async function handleEnrich() {
    if (!form.email && !form.name) {
      toast.error("Preencha ao menos o nome ou e-mail para enriquecer.");
      return;
    }
    setEnriching(true);
    setEnrichConflicts([]);
    try {
      const result = await apolloEnrichPerson({
        email: form.email || undefined,
        name: form.name || undefined,
        organizationName: form.companyName || undefined,
        linkedinUrl: form.linkedin || undefined,
      });
      if (result.error) { toast.error(result.error); return; }

      // Se veio mais de 1 e-mail ou telefone, gera candidatos extras para o usuário escolher
      const phoneCandidates = result.phones?.length ? result.phones : (result.phone ? [result.phone] : []);
      const emailCandidates = result.emails?.length ? result.emails : (result.email ? [result.email] : []);

      const candidates: { key: string; label: string; current: string; incoming: string }[] = [
        { key: "name",        label: "Nome",     current: form.name,          incoming: result.name         ?? "" },
        { key: "email",       label: "E-mail",   current: form.email,         incoming: emailCandidates[0]  ?? "" },
        { key: "phone",       label: "Telefone", current: form.phone,         incoming: phoneCandidates[0]  ?? "" },
        { key: "role",        label: "Cargo",    current: form.role,          incoming: result.title        ?? "" },
        { key: "linkedin",    label: "LinkedIn", current: form.linkedin ?? "", incoming: result.linkedin_url ?? "" },
        { key: "companyName", label: "Empresa",  current: form.companyName ?? "", incoming: result.organization?.name ?? "" },
        // Emails adicionais como candidatos extras
        ...emailCandidates.slice(1).map((e, i) => ({
          key: `email_extra_${i}`, label: `E-mail extra ${i + 2}`, current: "", incoming: e,
        })),
        // Telefones adicionais como candidatos extras
        ...phoneCandidates.slice(1).map((p, i) => ({
          key: `phone_extra_${i}`, label: `Telefone extra ${i + 2}`, current: "", incoming: p,
        })),
      ];

      const autoFill: Record<string, string> = {};
      const conflicts: typeof enrichConflicts = [];

      for (const c of candidates) {
        if (!c.incoming) continue;
        if (!c.current) {
          autoFill[c.key] = c.incoming;
        } else if (c.current !== c.incoming) {
          conflicts.push({ ...c, accept: false });
        }
      }

      if (Object.keys(autoFill).length > 0) {
        setForm((f) => ({ ...f, ...autoFill }));
      }

      if (conflicts.length > 0) {
        setEnrichConflicts(conflicts);
        toast.info(`${conflicts.length} campo(s) já preenchidos têm dados diferentes. Revise abaixo.`);
      } else {
        toast.success("Dados enriquecidos com sucesso!");
      }
    } catch {
      toast.error("Erro ao enriquecer dados.");
    } finally {
      setEnriching(false);
    }
  }

  function applyConflicts() {
    const patch: Record<string, string> = {};
    for (const c of enrichConflicts) {
      if (c.accept) patch[c.key] = c.incoming;
    }
    setForm((f) => ({ ...f, ...patch }));
    setEnrichConflicts([]);
    toast.success("Dados aplicados.");
  }

  async function handleResearch() {
    if (!form.name) { toast.error("Preencha o nome para pesquisar."); return; }
    setResearching(true);
    setResearchResult("");
    try {
      const result = await perplexityResearch({
        name: form.name,
        company: form.companyName || undefined,
        role: form.role || undefined,
        linkedin: form.linkedin || undefined,
      });
      if (result.error) { toast.error(result.error); return; }
      setResearchResult(result.content);
    } catch {
      toast.error("Erro ao pesquisar.");
    } finally {
      setResearching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Nome é obrigatório."); return; }

    try {
      if (editing) {
        await PersonDB.update(editing.id, form);
        toast.success("Pessoa atualizada.");
      } else {
        await PersonDB.save(form);
        toast.success("Pessoa cadastrada.");
      }
      closeForm();
      reload();
    } catch {
      toast.error("Erro ao salvar pessoa.");
    }
  }

  function confirmDelete(id: string) {
    setDeleteId(id);
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await PersonDB.remove(deleteId);
      setDeleteId(null);
      reload();
      toast.success("Pessoa removida.");
    } catch {
      toast.error("Erro ao remover pessoa.");
    }
  }

  // ── Export ──────────────────────────────────────────────────
  function handleExport() {
    const rows = filtered.map((p) => ({
      nome: p.name, email: p.email, telefone: p.phone, cargo: p.role,
      empresa: p.companyName ?? "", cidade: p.city ?? "", estado: p.state ?? "",
      tags: p.tags.join(";"), status: p.status,
    }));
    downloadCSV(`pessoas-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success(`${rows.length} registros exportados.`);
  }

  // ── Import ──────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target?.result as string);
      if (rows.length === 0) { toast.error("Arquivo vazio ou formato inválido."); return; }
      setImportPreview(rows);
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  }

  async function confirmImport() {
    if (!importPreview) return;
    setImporting(true);
    let ok = 0; let fail = 0;
    for (const row of importPreview) {
      const name = row["nome"] || row["name"] || row["contact name"] || row["primeiro nome"] || "";
      if (!name) { fail++; continue; }
      try {
        await PersonDB.save({
          name,
          email:       row["email"] ?? "",
          phone:       row["telefone"] || row["phone"] || row["celular"] || "",
          role:        row["cargo"] || row["role"] || row["title"] || "",
          companyName: row["empresa"] || row["company"] || row["company name"] || "",
          companyId:   "",
          city:        row["cidade"] || row["city"] || "",
          state:       row["estado"] || row["state"] || "",
          tags:        (row["tags"] ?? "").split(";").map((t) => t.trim()).filter(Boolean),
          status:      "active",
        });
        ok++;
      } catch { fail++; }
    }
    setImporting(false);
    setImportPreview(null);
    reload();
    toast.success(`${ok} importados${fail > 0 ? ` · ${fail} com erro` : ""}.`);
  }

  const uniqueCities = [...new Set(people.map((p) => p.city).filter(Boolean))];

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="crm-section-enter flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Users className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-semibold text-foreground">Pessoas</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Gerencie seu mailing de contatos. Busque e organize seus leads.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 border border-input bg-background px-3 py-2.5 rounded-md text-sm font-medium hover:bg-muted transition-colors"
              title="Importar CSV"
            >
              <Upload className="h-4 w-4" /> Importar
            </button>
            <button
              onClick={handleExport}
              disabled={people.length === 0}
              className="flex items-center gap-2 border border-input bg-background px-3 py-2.5 rounded-md text-sm font-medium hover:bg-muted transition-colors disabled:opacity-40"
              title="Exportar CSV"
            >
              <Download className="h-4 w-4" /> Exportar
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Nova Pessoa
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-input bg-background rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as "" | Person["status"])}
              className="appearance-none border border-input bg-background rounded-md pl-3 pr-8 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Todos os status</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="appearance-none border border-input bg-background rounded-md pl-3 pr-8 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Todas as cidades</option>
              {uniqueCities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
          {(search || filterStatus || filterCity) && (
            <button
              onClick={() => { setSearch(""); setFilterStatus(""); setFilterCity(""); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-input rounded-md px-3 py-2"
            >
              <X className="h-3.5 w-3.5" /> Limpar filtros
            </button>
          )}
        </div>

        {/* Tabela */}
        {filtered.length === 0 ? (
          <EmptyState onNew={openCreate} hasFilter={!!(search || filterStatus || filterCity)} />
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contato</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Empresa</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cidade</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((person, idx) => (
                  <tr
                    key={person.id}
                    className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/10"}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{person.name}</div>
                      {person.role && (
                        <div className="text-xs text-muted-foreground">{person.role}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {person.email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="text-xs">{person.email}</span>
                        </div>
                      )}
                      {person.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                          <Phone className="h-3.5 w-3.5" />
                          <span className="text-xs">{person.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {person.companyName ? (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>{person.companyName}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {person.city ? `${person.city}/${person.state}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          person.status === "active"
                            ? "bg-emerald-500/15 text-emerald-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {STATUS_LABELS[person.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openEdit(person)}
                          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => confirmDelete(person.id)}
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
              {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
              {filtered.length !== people.length && ` (de ${people.length} total)`}
            </div>
          </div>
        )}
      </div>

      {/* Modal Formulário */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card">
              <h2 className="font-semibold text-foreground">
                {editing ? "Editar Pessoa" : "Nova Pessoa"}
              </h2>
              <button onClick={closeForm} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Botões de enriquecimento */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleEnrich}
                  disabled={enriching}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-primary/10 text-primary border border-primary/30 rounded-md hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  {enriching ? "Enriquecendo..." : "Enriquecer dados"}
                </button>
                <button
                  type="button"
                  onClick={handleResearch}
                  disabled={researching}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-violet-500/10 text-violet-600 border border-violet-500/30 rounded-md hover:bg-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Search className="h-4 w-4" />
                  {researching ? "Pesquisando..." : "Pesquisar contexto"}
                </button>
              </div>

              {/* Conflitos de enriquecimento */}
              {enrichConflicts.length > 0 && (
                <div className="border border-amber-400/40 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                    Campos já preenchidos — selecione quais deseja substituir:
                  </p>
                  {enrichConflicts.map((c, i) => (
                    <label key={c.key} className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={c.accept}
                        onChange={(e) => setEnrichConflicts((prev) =>
                          prev.map((item, idx) => idx === i ? { ...item, accept: e.target.checked } : item)
                        )}
                        className="mt-0.5 accent-primary"
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <span className="font-medium text-foreground">{c.label}: </span>
                        <span className="line-through text-muted-foreground truncate">{c.current}</span>
                        <span className="text-muted-foreground mx-1">→</span>
                        <span className="text-primary font-medium truncate">{c.incoming}</span>
                      </div>
                    </label>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={applyConflicts} className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded-md hover:opacity-90">
                      Aplicar selecionados
                    </button>
                    <button type="button" onClick={() => setEnrichConflicts([])} className="text-xs px-3 py-1 border border-input rounded-md hover:bg-muted">
                      Descartar
                    </button>
                  </div>
                </div>
              )}

              {/* Resultado Perplexity */}
              {researchResult && (
                <div className="border border-violet-400/30 bg-violet-50 dark:bg-violet-950/20 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium text-violet-700 dark:text-violet-400">Contexto (Perplexity)</p>
                    <button type="button" onClick={() => setResearchResult("")} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{researchResult}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Nome <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    E-mail <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="email@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Telefone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Cargo</label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="ex: Diretor Comercial"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                    <Linkedin className="h-3.5 w-3.5 text-[#0A66C2]" />
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={form.linkedin ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, linkedin: e.target.value }))}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="https://linkedin.com/in/nome"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Empresa</label>
                  <select
                    value={form.companyId}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Sem empresa</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Cidade</label>
                  <select
                    value={form.city}
                    onChange={(e) => {
                      const city = cities.find((c) => c.name === e.target.value);
                      setForm((f) => ({ ...f, city: e.target.value, state: city?.state ?? "" }));
                    }}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Selecionar cidade</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.name}>{c.name} — {c.state}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Person["status"] }))}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">Tags</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                      className="flex-1 border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Adicionar tag (Enter)"
                    />
                    <button type="button" onClick={addTag} className="px-3 py-2 text-sm border border-input rounded-md hover:bg-muted">
                      + Add
                    </button>
                  </div>
                  {form.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {form.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)}>
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeForm} className="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90">
                  {editing ? "Salvar alterações" : "Cadastrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Importar CSV */}
      {importPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" /> Importar Pessoas
              </h2>
              <button onClick={() => setImportPreview(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-foreground">
                <strong>{importPreview.length}</strong> registros encontrados no arquivo.
              </p>
              <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-3 space-y-1">
                <p className="font-medium text-foreground mb-2">Colunas reconhecidas (primeiras 3 linhas):</p>
                {importPreview.slice(0, 3).map((row, i) => (
                  <div key={i} className="truncate">
                    {Object.entries(row).slice(0, 4).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Colunas aceitas no CSV:</p>
                <p>nome · email · telefone · cargo · empresa · cidade · estado · tags · status</p>
                <p className="italic">Tags separadas por ponto-e-vírgula. Aliases ingleses (name, phone, company, city...) também funcionam.</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
              <button onClick={() => setImportPreview(null)} className="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted">Cancelar</button>
              <button
                onClick={confirmImport}
                disabled={importing}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-60"
              >
                {importing ? "Importando..." : `Importar ${importPreview.length} registros`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmação Delete */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-foreground mb-2">Remover Pessoa</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Esta ação não pode ser desfeita. Deseja continuar?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm border border-input rounded-md hover:bg-muted">
                Cancelar
              </button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm bg-destructive text-white rounded-md hover:opacity-90">
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ onNew, hasFilter }: { onNew: () => void; hasFilter: boolean }) {
  return (
    <div className="bg-card border border-border rounded-lg p-12 text-center crm-section-enter">
      <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">
        {hasFilter ? "Nenhum resultado encontrado" : "Nenhuma pessoa cadastrada"}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
        {hasFilter
          ? "Tente ajustar os filtros para encontrar o que procura."
          : "Comece cadastrando seu primeiro contato."}
      </p>
      {!hasFilter && (
        <button
          onClick={onNew}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Começar
        </button>
      )}
    </div>
  );
}

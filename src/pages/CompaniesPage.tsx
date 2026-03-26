import { useState, useEffect, useMemo, useRef } from "react";
import {
  Building2, Plus, Search, Pencil, Trash2, X, ChevronDown,
  Flame, Sun, Snowflake, Globe, Download, Upload,
} from "lucide-react";
import { CompanyDB, CityDB } from "@/lib/db";
import type { Company, City } from "@/types";
import { toast } from "sonner";
import { downloadCSV, parseCSV } from "@/lib/csv";

const TEMP_CONFIG = {
  hot:  { label: "Hot",  icon: Flame,     cls: "bg-red-500/15 text-red-500" },
  warm: { label: "Warm", icon: Sun,       cls: "bg-amber-500/15 text-amber-500" },
  cold: { label: "Cold", icon: Snowflake, cls: "bg-blue-500/15 text-blue-500" },
};

const STATUS_LABELS: Record<Company["status"], string> = {
  active: "Ativo",
  inactive: "Inativo",
  prospect: "Prospect",
};

const emptyForm = (): Omit<Company, "id" | "createdAt" | "updatedAt"> => ({
  name: "",
  cnpj: "",
  segment: "",
  website: "",
  city: "",
  state: "",
  employees: undefined,
  annualRevenue: "",
  status: "prospect",
  temperature: "cold",
  tags: [],
});

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | Company["status"]>("");
  const [filterTemp, setFilterTemp] = useState<"" | Company["temperature"]>("");
  const [filterCity, setFilterCity] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [tagInput, setTagInput] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<Record<string, string>[] | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function reload() {
    const [c, ci] = await Promise.all([CompanyDB.getAll(), CityDB.getAll()]);
    setCompanies(c);
    setCities(ci);
  }

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    let list = companies;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.segment ?? "").toLowerCase().includes(q) ||
          (c.city ?? "").toLowerCase().includes(q)
      );
    }
    if (filterStatus) list = list.filter((c) => c.status === filterStatus);
    if (filterTemp) list = list.filter((c) => c.temperature === filterTemp);
    if (filterCity) list = list.filter((c) => c.city === filterCity);
    return list;
  }, [companies, search, filterStatus, filterTemp, filterCity]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setTagInput("");
    setShowForm(true);
  }

  function openEdit(c: Company) {
    setEditing(c);
    setForm({ ...c });
    setTagInput("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Nome é obrigatório."); return; }

    try {
      if (editing) {
        await CompanyDB.update(editing.id, form);
        toast.success("Empresa atualizada.");
      } else {
        await CompanyDB.save(form);
        toast.success("Empresa cadastrada.");
      }
      closeForm();
      reload();
    } catch {
      toast.error("Erro ao salvar empresa.");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await CompanyDB.remove(deleteId);
      setDeleteId(null);
      reload();
      toast.success("Empresa removida.");
    } catch {
      toast.error("Erro ao remover empresa.");
    }
  }

  // ── Export ──────────────────────────────────────────────────
  function handleExport() {
    const rows = filtered.map((c) => ({
      nome: c.name, cnpj: c.cnpj ?? "", segmento: c.segment ?? "",
      website: c.website ?? "", cidade: c.city ?? "", estado: c.state ?? "",
      funcionarios: c.employees ?? "", receita_anual: c.annualRevenue ?? "",
      temperatura: c.temperature, status: c.status,
      tags: c.tags.join(";"),
    }));
    downloadCSV(`empresas-${new Date().toISOString().slice(0, 10)}.csv`, rows);
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
      const name = row["nome"] || row["nome_empresa"] || row["name"] || row["empresa"] || row["company"] || row["company name"] || "";
      if (!name) { fail++; continue; }
      const temp = (row["temperatura"] || row["temperature"] || row["status_termico"] || "cold") as Company["temperature"];
      const status = (row["status"] || "prospect") as Company["status"];
      try {
        await CompanyDB.save({
          name,
          cnpj:          row["cnpj"] ?? "",
          segment:       row["segmento"] || row["segment"] || row["industry"] || "",
          website:       row["website"] || row["site"] || "",
          city:          row["cidade"] || row["city"] || "",
          state:         row["estado"] || row["state"] || "",
          employees:     row["funcionarios"] || row["numero_funcionarios"] || row["employees"] ? Number(row["funcionarios"] || row["numero_funcionarios"] || row["employees"]) : undefined,
          annualRevenue: row["receita_anual"] || row["annual_revenue"] || row["revenue"] || "",
          temperature:   ["hot","warm","cold"].includes(temp) ? temp : "cold",
          status:        ["active","inactive","prospect"].includes(status) ? status : "prospect",
          tags:          (row["tags"] ?? "").split(";").map((t) => t.trim()).filter(Boolean),
        });
        ok++;
      } catch { fail++; }
    }
    setImporting(false);
    setImportPreview(null);
    reload();
    toast.success(`${ok} importados${fail > 0 ? ` · ${fail} com erro` : ""}.`);
  }

  const uniqueCities = [...new Set(companies.map((c) => c.city).filter(Boolean))];

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="crm-section-enter flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Building2 className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-semibold text-foreground">Empresas</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Todas as empresas do seu pipeline. Gerencie perfis, segmentos e dados corporativos.
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
              disabled={companies.length === 0}
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
              Nova Empresa
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome, segmento ou cidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-input bg-background rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as "" | Company["status"])}
              className="appearance-none border border-input bg-background rounded-md pl-3 pr-8 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Todos os status</option>
              <option value="prospect">Prospect</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filterTemp}
              onChange={(e) => setFilterTemp(e.target.value as "" | Company["temperature"])}
              className="appearance-none border border-input bg-background rounded-md pl-3 pr-8 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Temperatura</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
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
          {(search || filterStatus || filterTemp || filterCity) && (
            <button
              onClick={() => { setSearch(""); setFilterStatus(""); setFilterTemp(""); setFilterCity(""); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-input rounded-md px-3 py-2"
            >
              <X className="h-3.5 w-3.5" /> Limpar filtros
            </button>
          )}
        </div>

        {/* Tabela */}
        {filtered.length === 0 ? (
          <EmptyState onNew={openCreate} hasFilter={!!(search || filterStatus || filterTemp || filterCity)} />
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Empresa</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Segmento</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cidade</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Temperatura</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((company, idx) => {
                  const temp = TEMP_CONFIG[company.temperature];
                  const TempIcon = temp.icon;
                  return (
                    <tr
                      key={company.id}
                      className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/10"}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{company.name}</div>
                        {company.website && (
                          <a
                            href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                          >
                            <Globe className="h-3 w-3" />
                            {company.website}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{company.segment || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {company.city ? `${company.city}/${company.state}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${temp.cls}`}>
                          <TempIcon className="h-3 w-3" />
                          {temp.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            company.status === "active"
                              ? "bg-emerald-500/15 text-emerald-600"
                              : company.status === "prospect"
                              ? "bg-blue-500/15 text-blue-600"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {STATUS_LABELS[company.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => openEdit(company)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(company.id)}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
              {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
              {filtered.length !== companies.length && ` (de ${companies.length} total)`}
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
                {editing ? "Editar Empresa" : "Nova Empresa"}
              </h2>
              <button onClick={closeForm} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
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
                    placeholder="Nome da empresa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">CNPJ</label>
                  <input
                    type="text"
                    value={form.cnpj}
                    onChange={(e) => setForm((f) => ({ ...f, cnpj: e.target.value }))}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="00.000.000/0001-00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Segmento</label>
                  <input
                    type="text"
                    value={form.segment}
                    onChange={(e) => setForm((f) => ({ ...f, segment: e.target.value }))}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="ex: Tecnologia, Saúde..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Website</label>
                  <input
                    type="text"
                    value={form.website}
                    onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="empresa.com.br"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Funcionários</label>
                  <input
                    type="number"
                    value={form.employees ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, employees: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="ex: 150"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Receita Anual</label>
                  <input
                    type="text"
                    value={form.annualRevenue}
                    onChange={(e) => setForm((f) => ({ ...f, annualRevenue: e.target.value }))}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="ex: R$ 5M"
                  />
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
                  <label className="block text-sm font-medium text-foreground mb-1.5">Temperatura</label>
                  <select
                    value={form.temperature}
                    onChange={(e) => setForm((f) => ({ ...f, temperature: e.target.value as Company["temperature"] }))}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="cold">Cold</option>
                    <option value="warm">Warm</option>
                    <option value="hot">Hot</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Company["status"] }))}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="prospect">Prospect</option>
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
                <Upload className="h-4 w-4 text-primary" /> Importar Empresas
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
                <p className="font-medium text-foreground mb-2">Prévia (primeiras 3 linhas):</p>
                {importPreview.slice(0, 3).map((row, i) => (
                  <div key={i} className="truncate">
                    {Object.entries(row).slice(0, 4).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Colunas aceitas no CSV:</p>
                <p>nome · cnpj · segmento · website · cidade · estado · funcionarios · receita_anual · temperatura · status · tags</p>
                <p className="italic">Aliases ingleses (name, company, segment, industry, city, employees, revenue...) também funcionam.</p>
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

      {/* Modal Delete */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-foreground mb-2">Remover Empresa</h2>
            <p className="text-sm text-muted-foreground mb-5">Esta ação não pode ser desfeita. Deseja continuar?</p>
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
    <div className="bg-card border border-border rounded-lg p-12 text-center crm-section-enter">
      <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">
        {hasFilter ? "Nenhum resultado encontrado" : "Nenhuma empresa cadastrada"}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
        {hasFilter
          ? "Tente ajustar os filtros para encontrar o que procura."
          : "Comece cadastrando sua primeira empresa no pipeline."}
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

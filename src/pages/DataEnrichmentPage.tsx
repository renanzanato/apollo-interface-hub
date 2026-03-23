import { useState, useEffect } from "react";
import {
  Database, Search, Phone, Mail, Building2, ExternalLink,
  CheckCircle2, AlertCircle, Loader2, UserPlus, Plus, Settings,
  MessageSquare,
} from "lucide-react";
import { apolloEnrichPerson, apolloSearchOrganizations, wasellerOpenChat, IntegrationSettings } from "@/lib/integrations";
import { PersonStore, CompanyStore } from "@/lib/storage";
import type { ApolloEnrichResult } from "@/lib/integrations";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Tab = "person" | "company";

export default function DataEnrichmentPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("person");
  const [isReady, setIsReady] = useState(false);

  // Person enrichment
  const [pEmail, setPEmail]           = useState("");
  const [pName, setPName]             = useState("");
  const [pDomain, setPDomain]         = useState("");
  const [pOrg, setPOrg]               = useState("");
  const [pLoading, setPLoading]       = useState(false);
  const [pResult, setPResult]         = useState<ApolloEnrichResult | null>(null);

  // Company search
  const [cQuery, setCQuery]           = useState("");
  const [cLoading, setCLoading]       = useState(false);
  const [cResults, setCResults]       = useState<Array<{ id: string; name: string; website_url?: string; industry?: string; city?: string }>>([]);
  const [cError, setCError]           = useState("");

  useEffect(() => {
    setIsReady(IntegrationSettings.isApolloReady());
  }, []);

  async function enrichPerson() {
    if (!pEmail && !pName) { toast.error("Informe ao menos e-mail ou nome."); return; }
    setPLoading(true);
    setPResult(null);
    const result = await apolloEnrichPerson({
      email: pEmail || undefined,
      name: pName || undefined,
      domain: pDomain || undefined,
      organizationName: pOrg || undefined,
    });
    setPResult(result);
    setPLoading(false);
    if (result.error) toast.error(result.error);
  }

  async function searchCompanies() {
    if (!cQuery.trim()) { toast.error("Informe o nome da empresa."); return; }
    setCLoading(true);
    setCError("");
    const result = await apolloSearchOrganizations(cQuery);
    setCResults(result.organizations);
    setCError(result.error ?? "");
    setCLoading(false);
    if (result.error) toast.error(result.error);
  }

  function savePerson() {
    if (!pResult || pResult.error) return;
    PersonStore.save({
      name:        pResult.name ?? pName,
      email:       pResult.email ?? pEmail,
      phone:       pResult.phone ?? "",
      role:        pResult.title ?? "",
      companyName: pResult.organization?.name ?? pOrg,
      companyId:   "",
      city:        pResult.organization?.city ?? "",
      state:       pResult.organization?.state ?? "",
      tags:        ["apollo-enriched"],
      status:      "active",
    });
    toast.success("Pessoa salva no CRM.");
  }

  function saveCompany(org: { id: string; name: string; website_url?: string; industry?: string; city?: string }) {
    CompanyStore.save({
      name:        org.name,
      segment:     org.industry ?? "",
      website:     org.website_url ?? "",
      city:        org.city ?? "",
      state:       "",
      temperature: "cold",
      status:      "prospect",
      tags:        ["apollo-enriched"],
      cnpj:        "",
      employees:   undefined,
      annualRevenue: "",
    });
    toast.success(`${org.name} salva no CRM.`);
  }

  if (!isReady) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Database className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">Enriquecimento de Dados</h1>
          </div>
          <div className="bg-card border border-border rounded-xl p-10 text-center">
            <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
            <h3 className="font-medium text-foreground mb-2">Apollo.io não configurado</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Configure sua API key do Apollo.io para usar o enriquecimento de dados.
            </p>
            <button
              onClick={() => navigate("/settings")}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm font-medium hover:opacity-90 mx-auto"
            >
              <Settings className="h-4 w-4" />
              Ir para Configurações
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="crm-section-enter flex items-center gap-3 mb-2">
          <Database className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">Enriquecimento de Dados</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-6">
          Selecione contatos e empresas para enriquecer via Apollo.io. Encontre e-mail, telefone mobile e dados corporativos.
        </p>

        {/* Tabs */}
        <div className="flex border-b border-border mb-6">
          {(["person", "company"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "person" ? "Pessoa / Contato" : "Empresa / Organização"}
            </button>
          ))}
        </div>

        {/* ─── Person enrichment ───────────────── */}
        {tab === "person" && (
          <div className="grid grid-cols-2 gap-6">
            {/* Form */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-medium text-foreground mb-4">Dados para busca</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">E-mail</label>
                  <input
                    type="email"
                    value={pEmail}
                    onChange={(e) => setPEmail(e.target.value)}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Nome</label>
                  <input
                    type="text"
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Domínio da empresa</label>
                  <input
                    type="text"
                    value={pDomain}
                    onChange={(e) => setPDomain(e.target.value)}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="empresa.com.br"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Nome da empresa</label>
                  <input
                    type="text"
                    value={pOrg}
                    onChange={(e) => setPOrg(e.target.value)}
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Nome da organização"
                  />
                </div>
                <button
                  onClick={enrichPerson}
                  disabled={pLoading}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-md py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60"
                >
                  {pLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  {pLoading ? "Buscando..." : "Enriquecer via Apollo.io"}
                </button>
              </div>
            </div>

            {/* Result */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-medium text-foreground mb-4">Resultado</h3>
              {!pResult && !pLoading && (
                <div className="text-center py-8 text-muted-foreground/50">
                  <Database className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-xs">Preencha os dados e clique em Enriquecer</p>
                </div>
              )}
              {pLoading && (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Consultando Apollo.io...
                </div>
              )}
              {pResult && !pResult.error && (
                <div className="space-y-3">
                  {pResult.name && (
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {pResult.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{pResult.name}</div>
                        {pResult.title && <div className="text-xs text-muted-foreground">{pResult.title}</div>}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2 pt-2 border-t border-border">
                    {pResult.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-foreground">{pResult.email}</span>
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-auto" />
                      </div>
                    )}
                    {pResult.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-foreground font-medium">{pResult.phone}</span>
                        <button
                          onClick={() => wasellerOpenChat(pResult.phone!)}
                          className="ml-auto flex items-center gap-1 text-xs text-emerald-600 hover:underline"
                        >
                          <MessageSquare className="h-3 w-3" /> WhatsApp
                        </button>
                      </div>
                    )}
                    {pResult.linkedin_url && (
                      <a href={pResult.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                        <ExternalLink className="h-3.5 w-3.5" />
                        LinkedIn
                      </a>
                    )}
                  </div>
                  {pResult.organization && (
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{pResult.organization.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                        {pResult.organization.industry && <span>Setor: {pResult.organization.industry}</span>}
                        {pResult.organization.estimated_num_employees && (
                          <span>Funcionários: {pResult.organization.estimated_num_employees.toLocaleString()}</span>
                        )}
                        {pResult.organization.city && <span>Cidade: {pResult.organization.city}</span>}
                        {pResult.organization.annual_revenue && (
                          <span>Receita: {pResult.organization.annual_revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL", notation: "compact" })}</span>
                        )}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={savePerson}
                    className="w-full flex items-center justify-center gap-2 border border-primary text-primary rounded-md py-2 text-sm hover:bg-primary/5 mt-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Salvar no CRM
                  </button>
                </div>
              )}
              {pResult?.error && (
                <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {pResult.error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Company search ───────────────────── */}
        {tab === "company" && (
          <div>
            <div className="bg-card border border-border rounded-xl p-5 mb-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={cQuery}
                  onChange={(e) => setCQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchCompanies()}
                  className="flex-1 border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Nome da empresa para buscar no Apollo.io"
                />
                <button
                  onClick={searchCompanies}
                  disabled={cLoading}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-60"
                >
                  {cLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Buscar
                </button>
              </div>
            </div>

            {cError && (
              <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive mb-3">
                <AlertCircle className="h-4 w-4" /> {cError}
              </div>
            )}

            {cResults.length > 0 && (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Empresa</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Setor</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cidade</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {cResults.map((org) => (
                      <tr key={org.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{org.name}</div>
                          {org.website_url && (
                            <a href={org.website_url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />{org.website_url}
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{org.industry ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{org.city ?? "—"}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => saveCompany(org)}
                            className="flex items-center gap-1.5 text-xs border border-input rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted"
                          >
                            <Plus className="h-3 w-3" /> Salvar no CRM
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!cLoading && cResults.length === 0 && !cError && (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Busque empresas pelo nome para enriquecer.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

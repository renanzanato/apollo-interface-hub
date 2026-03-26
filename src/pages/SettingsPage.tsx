import { useState, useEffect } from "react";
import { Settings, Key, Save, CheckCircle2, Eye, EyeOff, ExternalLink, AlertTriangle, Zap } from "lucide-react";
import { IntegrationSettings } from "@/lib/integrations";
import { CityStore } from "@/lib/storage";
import type { City } from "@/types";
import { toast } from "sonner";

export default function SettingsPage() {
  const [apolloKey, setApolloKey]     = useState("");
  const [apolloKey2, setApolloKey2]   = useState("");
  const [apolloKey3, setApolloKey3]   = useState("");
  const [openaiKey, setOpenaiKey]         = useState("");
  const [openaiModel, setOpenaiModel]     = useState("gpt-4o");
  const [ngrokUrl, setNgrokUrl]           = useState("");
  const [perplexityKey, setPerplexityKey] = useState("");
  const [showPerplexity, setShowPerplexity] = useState(false);
  const [showApollo, setShowApollo]   = useState(false);
  const [showOpenai, setShowOpenai]   = useState(false);
  const [cities, setCities]           = useState<City[]>([]);
  const [newCity, setNewCity]         = useState({ name: "", state: "", active: true });

  useEffect(() => {
    setApolloKey(IntegrationSettings.apolloKey);
    setApolloKey2(IntegrationSettings.apolloKey2);
    setApolloKey3(IntegrationSettings.apolloKey3);
    setOpenaiKey(IntegrationSettings.openaiKey);
    setOpenaiModel(IntegrationSettings.openaiModel);
    setNgrokUrl(IntegrationSettings.ngrokUrl);
    setPerplexityKey(IntegrationSettings.perplexityKey);
    setCities(CityStore.getAll());
  }, []);

  function saveIntegrations() {
    IntegrationSettings.save({ apolloKey, apolloKey2, apolloKey3, openaiKey, openaiModel, ngrokUrl, perplexityKey });
    toast.success("Configurações salvas.");
  }

  async function testApollo() {
    if (!apolloKey) { toast.error("Informe a API key do Apollo.io primeiro."); return; }
    toast.info("Testando Apollo.io...");
    try {
      const res = await fetch("https://api.apollo.io/v1/auth/health", {
        headers: { "X-Api-Key": apolloKey },
      });
      if (res.ok) toast.success("Apollo.io conectado!");
      else toast.error(`Apollo.io retornou ${res.status}`);
    } catch {
      toast.error("Não foi possível conectar ao Apollo.io.");
    }
  }

  async function testOpenAI() {
    if (!openaiKey) { toast.error("Informe a API key da OpenAI primeiro."); return; }
    toast.info("Testando OpenAI...");
    try {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${openaiKey}` },
      });
      if (res.ok) toast.success("OpenAI conectada!");
      else toast.error(`OpenAI retornou ${res.status}`);
    } catch {
      toast.error("Não foi possível conectar à OpenAI.");
    }
  }

  // ─── Cidades ─────────────────────────────────────────────
  function addCity() {
    if (!newCity.name.trim() || !newCity.state.trim()) {
      toast.error("Nome e UF são obrigatórios."); return;
    }
    CityStore.save(newCity);
    setCities(CityStore.getAll());
    setNewCity({ name: "", state: "", active: true });
    toast.success("Cidade adicionada.");
  }

  function toggleCity(id: string, active: boolean) {
    CityStore.update(id, { active: !active });
    setCities(CityStore.getAll());
  }

  function removeCity(id: string) {
    CityStore.remove(id);
    setCities(CityStore.getAll());
    toast.success("Cidade removida.");
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="crm-section-enter">
          <div className="flex items-center gap-3 mb-1">
            <Settings className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Gerencie integrações, API keys e configurações gerais do sistema.
          </p>
        </div>

        {/* ─── Integrações ───────────────────────────────── */}
        <section className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Key className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Integrações</h2>
          </div>

          <div className="space-y-6">
            {/* Apollo.io */}
            <div className="pb-5 border-b border-border">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    Apollo.io
                    {apolloKey && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Enriquecimento de dados — e-mail, telefone mobile, empresa.
                    {" "}<a href="https://app.apollo.io/#/settings/integrations/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                      Obter key <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </p>
                </div>
                <button onClick={testApollo} className="text-xs border border-input rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted">
                  Testar
                </button>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Conta 1</label>
                  <div className="relative">
                    <input
                      type={showApollo ? "text" : "password"}
                      value={apolloKey}
                      onChange={(e) => setApolloKey(e.target.value)}
                      placeholder="apollo_api_key_xxxxxxxxxxxxxxxx"
                      className="w-full border border-input bg-background rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button type="button" onClick={() => setShowApollo((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showApollo ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Conta 2 (fallback automático)</label>
                  <input
                    type={showApollo ? "text" : "password"}
                    value={apolloKey2}
                    onChange={(e) => setApolloKey2(e.target.value)}
                    placeholder="apollo_api_key_xxxxxxxxxxxxxxxx"
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Conta 3 (fallback automático)</label>
                  <input
                    type={showApollo ? "text" : "password"}
                    value={apolloKey3}
                    onChange={(e) => setApolloKey3(e.target.value)}
                    placeholder="apollo_api_key_xxxxxxxxxxxxxxxx"
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Ngrok URL (para mobile numbers via proxy)</label>
                  <input
                    type="text"
                    value={ngrokUrl}
                    onChange={(e) => setNgrokUrl(e.target.value)}
                    placeholder="https://xxxx.ngrok-free.app"
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    O proxy Ngrok precisa expor uma rota POST /enrich que repassa para a Apollo.io com as credenciais do servidor.
                  </p>
                </div>
              </div>
            </div>

            {/* OpenAI */}
            <div className="pb-5 border-b border-border">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    OpenAI
                    {openaiKey && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    AI Assistant — geração de mensagens, análise e quebra de objeção.
                    {" "}<a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                      Obter key <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </p>
                </div>
                <button onClick={testOpenAI} className="text-xs border border-input rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted">
                  Testar
                </button>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type={showOpenai ? "text" : "password"}
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full border border-input bg-background rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button type="button" onClick={() => setShowOpenai((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showOpenai ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Modelo</label>
                  <select
                    value={openaiModel}
                    onChange={(e) => setOpenaiModel(e.target.value)}
                    className="border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="gpt-4o">gpt-4o (recomendado)</option>
                    <option value="gpt-4o-mini">gpt-4o-mini (mais rápido / barato)</option>
                    <option value="gpt-4-turbo">gpt-4-turbo</option>
                    <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Perplexity */}
            <div className="pb-5 border-b border-border">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    Perplexity
                    {perplexityKey && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pesquisa contextual com busca web em tempo real — histórico, empresa, cargo e notícias.
                    {" "}<a href="https://www.perplexity.ai/settings/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                      Obter key <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </p>
                </div>
              </div>
              <div className="relative">
                <input
                  type={showPerplexity ? "text" : "password"}
                  value={perplexityKey}
                  onChange={(e) => setPerplexityKey(e.target.value)}
                  placeholder="pplx-xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full border border-input bg-background rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button type="button" onClick={() => setShowPerplexity((v) => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPerplexity ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* WASELLER */}
            <div>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    WASELLER (WhatsApp Web)
                    <span className="text-xs bg-amber-500/15 text-amber-600 px-2 py-0.5 rounded-full">Extensão Chrome</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Não requer API key. O CRM abre o WhatsApp Web com a mensagem pré-preenchida — o WASELLER atua dentro do browser.
                    Para funcionar: instale a extensão WASELLER no Chrome e mantenha o WhatsApp Web aberto.
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <a
                      href="https://chromewebstore.google.com/detail/waseller-perder-vendas-no/illemhbijpiebjfilfmgebahaakajkpe"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Instalar extensão <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                    <a
                      href="https://waseller.com.br"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Site oficial <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <strong>Automação completa via WASELLER:</strong> O WASELLER é uma extensão Chrome e não expõe API REST para envio automatizado.
                  O CRM gera as mensagens com IA e abre o WhatsApp Web com o texto pré-preenchido — o clique de envio ainda é manual.
                  Para envio 100% automatizado, seria necessário integrar Evolution API (ver seção Automação abaixo).
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={saveIntegrations}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm font-medium hover:opacity-90"
            >
              <Save className="h-4 w-4" />
              Salvar configurações
            </button>
          </div>
        </section>

        {/* ─── Automação ─────────────────────────────────── */}
        <section className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Fluxo de Automação de Prospecção</h2>
          </div>
          <div className="space-y-3">
            {[
              { step: "1", label: "Enriquecer", desc: "Apollo.io busca e-mail + mobile do prospect pelo nome/empresa/domínio", status: "✅ Implementado" },
              { step: "2", label: "Gerar mensagem", desc: "OpenAI gera mensagem personalizada com base nos dados do prospect (cargo, empresa, segmento)", status: "✅ Implementado" },
              { step: "3", label: "Enviar via WhatsApp", desc: "CRM abre WhatsApp Web com mensagem pré-preenchida — WASELLER adiciona CRM ao browser", status: "✅ Semi-automático" },
              { step: "4", label: "Automação total (opcional)", desc: "Evolution API rodando localmente + webhook Ngrok = envio sem clique humano", status: "⚙️ Requer servidor" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {item.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Cidades ──────────────────────────────────── */}
        <section className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-4">Cidades Ativas</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newCity.name}
              onChange={(e) => setNewCity((c) => ({ ...c, name: e.target.value }))}
              placeholder="Nome da cidade"
              className="flex-1 border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              type="text"
              value={newCity.state}
              onChange={(e) => setNewCity((c) => ({ ...c, state: e.target.value.toUpperCase().slice(0, 2) }))}
              placeholder="UF"
              maxLength={2}
              className="w-16 border border-input bg-background rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button onClick={addCity} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:opacity-90">
              + Add
            </button>
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {cities.map((city) => (
              <div key={city.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/30">
                <button
                  onClick={() => toggleCity(city.id, city.active)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${city.active ? "bg-primary" : "bg-muted"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${city.active ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
                <span className="text-sm text-foreground flex-1">{city.name}</span>
                <span className="text-xs text-muted-foreground">{city.state}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${city.active ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                  {city.active ? "Ativa" : "Inativa"}
                </span>
                <button onClick={() => removeCity(city.id)} className="text-muted-foreground hover:text-destructive text-xs">✕</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

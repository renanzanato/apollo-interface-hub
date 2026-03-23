import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Send, Loader2, Trash2, KeyRound, X, Check,
  ChevronRight, MoreHorizontal,
} from "lucide-react";
import { AgentDB } from "@/lib/db";
import type { Agent } from "@/types";
import { openaiChat, geminiChat, IntegrationSettings, GEMINI_MODELS } from "@/lib/integrations";
import { toast } from "sonner";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

const MODEL_EMOJI: Record<Agent["model"], string> = {
  gemini: "🔷",
  openai: "🟢",
};

// ─── Inline editable field ────────────────────────────────────
function Editable({
  value, onChange, placeholder, className = "", multiline = false,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; className?: string; multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  function commit() {
    setEditing(false);
    if (draft.trim() !== value) onChange(draft.trim() || value);
  }

  if (multiline) {
    return editing ? (
      <textarea
        ref={ref as React.RefObject<HTMLTextAreaElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        className={`w-full bg-transparent resize-none focus:outline-none ${className}`}
        rows={Math.max(4, draft.split("\n").length + 1)}
      />
    ) : (
      <div
        onClick={() => setEditing(true)}
        className={`cursor-text whitespace-pre-wrap ${className} ${!value ? "text-muted-foreground/50" : ""}`}
      >
        {value || placeholder}
      </div>
    );
  }

  return editing ? (
    <input
      ref={ref as React.RefObject<HTMLInputElement>}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
      className={`bg-transparent focus:outline-none w-full ${className}`}
    />
  ) : (
    <div
      onClick={() => setEditing(true)}
      className={`cursor-text ${className} ${!value ? "text-muted-foreground/50" : ""}`}
    >
      {value || placeholder}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function AgentsPage() {
  const [agents,       setAgents]       = useState<Agent[]>([]);
  const [activeId,     setActiveId]     = useState<string | null>(null);
  const [messages,     setMessages]     = useState<ChatMsg[]>([]);
  const [input,        setInput]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [showKeys,     setShowKeys]     = useState(false);
  const [showMenu,     setShowMenu]     = useState(false);
  const [geminiKey,    setGeminiKey]    = useState(IntegrationSettings.geminiKey);
  const [geminiModel,  setGeminiModel]  = useState(IntegrationSettings.geminiModel);
  const [openaiKey,    setOpenaiKey]    = useState(IntegrationSettings.openaiKey);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const active = agents.find((a) => a.id === activeId) ?? null;

  async function reload() {
    const all = await AgentDB.getAll();
    setAgents(all);
    return all;
  }

  useEffect(() => { reload(); }, []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Patch agent field inline ──────────────────────────────────
  const patch = useCallback(async (field: Partial<Agent>) => {
    if (!active) return;
    setSaving(true);
    try {
      await AgentDB.update(active.id, field);
      await reload();
    } catch { toast.error("Erro ao salvar."); }
    finally { setSaving(false); }
  }, [active]);

  // ── Create new agent ──────────────────────────────────────────
  async function createAgent() {
    try {
      const agent = await AgentDB.save({
        name: "Novo agente",
        role: "",
        systemPrompt: "",
        model: "gemini",
        active: true,
      });
      await reload();
      setActiveId(agent.id);
      setMessages([]);
    } catch { toast.error("Erro ao criar agente."); }
  }

  // ── Delete agent ──────────────────────────────────────────────
  async function deleteAgent() {
    if (!active) return;
    try {
      await AgentDB.remove(active.id);
      const remaining = agents.filter((a) => a.id !== active.id);
      setAgents(remaining);
      setActiveId(remaining[0]?.id ?? null);
      setMessages([]);
      setShowMenu(false);
    } catch { toast.error("Erro ao remover agente."); }
  }

  // ── Switch agent ──────────────────────────────────────────────
  function selectAgent(id: string) {
    setActiveId(id);
    setMessages([]);
    setInput("");
    setShowMenu(false);
  }

  // ── Send message ──────────────────────────────────────────────
  async function send() {
    if (!input.trim() || !active || loading) return;

    const isGemini = active.model === "gemini";
    if (isGemini && !IntegrationSettings.isGeminiReady()) {
      toast.error("Configure sua Gemini API Key."); setShowKeys(true); return;
    }
    if (!isGemini && !IntegrationSettings.isOpenAIReady()) {
      toast.error("Configure sua OpenAI API Key."); setShowKeys(true); return;
    }

    const userMsg: ChatMsg = { role: "user", content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    const allMsgs = [
      { role: "system" as const, content: active.systemPrompt || "Você é um assistente útil." },
      ...updated.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    const { content, error } = isGemini
      ? await geminiChat(allMsgs,  { temperature: 0.7, maxTokens: 1500 })
      : await openaiChat(allMsgs,  { temperature: 0.7, maxTokens: 1500 });

    setLoading(false);
    if (error) { toast.error(error); return; }
    setMessages((p) => [...p, { role: "assistant", content }]);
  }

  function saveKeys() {
    IntegrationSettings.save({ geminiKey, geminiModel, openaiKey });
    setShowKeys(false);
    toast.success("Chaves salvas.");
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-hidden flex bg-white dark:bg-[#191919]">

      {/* ── Sidebar (Notion-style) ────────────────────────────── */}
      <div className="w-60 flex flex-col shrink-0 bg-[#f7f7f5] dark:bg-[#202020] border-r border-[#e9e9e7] dark:border-[#2f2f2f]">

        {/* Sidebar header */}
        <div className="px-3 pt-4 pb-1">
          <div className="flex items-center justify-between px-1 mb-0.5">
            <span className="text-[11px] font-medium text-[#91918e] dark:text-[#686662] tracking-wide select-none">
              Agentes
            </span>
            <button
              onClick={createAgent}
              title="Novo agente"
              className="w-5 h-5 flex items-center justify-center rounded text-[#91918e] dark:text-[#686662] hover:text-[#37352f] dark:hover:text-[#e8e8e5] hover:bg-[#ebebea] dark:hover:bg-[#2f2f2f] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Agent list */}
        <div className="flex-1 overflow-y-auto py-1 px-1.5 space-y-px">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => selectAgent(agent.id)}
              className={`w-full text-left flex items-center gap-1.5 px-2 py-[5px] rounded-sm text-sm transition-colors group ${
                activeId === agent.id
                  ? "bg-[#e9e9e7] dark:bg-[#2f2f2f] text-[#37352f] dark:text-[#e8e8e5]"
                  : "text-[#5f5e5b] dark:text-[#8b8985] hover:bg-[#ebebea] dark:hover:bg-[#2a2a2a] hover:text-[#37352f] dark:hover:text-[#e8e8e5]"
              }`}
            >
              <span className="text-sm shrink-0 leading-none">{MODEL_EMOJI[agent.model] ?? "🤖"}</span>
              <span className="truncate flex-1 font-normal">{agent.name}</span>
            </button>
          ))}

          {agents.length === 0 && (
            <button
              onClick={createAgent}
              className="w-full text-left flex items-center gap-1.5 px-2 py-[5px] rounded-sm text-sm text-[#91918e] dark:text-[#686662] hover:bg-[#ebebea] dark:hover:bg-[#2a2a2a] hover:text-[#5f5e5b] dark:hover:text-[#8b8985] transition-colors"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span>Criar agente</span>
            </button>
          )}
        </div>

        {/* Keys button */}
        <div className="p-2 border-t border-[#e9e9e7] dark:border-[#2f2f2f]">
          <button
            onClick={() => setShowKeys(!showKeys)}
            className="w-full flex items-center gap-2 px-2 py-[5px] rounded-sm text-xs text-[#91918e] dark:text-[#686662] hover:bg-[#ebebea] dark:hover:bg-[#2a2a2a] hover:text-[#5f5e5b] dark:hover:text-[#8b8985] transition-colors"
          >
            <KeyRound className="h-3.5 w-3.5 shrink-0" />
            Configurar chaves de API
          </button>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#191919]">

        {/* Keys panel */}
        {showKeys && (
          <div className="border-b border-[#e9e9e7] dark:border-[#2f2f2f] bg-[#fbfbfa] dark:bg-[#202020] px-10 py-4 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#37352f] dark:text-[#e8e8e5]">API Keys</span>
              <button onClick={() => setShowKeys(false)} className="text-[#91918e] hover:text-[#37352f] dark:hover:text-[#e8e8e5] transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-[#91918e] dark:text-[#686662]">🔷 Gemini API Key</label>
                <input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full border border-[#e9e9e7] dark:border-[#2f2f2f] bg-white dark:bg-[#252525] rounded-md px-3 py-1.5 text-sm text-[#37352f] dark:text-[#e8e8e5] focus:outline-none focus:ring-1 focus:ring-[#a8a29e]/40" placeholder="AIza..." />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#91918e] dark:text-[#686662]">Modelo Gemini</label>
                <select value={geminiModel} onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full border border-[#e9e9e7] dark:border-[#2f2f2f] bg-white dark:bg-[#252525] rounded-md px-3 py-1.5 text-sm text-[#37352f] dark:text-[#e8e8e5] focus:outline-none">
                  {GEMINI_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#91918e] dark:text-[#686662]">🟢 OpenAI API Key</label>
                <input type="password" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)}
                  className="w-full border border-[#e9e9e7] dark:border-[#2f2f2f] bg-white dark:bg-[#252525] rounded-md px-3 py-1.5 text-sm text-[#37352f] dark:text-[#e8e8e5] focus:outline-none focus:ring-1 focus:ring-[#a8a29e]/40" placeholder="sk-..." />
              </div>
            </div>
            <button onClick={saveKeys} className="flex items-center gap-1.5 text-sm bg-[#37352f] dark:bg-[#e8e8e5] text-white dark:text-[#191919] px-3 py-1.5 rounded-md hover:opacity-80 transition-opacity">
              <Check className="h-3.5 w-3.5" /> Salvar
            </button>
          </div>
        )}

        {active ? (
          <>
            {/* ── Document header ──────────────────────────────── */}
            <div className="max-w-3xl w-full mx-auto px-16 pt-16 pb-0 shrink-0">

              {/* Top actions row */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => patch({ model: active.model === "gemini" ? "openai" : "gemini" })}
                    className="text-3xl hover:opacity-60 transition-opacity leading-none"
                    title="Clique para trocar modelo"
                  >
                    {MODEL_EMOJI[active.model]}
                  </button>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium tracking-wide ${
                    active.model === "gemini"
                      ? "bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400"
                      : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                  }`}>
                    {active.model === "gemini" ? "Gemini" : "OpenAI"}
                  </span>
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#91918e]" />}
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1.5 rounded-md text-[#91918e] hover:text-[#37352f] dark:hover:text-[#e8e8e5] hover:bg-[#f1f1ef] dark:hover:bg-[#2f2f2f] transition-colors"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-9 z-10 bg-white dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#3f3f3f] rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] py-1 w-44">
                      <button
                        onClick={() => { setMessages([]); setShowMenu(false); }}
                        className="w-full text-left flex items-center gap-2.5 px-3 py-1.5 text-sm text-[#5f5e5b] dark:text-[#8b8985] hover:bg-[#f1f1ef] dark:hover:bg-[#2f2f2f] transition-colors"
                      >
                        <X className="h-3.5 w-3.5 shrink-0" /> Limpar conversa
                      </button>
                      <div className="my-1 h-px bg-[#e9e9e7] dark:bg-[#2f2f2f]" />
                      <button
                        onClick={deleteAgent}
                        className="w-full text-left flex items-center gap-2.5 px-3 py-1.5 text-sm text-red-500 hover:bg-[#fff1f0] dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5 shrink-0" /> Excluir agente
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Page title */}
              <Editable
                value={active.name}
                onChange={(v) => patch({ name: v })}
                placeholder="Sem título"
                className="text-[40px] font-bold text-[#37352f] dark:text-[#e8e8e5] tracking-[-0.01em] leading-tight w-full block"
              />

              {/* Role / subtitle */}
              <Editable
                value={active.role}
                onChange={(v) => patch({ role: v })}
                placeholder="Adicionar especialidade..."
                className="text-base text-[#91918e] dark:text-[#686662] mt-2 w-full block"
              />
            </div>

            {/* ── System prompt block ─────────────────────────── */}
            <div className="max-w-3xl w-full mx-auto px-16 pt-8 pb-6 shrink-0 border-b border-[#e9e9e7] dark:border-[#2f2f2f]">
              <div className="rounded-lg bg-[#f7f6f3] dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#2f2f2f] px-5 py-4">
                <div className="text-[10px] font-semibold text-[#91918e] dark:text-[#686662] uppercase tracking-widest mb-3 select-none">
                  📋 Conhecimento do agente
                </div>
                <Editable
                  value={active.systemPrompt}
                  onChange={(v) => patch({ systemPrompt: v })}
                  placeholder="Descreva tudo que o agente deve saber: produto, objeções, diferenciais, scripts, cases..."
                  className="text-[13.5px] text-[#37352f] dark:text-[#cfcfca] leading-relaxed w-full font-mono"
                  multiline
                />
              </div>
            </div>

            {/* ── Chat messages ───────────────────────────────── */}
            <div className="flex-1 overflow-y-auto py-6 space-y-5">
              {messages.length === 0 && (
                <div className="text-sm text-[#91918e] dark:text-[#686662] text-center py-10 select-none">
                  Comece a conversa abaixo
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`max-w-3xl mx-auto px-16 flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px] font-semibold mt-0.5 ${
                    msg.role === "assistant"
                      ? "bg-[#f1f1ef] dark:bg-[#2f2f2f] text-[#37352f] dark:text-[#cfcfca]"
                      : "bg-[#37352f] dark:bg-[#e8e8e5] text-white dark:text-[#191919]"
                  }`}>
                    {msg.role === "assistant" ? MODEL_EMOJI[active.model] : "V"}
                  </div>
                  <div className={`flex-1 text-[14px] leading-relaxed ${msg.role === "user" ? "text-right" : ""}`}>
                    <div className={`inline-block text-left ${
                      msg.role === "user"
                        ? "bg-[#f1f1ef] dark:bg-[#2f2f2f] text-[#37352f] dark:text-[#e8e8e5] rounded-2xl rounded-tr-md px-4 py-2.5 max-w-[80%]"
                        : "text-[#37352f] dark:text-[#cfcfca] max-w-full"
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="max-w-3xl mx-auto px-16 flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#f1f1ef] dark:bg-[#2f2f2f] flex items-center justify-center text-[11px] shrink-0">
                    {MODEL_EMOJI[active.model]}
                  </div>
                  <div className="flex items-center gap-2 text-[#91918e] text-sm pt-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Pensando...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Input ───────────────────────────────────────── */}
            <div className="max-w-3xl w-full mx-auto px-16 py-5 shrink-0">
              <div className="flex items-end gap-3 bg-white dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#3f3f3f] rounded-xl px-4 py-3 shadow-sm focus-within:border-[#91918e] dark:focus-within:border-[#686662] transition-colors">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder={`Pergunte ao ${active.name}...`}
                  rows={1}
                  className="flex-1 bg-transparent text-[14px] text-[#37352f] dark:text-[#e8e8e5] placeholder:text-[#91918e] dark:placeholder:text-[#686662] focus:outline-none resize-none"
                  style={{ maxHeight: "160px" }}
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || loading}
                  className="p-1.5 rounded-lg bg-[#37352f] dark:bg-[#e8e8e5] text-white dark:text-[#191919] hover:opacity-75 disabled:opacity-20 transition-opacity shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-[#91918e]/50 mt-1.5 text-center select-none">
                Enter para enviar · Shift+Enter para nova linha
              </p>
            </div>
          </>
        ) : (
          /* ── Empty state ──────────────────────────────────── */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-[#91918e] dark:text-[#686662] text-sm select-none">Selecione um agente na barra lateral</p>
              <button
                onClick={createAgent}
                className="flex items-center gap-2 text-sm text-[#91918e] dark:text-[#686662] hover:text-[#37352f] dark:hover:text-[#e8e8e5] border border-dashed border-[#d9d9d6] dark:border-[#3f3f3f] rounded-lg px-4 py-2 hover:border-[#91918e] dark:hover:border-[#686662] transition-colors mx-auto"
              >
                <Plus className="h-4 w-4" /> Novo agente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {showMenu && <div className="fixed inset-0 z-0" onClick={() => setShowMenu(false)} />}
    </div>
  );
}

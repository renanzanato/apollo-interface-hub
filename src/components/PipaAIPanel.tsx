import { useState, useEffect, useRef } from "react";
import { Send, Loader2, X, ChevronDown, Sparkles } from "lucide-react";
import { AgentDB } from "@/lib/db";
import type { Agent } from "@/types";
import { openaiChat, geminiChat, IntegrationSettings } from "@/lib/integrations";
import { toast } from "sonner";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

// ── Pipa kite logo SVG ────────────────────────────────────────
function PipaLogo({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      {/* Kite shape */}
      <path
        d="M12 2 L20 10 L12 22 L4 10 Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Cross lines */}
      <line x1="4" y1="10" x2="20" y2="10" stroke="white" strokeWidth="1.2" strokeOpacity="0.5" />
      <line x1="12" y1="2" x2="12" y2="22" stroke="white" strokeWidth="1.2" strokeOpacity="0.5" />
      {/* Tail */}
      <path
        d="M12 22 Q14 25 12 27 Q10 25 12 22"
        fill="currentColor"
        opacity="0.5"
      />
    </svg>
  );
}

// ── Panel ─────────────────────────────────────────────────────
interface Props {
  open: boolean;
  onClose: () => void;
}

export function PipaAIPanel({ open, onClose }: Props) {
  const [agents,   setAgents]   = useState<Agent[]>([]);
  const [agentId,  setAgentId]  = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const active = agents.find((a) => a.id === agentId) ?? null;

  useEffect(() => {
    AgentDB.getAll().then((all) => {
      setAgents(all);
      if (all.length > 0 && !agentId) setAgentId(all[0].id);
    });
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  async function send() {
    if (!input.trim() || !active || loading) return;

    const isGemini = active.model === "gemini";
    if (isGemini && !IntegrationSettings.isGeminiReady()) {
      toast.error("Configure sua Gemini API Key nos Agentes."); return;
    }
    if (!isGemini && !IntegrationSettings.isOpenAIReady()) {
      toast.error("Configure sua OpenAI API Key nos Agentes."); return;
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

  if (!open) return null;

  return (
    <>
      {/* Backdrop (subtle) */}
      <div
        className="fixed inset-0 z-40 bg-black/10 dark:bg-black/30"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed right-4 bottom-4 z-50 flex flex-col w-[380px] h-[560px] bg-white dark:bg-[#1f1f1f] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)] border border-[#e9e9e7] dark:border-[#2f2f2f] overflow-hidden"
        style={{ animation: "pipaSlideUp 0.2s cubic-bezier(0.16,1,0.3,1)" }}
      >

        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#e9e9e7] dark:border-[#2f2f2f] shrink-0 bg-gradient-to-r from-[#f7f6f3] to-white dark:from-[#252525] dark:to-[#1f1f1f]">
          <div className="w-7 h-7 rounded-lg bg-[#37352f] dark:bg-[#e8e8e5] flex items-center justify-center shrink-0">
            <PipaLogo size={16} className="text-white dark:text-[#191919]" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-[#37352f] dark:text-[#e8e8e5] leading-none mb-0.5">
              Pipa AI
            </div>

            {/* Agent selector */}
            {agents.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setDropdown(!dropdown)}
                  className="flex items-center gap-0.5 text-[11px] text-[#91918e] dark:text-[#686662] hover:text-[#37352f] dark:hover:text-[#e8e8e5] transition-colors"
                >
                  {active?.name ?? "Selecionar agente"}
                  <ChevronDown className="h-3 w-3" />
                </button>
                {dropdown && (
                  <div className="absolute left-0 top-5 z-10 bg-white dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#3f3f3f] rounded-lg shadow-lg py-1 w-48">
                    {agents.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => { setAgentId(a.id); setDropdown(false); setMessages([]); }}
                        className={`w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                          a.id === agentId
                            ? "text-[#37352f] dark:text-[#e8e8e5] bg-[#f1f1ef] dark:bg-[#2f2f2f]"
                            : "text-[#5f5e5b] dark:text-[#8b8985] hover:bg-[#f7f6f3] dark:hover:bg-[#2a2a2a]"
                        }`}
                      >
                        <span className="text-sm">{a.model === "gemini" ? "🔷" : "🟢"}</span>
                        <span className="truncate">{a.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-md text-[#91918e] hover:text-[#37352f] dark:hover:text-[#e8e8e5] hover:bg-[#f1f1ef] dark:hover:bg-[#2f2f2f] transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center pb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#f1f1ef] dark:bg-[#2f2f2f] flex items-center justify-center">
                <PipaLogo size={24} className="text-[#37352f] dark:text-[#e8e8e5]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#37352f] dark:text-[#e8e8e5]">
                  {active ? `${active.name}` : "Pipa AI"}
                </p>
                <p className="text-xs text-[#91918e] dark:text-[#686662] mt-0.5">
                  {active?.role || "Como posso te ajudar hoje?"}
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-md bg-[#37352f] dark:bg-[#e8e8e5] flex items-center justify-center shrink-0 mt-0.5">
                  <PipaLogo size={13} className="text-white dark:text-[#191919]" />
                </div>
              )}
              <div className={`text-[13.5px] leading-relaxed max-w-[85%] ${
                msg.role === "user"
                  ? "bg-[#f1f1ef] dark:bg-[#2f2f2f] text-[#37352f] dark:text-[#e8e8e5] rounded-2xl rounded-tr-md px-3.5 py-2.5"
                  : "text-[#37352f] dark:text-[#cfcfca]"
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5">
              <div className="w-6 h-6 rounded-md bg-[#37352f] dark:bg-[#e8e8e5] flex items-center justify-center shrink-0 mt-0.5">
                <PipaLogo size={13} className="text-white dark:text-[#191919]" />
              </div>
              <div className="flex items-center gap-1.5 text-[#91918e] text-[13px] pt-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Pensando...
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="px-3 pb-3 shrink-0">
          <div className="flex items-end gap-2 bg-[#f7f6f3] dark:bg-[#252525] border border-[#e9e9e7] dark:border-[#3f3f3f] rounded-xl px-3 py-2.5 focus-within:border-[#91918e] dark:focus-within:border-[#686662] transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={active ? `Pergunte ao ${active.name}...` : "Selecione um agente acima..."}
              disabled={!active}
              rows={1}
              className="flex-1 bg-transparent text-[13.5px] text-[#37352f] dark:text-[#e8e8e5] placeholder:text-[#91918e] dark:placeholder:text-[#686662] focus:outline-none resize-none disabled:opacity-50"
              style={{ maxHeight: "100px" }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading || !active}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#37352f] dark:bg-[#e8e8e5] text-white dark:text-[#191919] hover:opacity-75 disabled:opacity-20 transition-opacity shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[10px] text-[#91918e]/50 mt-1 text-center select-none">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </div>

        {dropdown && (
          <div className="fixed inset-0 z-0" onClick={() => setDropdown(false)} />
        )}
      </div>

      <style>{`
        @keyframes pipaSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}

// ── Trigger button (rendered in sidebar footer) ───────────────
export function PipaAIButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2 w-full px-2 py-[6px] rounded-md text-[#5f5e5b] dark:text-[#8b8985] hover:bg-[#ebebea] dark:hover:bg-[#2a2a2a] hover:text-[#37352f] dark:hover:text-[#e8e8e5] transition-colors"
        title="Pipa AI"
      >
        <div className="w-5 h-5 rounded-md bg-[#37352f] dark:bg-[#e8e8e5] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <PipaLogo size={12} className="text-white dark:text-[#191919]" />
        </div>
        <span className="text-sm font-medium">Pipa AI</span>
        <Sparkles className="h-3 w-3 ml-auto opacity-50" />
      </button>

      <PipaAIPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}

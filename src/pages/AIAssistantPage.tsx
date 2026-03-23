import { useState, useEffect, useRef } from "react";
import {
  Bot, Send, Loader2, AlertCircle, Settings, Sparkles, Trash2,
  MessageSquare, User, Copy, Check,
} from "lucide-react";
import { openaiChat, IntegrationSettings, wasellerOpenChat } from "@/lib/integrations";
import { PersonStore, CompanyStore } from "@/lib/storage";
import type { ChatMessage } from "@/lib/integrations";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const PROMPTS = [
  {
    label: "Mensagem de prospecção",
    icon: MessageSquare,
    systemPrompt: "Você é um especialista em vendas B2B consultivas. Crie mensagens de prospecção curtas, personalizadas e com alto índice de resposta para WhatsApp. Use linguagem natural, sem parecer spam. Máximo 3 parágrafos.",
    placeholder: "Ex: Prospect: João Silva, Diretor de TI na TechNova (empresa de software, 200 funcionários, SP). Escreva uma mensagem de abertura.",
  },
  {
    label: "Quebra de objeção",
    icon: Sparkles,
    systemPrompt: "Você é um especialista em vendas consultivas B2B. Sua tarefa é criar respostas inteligentes para objeções de vendas, mantendo o controle da conversa sem ser agressivo. Use empatia e argumentos de valor.",
    placeholder: "Ex: O prospect disse 'Não temos budget agora'. Como responder?",
  },
  {
    label: "Análise de empresa",
    icon: Bot,
    systemPrompt: "Você é um analista de inteligência comercial. Com base nas informações fornecidas, gere uma análise rápida da empresa prospect: pontos de entrada, possíveis dores, ângulos de abordagem e argumentos de valor personalizados.",
    placeholder: "Ex: Empresa: TechNova, segmento SaaS, 200 funcionários, crescendo 30% ao ano. Analise o potencial.",
  },
  {
    label: "Roteiro de reunião",
    icon: Sparkles,
    systemPrompt: "Você é um coach de vendas B2B. Crie um roteiro estruturado de reunião de descoberta (30 min) com perguntas abertas que levem o prospect a identificar suas próprias dores e o valor da solução.",
    placeholder: "Ex: Reunião com Diretor Comercial de empresa de logística com 500 funcionários.",
  },
];

interface UIMessage {
  role: "user" | "assistant";
  content: string;
  copying?: boolean;
}

export default function AIAssistantPage() {
  const navigate = useNavigate();
  const [isReady, setIsReady] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(0);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState({ personId: "", companyId: "" });
  const [people] = useState(() => PersonStore.getAll());
  const [companies] = useState(() => CompanyStore.getAll());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsReady(IntegrationSettings.isOpenAIReady());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;

    const selected = PROMPTS[selectedPrompt];
    let userContent = input.trim();

    // Injetar contexto de pessoa/empresa se selecionados
    const person  = people.find((p) => p.id === context.personId);
    const company = companies.find((c) => c.id === context.companyId);
    if (person || company) {
      const ctx: string[] = ["Contexto do CRM:"];
      if (person)  ctx.push(`Pessoa: ${person.name}, ${person.role || ""}, ${person.email || ""}, ${person.phone || ""}`);
      if (company) ctx.push(`Empresa: ${company.name}, Setor: ${company.segment || "N/A"}, Cidade: ${company.city || "N/A"}`);
      userContent = `${ctx.join("\n")}\n\n${userContent}`;
    }

    const newUserMsg: UIMessage = { role: "user", content: input.trim() };
    setMessages((m) => [...m, newUserMsg]);
    setInput("");
    setLoading(true);

    const history: ChatMessage[] = [
      { role: "system", content: selected.systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userContent },
    ];

    const result = await openaiChat(history, { temperature: 0.7 });
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setMessages((m) => [...m, { role: "assistant", content: result.content }]);
  }

  async function copyMessage(content: string, idx: number) {
    await navigator.clipboard.writeText(content);
    setMessages((m) => m.map((msg, i) => i === idx ? { ...msg, copying: true } : msg));
    setTimeout(() => setMessages((m) => m.map((msg, i) => i === idx ? { ...msg, copying: false } : msg)), 1500);
    toast.success("Copiado!");
  }

  function sendViaWhatsApp(content: string) {
    const person = people.find((p) => p.id === context.personId);
    if (!person?.phone) { toast.error("Selecione uma pessoa com telefone para enviar via WhatsApp."); return; }
    wasellerOpenChat(person.phone, content);
  }

  if (!isReady) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Bot className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">AI Assistentes</h1>
          </div>
          <div className="bg-card border border-border rounded-xl p-10 text-center">
            <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
            <h3 className="font-medium text-foreground mb-2">OpenAI não configurada</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Configure sua API key da OpenAI para usar os assistentes de IA.
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
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <Bot className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">AI Assistentes</h1>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">GPT-4o</span>
        </div>

        {/* Modo de assistente */}
        <div className="flex gap-2 flex-wrap mb-3">
          {PROMPTS.map((p, i) => {
            const Icon = p.icon;
            return (
              <button
                key={i}
                onClick={() => { setSelectedPrompt(i); setMessages([]); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedPrompt === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                <Icon className="h-3 w-3" />
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Contexto CRM */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={context.personId}
            onChange={(e) => setContext((c) => ({ ...c, personId: e.target.value }))}
            className="border border-input bg-background rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none"
          >
            <option value="">+ Pessoa (contexto)</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}{p.role ? ` — ${p.role}` : ""}</option>)}
          </select>
          <select
            value={context.companyId}
            onChange={(e) => setContext((c) => ({ ...c, companyId: e.target.value }))}
            className="border border-input bg-background rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none"
          >
            <option value="">+ Empresa (contexto)</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}{c.segment ? ` — ${c.segment}` : ""}</option>)}
          </select>
          {(context.personId || context.companyId) && (
            <button onClick={() => setContext({ personId: "", companyId: "" })} className="text-xs text-muted-foreground hover:text-foreground border border-input rounded-md px-2 py-1.5">
              Limpar contexto
            </button>
          )}
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">Assistente pronto: <strong>{PROMPTS[selectedPrompt].label}</strong></p>
            <p className="text-xs text-muted-foreground/60">{PROMPTS[selectedPrompt].placeholder}</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-1">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
            )}
            <div className={`max-w-2xl rounded-xl px-4 py-3 ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card border border-border text-foreground rounded-bl-none"}`}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              {msg.role === "assistant" && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                  <button
                    onClick={() => copyMessage(msg.content, idx)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {msg.copying ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    {msg.copying ? "Copiado" : "Copiar"}
                  </button>
                  {context.personId && people.find((p) => p.id === context.personId)?.phone && (
                    <button
                      onClick={() => sendViaWhatsApp(msg.content)}
                      className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
                    >
                      <MessageSquare className="h-3 w-3" />
                      Enviar via WhatsApp
                    </button>
                  )}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-1">
              <Bot className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="bg-card border border-border rounded-xl rounded-bl-none px-4 py-3 flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando resposta...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-t border-border bg-card">
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
          >
            <Trash2 className="h-3 w-3" /> Nova conversa
          </button>
        )}
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder={PROMPTS[selectedPrompt].placeholder}
            rows={2}
            className="flex-1 border border-input bg-background rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="px-4 bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground/50 mt-1.5">Enter para enviar · Shift+Enter para nova linha</p>
      </div>
    </div>
  );
}

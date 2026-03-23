// ────────────────────────────────────────────────────────────
//  Configuração e clientes das integrações externas
//  Apollo.io · OpenAI · WASELLER (WhatsApp Web)
// ────────────────────────────────────────────────────────────

const KEYS = {
  apolloKey:    "int_apollo_key",
  openaiKey:    "int_openai_key",
  openaiModel:  "int_openai_model",
  ngrokUrl:     "int_ngrok_url",
  geminiKey:    "int_gemini_key",
  geminiModel:  "int_gemini_model",
} as const;

// ─── Settings storage ────────────────────────────────────────
export const IntegrationSettings = {
  get apolloKey():   string { return localStorage.getItem(KEYS.apolloKey)   ?? ""; },
  get openaiKey():   string { return localStorage.getItem(KEYS.openaiKey)   ?? ""; },
  get openaiModel(): string { return localStorage.getItem(KEYS.openaiModel) ?? "gpt-4o"; },
  get ngrokUrl():    string { return localStorage.getItem(KEYS.ngrokUrl)    ?? ""; },
  get geminiKey():   string { return localStorage.getItem(KEYS.geminiKey)   ?? ""; },
  get geminiModel(): string { return localStorage.getItem(KEYS.geminiModel) ?? "gemini-2.0-flash"; },

  save(patch: Partial<{
    apolloKey: string; openaiKey: string; openaiModel: string;
    ngrokUrl: string; geminiKey: string; geminiModel: string;
  }>) {
    if (patch.apolloKey   !== undefined) localStorage.setItem(KEYS.apolloKey,   patch.apolloKey);
    if (patch.openaiKey   !== undefined) localStorage.setItem(KEYS.openaiKey,   patch.openaiKey);
    if (patch.openaiModel !== undefined) localStorage.setItem(KEYS.openaiModel, patch.openaiModel);
    if (patch.ngrokUrl    !== undefined) localStorage.setItem(KEYS.ngrokUrl,    patch.ngrokUrl);
    if (patch.geminiKey   !== undefined) localStorage.setItem(KEYS.geminiKey,   patch.geminiKey);
    if (patch.geminiModel !== undefined) localStorage.setItem(KEYS.geminiModel, patch.geminiModel);
  },

  isApolloReady():  boolean { return !!IntegrationSettings.apolloKey; },
  isOpenAIReady():  boolean { return !!IntegrationSettings.openaiKey; },
  isGeminiReady():  boolean { return !!IntegrationSettings.geminiKey; },
};

// ─── Apollo.io ───────────────────────────────────────────────
export interface ApolloEnrichResult {
  name?: string;
  email?: string;
  phone?: string;          // mobile number via ngrok proxy
  linkedin_url?: string;
  title?: string;
  organization?: {
    name?: string;
    website_url?: string;
    estimated_num_employees?: number;
    industry?: string;
    city?: string;
    state?: string;
    annual_revenue?: number;
  };
  error?: string;
}

/**
 * Enriquece um contato via Apollo.io People Match API.
 * Se ngrokUrl estiver configurado, usa como proxy para contornar CORS
 * e obter mobile numbers (que a API direta não retorna no browser).
 *
 * Ngrok proxy espera: POST /enrich { email?, name?, domain? }
 * e repassa para https://api.apollo.io/v1/people/match
 */
export async function apolloEnrichPerson(params: {
  email?: string;
  name?: string;
  domain?: string;
  organizationName?: string;
}): Promise<ApolloEnrichResult> {
  const { apolloKey, ngrokUrl } = IntegrationSettings;

  if (!apolloKey) return { error: "Apollo.io API key não configurada." };

  const body = {
    api_key: apolloKey,
    reveal_personal_emails: true,
    reveal_phone_number: true,
    ...params,
  };

  // Se tiver ngrok, usa o proxy (retorna mobile)
  const endpoint = ngrokUrl
    ? `${ngrokUrl.replace(/\/$/, "")}/enrich`
    : "https://api.apollo.io/v1/people/match";

  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    // Sem ngrok: credencial vai no body (Apollo aceita api_key no body)
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      return { error: `Apollo.io error ${res.status}: ${err}` };
    }

    const data = await res.json();
    const p = data.person ?? data;

    return {
      name:         p.name,
      email:        p.email,
      phone:        p.phone_numbers?.[0]?.sanitized_number ?? p.phone,
      linkedin_url: p.linkedin_url,
      title:        p.title,
      organization: p.organization
        ? {
            name:                      p.organization.name,
            website_url:               p.organization.website_url,
            estimated_num_employees:   p.organization.estimated_num_employees,
            industry:                  p.organization.industry,
            city:                      p.organization.city,
            state:                     p.organization.state,
            annual_revenue:            p.organization.annual_revenue,
          }
        : undefined,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: `Falha na requisição: ${msg}` };
  }
}

/**
 * Busca empresas/organizações via Apollo.io Organization Search.
 */
export async function apolloSearchOrganizations(query: string): Promise<{
  organizations: Array<{ id: string; name: string; website_url?: string; industry?: string; city?: string }>;
  error?: string;
}> {
  const { apolloKey } = IntegrationSettings;
  if (!apolloKey) return { organizations: [], error: "Apollo.io API key não configurada." };

  try {
    const res = await fetch("https://api.apollo.io/v1/mixed_companies/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Api-Key": apolloKey },
      body: JSON.stringify({ q_organization_name: query, page: 1, per_page: 10 }),
    });

    if (!res.ok) return { organizations: [], error: `Apollo error ${res.status}` };
    const data = await res.json();
    return { organizations: data.organizations ?? [] };
  } catch (e: unknown) {
    return { organizations: [], error: e instanceof Error ? e.message : String(e) };
  }
}

// ─── OpenAI ──────────────────────────────────────────────────
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Envia mensagens para a OpenAI ChatCompletion API.
 * Retorna a resposta do assistente ou um erro.
 */
export async function openaiChat(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<{ content: string; error?: string }> {
  const { openaiKey, openaiModel } = IntegrationSettings;
  if (!openaiKey) return { content: "", error: "OpenAI API key não configurada." };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: openaiModel,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens:  options?.maxTokens  ?? 1024,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return { content: "", error: err.error?.message ?? `OpenAI error ${res.status}` };
    }

    const data = await res.json();
    return { content: data.choices?.[0]?.message?.content ?? "" };
  } catch (e: unknown) {
    return { content: "", error: e instanceof Error ? e.message : String(e) };
  }
}

// ─── Google Gemini ───────────────────────────────────────────

export const GEMINI_MODELS = [
  { id: "gemini-2.0-flash",          label: "Gemini 2.0 Flash (rápido)" },
  { id: "gemini-2.5-pro-preview-06-05", label: "Gemini 2.5 Pro (mais capaz)" },
  { id: "gemini-2.0-flash-lite",     label: "Gemini 2.0 Flash Lite (leve)" },
] as const;

/**
 * Envia mensagens para a Google Gemini generateContent API.
 * O systemPrompt é enviado como system_instruction separado (não como mensagem).
 * Retorna a resposta do modelo ou um erro.
 */
export async function geminiChat(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<{ content: string; error?: string }> {
  const { geminiKey, geminiModel } = IntegrationSettings;
  if (!geminiKey) return { content: "", error: "Gemini API key não configurada." };

  // Separa system do histórico de conversa
  const systemMsg = messages.find((m) => m.role === "system");
  const conversation = messages.filter((m) => m.role !== "system");

  // Gemini usa "model" em vez de "assistant"
  const contents = conversation.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature:     options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxTokens   ?? 1024,
    },
  };

  if (systemMsg) {
    body.system_instruction = { parts: [{ text: systemMsg.content }] };
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return { content: "", error: err.error?.message ?? `Gemini error ${res.status}` };
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return { content: text };
  } catch (e: unknown) {
    return { content: "", error: e instanceof Error ? e.message : String(e) };
  }
}

// ─── WASELLER / WhatsApp Web ──────────────────────────────────
/**
 * Gera link WhatsApp Web compatível com WASELLER.
 * O WASELLER (extensão Chrome) intercepta o WhatsApp Web aberto
 * e adiciona funcionalidades CRM por cima.
 *
 * @param phone  Número E.164 sem + (ex: 5511999999999)
 * @param text   Mensagem pré-preenchida (opcional)
 */
export function wasellerOpenChat(phone: string, text?: string): void {
  const cleaned = phone.replace(/\D/g, "");
  const base    = "https://web.whatsapp.com/send";
  const params  = new URLSearchParams({ phone: cleaned });
  if (text) params.set("text", text);
  window.open(`${base}?${params.toString()}`, "_blank", "noopener");
}

/**
 * Retorna o link direto sem abrir (para uso em <a href>).
 */
export function wasellerLink(phone: string, text?: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const params  = new URLSearchParams({ phone: cleaned });
  if (text) params.set("text", text);
  return `https://web.whatsapp.com/send?${params.toString()}`;
}

import { useLocation } from "react-router-dom";
import { Users, Building2, ListFilter, Database, Send, MessageSquare, CheckSquare, DollarSign, Bot, Radio } from "lucide-react";

const pageInfo: Record<string, { title: string; icon: React.ElementType; description: string }> = {
  "/people": { title: "Pessoas", icon: Users, description: "Gerencie seu mailing de contatos. Busque e organize seus leads." },
  "/companies": { title: "Empresas", icon: Building2, description: "Todas as empresas do seu pipeline. Gerencie perfis, segmentos e dados corporativos." },
  "/data-enrichment": { title: "Enriquecimento de Dados", icon: Database, description: "Selecione contas e pessoas para enriquecer dados via APIs da Pluo. Encontre e atualize informações de contato." },
  "/signals": { title: "Sinais", icon: Radio, description: "Seu mercado endereçável completo. Identifique empresas com lançamentos nos próximos meses — sinais de compra para prospecção imediata." },
  "/sequences": { title: "Sequências", icon: Send, description: "Crie cadências multi-persona por conta com ABM via WhatsApp." },
  "/whatsapp": { title: "WhatsApp", icon: MessageSquare, description: "Gerencie suas conversas e campanhas via WhatsApp." },
  "/tasks": { title: "Tarefas", icon: CheckSquare, description: "Acompanhe suas tarefas diárias e follow-ups por conta e contato." },
  "/deals": { title: "Deals", icon: DollarSign, description: "Gerencie seu pipeline de negócios e oportunidades de receita." },
  "/ai-assistant": { title: "AI Assistentes", icon: Bot, description: "Assistentes de IA para análise, quebra de objeção, reunião comercial e GTM." },
};

export default function CRMPage() {
  const location = useLocation();
  const info = pageInfo[location.pathname];

  if (!info) return null;

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="crm-section-enter">
          <div className="flex items-center gap-3 mb-2">
            <info.icon className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">{info.title}</h1>
          </div>
          <p className="text-muted-foreground mb-8">{info.description}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-12 text-center crm-section-enter" style={{ animationDelay: "100ms" }}>
          <info.icon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Nenhum registro ainda</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Comece criando seu primeiro registro ou importando dados existentes.
          </p>
          <button className="bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity active:scale-[0.97]">
            Começar
          </button>
        </div>
      </div>
    </div>
  );
}

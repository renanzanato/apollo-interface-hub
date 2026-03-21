import { useState } from "react";
import {
  Plus, MoreHorizontal, Flame, Snowflake, Sun, Users, DollarSign,
  ArrowRightLeft, BarChart3, Eye, Settings2, ChevronDown, Clock, ArrowRight,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── Types ──

type Temperature = "hot" | "warm" | "cold";

interface Persona {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

interface FunnelTransition {
  fromFunnel: string;
  fromStage: string;
  toFunnel: string;
  toStage: string;
  date: string;
}

interface AccountCard {
  id: string;
  accountName: string;
  temperature: Temperature;
  revenue: string;
  personas: Persona[];
  segment?: string;
  lastActivity?: string;
  createdAt?: string;
  transitions?: FunnelTransition[];
}

interface PipelineStage {
  id: string;
  title: string;
  color: string;
  cards: AccountCard[];
}

interface Funnel {
  id: string;
  name: string;
  stages: PipelineStage[];
}

// ── Mock Data ──

const funnels: Funnel[] = [
  {
    id: "pre-sales",
    name: "Pré-vendas",
    stages: [
      {
        id: "prospecting", title: "Prospecção", color: "bg-blue-500",
        cards: [
          {
            id: "1", accountName: "TechNova Solutions", temperature: "warm", revenue: "R$ 120K",
            segment: "SaaS B2B", lastActivity: "Há 2 dias", createdAt: "12/01/2026",
            personas: [
              { id: "p1", name: "Carlos Silva", role: "CEO", avatar: "CS" },
              { id: "p2", name: "Ana Beatriz", role: "Head of Sales", avatar: "AB" },
            ],
          },
          {
            id: "2", accountName: "DataFlow Corp", temperature: "cold", revenue: "R$ 85K",
            segment: "Analytics", lastActivity: "Há 5 dias", createdAt: "08/01/2026",
            personas: [
              { id: "p3", name: "Roberto Mendes", role: "CTO", avatar: "RM" },
            ],
          },
        ],
      },
      {
        id: "qualification", title: "Qualificação", color: "bg-amber-500",
        cards: [
          {
            id: "3", accountName: "CloudBase Inc", temperature: "hot", revenue: "R$ 200K",
            segment: "Infraestrutura", lastActivity: "Hoje", createdAt: "05/01/2026",
            personas: [
              { id: "p4", name: "Mariana Costa", role: "VP Sales", avatar: "MC" },
              { id: "p5", name: "Lucas Ferreira", role: "Head Ops", avatar: "LF" },
              { id: "p6", name: "Paula Nunes", role: "CFO", avatar: "PN" },
            ],
          },
          {
            id: "4", accountName: "Vertex Digital", temperature: "warm", revenue: "R$ 95K",
            segment: "Marketing Tech", lastActivity: "Há 1 dia", createdAt: "10/01/2026",
            personas: [
              { id: "p7", name: "Diego Almeida", role: "CMO", avatar: "DA" },
              { id: "p8", name: "Fernanda Lima", role: "Growth Lead", avatar: "FL" },
            ],
          },
        ],
      },
      {
        id: "meeting", title: "Reunião Agendada", color: "bg-purple-500",
        cards: [
          {
            id: "5", accountName: "Logística Prime", temperature: "hot", revenue: "R$ 310K",
            segment: "Logística", lastActivity: "Hoje", createdAt: "03/01/2026",
            personas: [
              { id: "p9", name: "Eduardo Santos", role: "COO", avatar: "ES" },
            ],
          },
        ],
      },
      {
        id: "qualified", title: "Qualificado (Passagem)", color: "bg-emerald-500",
        cards: [
          {
            id: "6", accountName: "FinServ Capital", temperature: "hot", revenue: "R$ 450K",
            segment: "Fintech", lastActivity: "Hoje", createdAt: "28/12/2025",
            transitions: [
              { fromFunnel: "Pré-vendas", fromStage: "Qualificado", toFunnel: "Vendas", toStage: "Diagnóstico", date: "15/01/2026" },
            ],
            personas: [
              { id: "p10", name: "Juliana Rocha", role: "CEO", avatar: "JR" },
              { id: "p11", name: "André Martins", role: "CFO", avatar: "AM" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "sales",
    name: "Vendas",
    stages: [
      {
        id: "diagnosis", title: "Diagnóstico", color: "bg-blue-500",
        cards: [
          {
            id: "7", accountName: "FinServ Capital", temperature: "hot", revenue: "R$ 450K",
            segment: "Fintech", lastActivity: "Hoje", createdAt: "28/12/2025",
            transitions: [
              { fromFunnel: "Pré-vendas", fromStage: "Qualificado", toFunnel: "Vendas", toStage: "Diagnóstico", date: "15/01/2026" },
            ],
            personas: [
              { id: "p10", name: "Juliana Rocha", role: "CEO", avatar: "JR" },
              { id: "p11", name: "André Martins", role: "CFO", avatar: "AM" },
              { id: "p12", name: "Camila Souza", role: "Head Legal", avatar: "CS" },
            ],
          },
        ],
      },
      {
        id: "proposal", title: "Proposta", color: "bg-amber-500",
        cards: [
          {
            id: "8", accountName: "GreenEnergy SA", temperature: "warm", revenue: "R$ 180K",
            segment: "Energia", lastActivity: "Há 3 dias", createdAt: "20/12/2025",
            transitions: [
              { fromFunnel: "Pré-vendas", fromStage: "Qualificado", toFunnel: "Vendas", toStage: "Diagnóstico", date: "05/01/2026" },
            ],
            personas: [
              { id: "p14", name: "Patrícia Gomes", role: "Dir. Comercial", avatar: "PG" },
              { id: "p15", name: "Thiago Ribeiro", role: "Eng. Vendas", avatar: "TR" },
            ],
          },
        ],
      },
      {
        id: "negotiation", title: "Negociação", color: "bg-purple-500",
        cards: [
          {
            id: "9", accountName: "MedHealth Group", temperature: "hot", revenue: "R$ 520K",
            segment: "HealthTech", lastActivity: "Hoje", createdAt: "15/12/2025",
            transitions: [
              { fromFunnel: "Pré-vendas", fromStage: "Qualificado", toFunnel: "Vendas", toStage: "Diagnóstico", date: "02/01/2026" },
            ],
            personas: [
              { id: "p16", name: "Renata Campos", role: "CEO", avatar: "RC" },
              { id: "p17", name: "Marcos Vieira", role: "CTO", avatar: "MV" },
            ],
          },
        ],
      },
      {
        id: "closed-won", title: "Fechado / Ganho", color: "bg-emerald-500",
        cards: [
          {
            id: "10", accountName: "RetailMax Brasil", temperature: "hot", revenue: "R$ 280K",
            segment: "Retail", lastActivity: "Hoje", createdAt: "10/12/2025",
            transitions: [
              { fromFunnel: "Pré-vendas", fromStage: "Qualificado", toFunnel: "Vendas", toStage: "Diagnóstico", date: "22/12/2025" },
            ],
            personas: [
              { id: "p18", name: "Isabela Duarte", role: "Dir. Geral", avatar: "ID" },
              { id: "p19", name: "Felipe Moraes", role: "Head Compras", avatar: "FM" },
            ],
          },
        ],
      },
      {
        id: "closed-lost", title: "Fechado / Perdido", color: "bg-red-500",
        cards: [],
      },
    ],
  },
];

// ── Temperature Config ──

const tempConfig: Record<Temperature, { label: string; icon: React.ElementType; className: string }> = {
  hot: { label: "Hot", icon: Flame, className: "bg-red-500/15 text-red-600 border-red-500/20" },
  warm: { label: "Warm", icon: Sun, className: "bg-amber-500/15 text-amber-600 border-amber-500/20" },
  cold: { label: "Cold", icon: Snowflake, className: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
};

// ── Account Card Component ──

function AccountCardComponent({ card, showTransition, onClick }: { card: AccountCard; showTransition?: boolean; onClick?: () => void }) {
  const temp = tempConfig[card.temperature];
  const TempIcon = temp.icon;
  const lastTransition = card.transitions?.[card.transitions.length - 1];

  return (
    <div onClick={onClick} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground mb-0.5">{card.segment}</p>
          <h4 className="text-sm font-semibold text-foreground truncate">{card.accountName}</h4>
        </div>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded">
          <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${temp.className}`}>
          <TempIcon className="h-3 w-3" />
          {temp.label}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
          <DollarSign className="h-3 w-3" />
          {card.revenue}
        </span>
      </div>

      {showTransition && lastTransition && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2 bg-secondary/60 rounded px-2 py-1">
          <ArrowRightLeft className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {lastTransition.fromFunnel} → {lastTransition.toFunnel} · {lastTransition.date}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center -space-x-1.5">
          {card.personas.slice(0, 4).map((p) => (
            <div
              key={p.id}
              title={`${p.name} — ${p.role}`}
              className="h-6 w-6 rounded-full bg-primary/15 border-2 border-card flex items-center justify-center text-[9px] font-bold text-primary"
            >
              {p.avatar}
            </div>
          ))}
          {card.personas.length > 4 && (
            <div className="h-6 w-6 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[9px] font-medium text-muted-foreground">
              +{card.personas.length - 4}
            </div>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">{card.lastActivity}</span>
      </div>
    </div>
  );
}

// ── Funnel Metrics Bar ──

function FunnelMetrics({ funnel }: { funnel: Funnel }) {
  const allCards = funnel.stages.flatMap((s) => s.cards);
  const totalAccounts = allCards.length;
  const totalRevenue = allCards.reduce((sum, c) => {
    const num = parseFloat(c.revenue.replace(/[^\d]/g, "")) * 1000;
    return sum + num;
  }, 0);
  const hotCount = allCards.filter((c) => c.temperature === "hot").length;
  const warmCount = allCards.filter((c) => c.temperature === "warm").length;

  return (
    <div className="flex items-center gap-6 px-6 py-3 border-b border-border bg-secondary/30">
      <div className="flex items-center gap-1.5 text-xs">
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">Contas:</span>
        <span className="font-semibold text-foreground">{totalAccounts}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs">
        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">Pipeline:</span>
        <span className="font-semibold text-foreground">R$ {(totalRevenue / 1000).toFixed(0)}K</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs">
        <Flame className="h-3.5 w-3.5 text-red-500" />
        <span className="font-semibold text-foreground">{hotCount}</span>
        <Sun className="h-3.5 w-3.5 text-amber-500 ml-1" />
        <span className="font-semibold text-foreground">{warmCount}</span>
      </div>
    </div>
  );
}

// ── Kanban Board ──

function KanbanBoard({ funnel, showTransitions, onCardClick }: { funnel: Funnel; showTransitions?: boolean; onCardClick: (card: AccountCard, stage: string, funnel: string) => void }) {
  return (
    <>
      <FunnelMetrics funnel={funnel} />
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-6 h-full min-w-max">
          {funnel.stages.map((stage, stageIdx) => (
            <div
              key={stage.id}
              className="w-[290px] flex flex-col bg-secondary/40 rounded-xl crm-section-enter shrink-0"
              style={{ animationDelay: `${stageIdx * 60}ms` }}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                  <h3 className="text-sm font-semibold text-foreground">{stage.title}</h3>
                  <span className="text-xs font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                    {stage.cards.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1 hover:bg-secondary rounded transition-colors">
                    <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button className="p-1 hover:bg-secondary rounded transition-colors">
                    <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2.5">
                {stage.cards.map((card) => (
                  <AccountCardComponent key={card.id} card={card} showTransition={showTransitions} onClick={() => onCardClick(card, stage.title, funnel.name)} />
                ))}
                <button className="w-full py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-lg transition-colors flex items-center justify-center gap-1">
                  <Plus className="h-3 w-3" />
                  Adicionar conta
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Full Journey View ──

function FullJourneyView({ onCardClick }: { onCardClick: (card: AccountCard, stage: string, funnel: string) => void }) {
  return (
    <>
      <div className="flex items-center gap-6 px-6 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-1.5 text-xs">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Visão completa do funil integrado — Pré-vendas → Vendas</span>
        </div>
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 p-6 h-full min-w-max">
          {/* Pre-sales stages */}
          <div className="flex items-start gap-0">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5 text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-2 self-start whitespace-nowrap">
              Pré-vendas
            </div>
          </div>
          {funnels[0].stages.map((stage, i) => (
            <div key={`pre-${stage.id}`} className="flex items-start gap-3">
              <div className="w-[250px] flex flex-col bg-secondary/40 rounded-xl shrink-0 crm-section-enter" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                  <h3 className="text-xs font-semibold text-foreground">{stage.title}</h3>
                  <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                    {stage.cards.length}
                  </span>
                </div>
                <div className="px-2.5 pb-2.5 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {stage.cards.map((card) => (
                    <AccountCardComponent key={card.id} card={card} showTransition onClick={() => onCardClick(card, stage.title, funnels[0].name)} />
                  ))}
                </div>
              </div>
              {i === funnels[0].stages.length - 1 && (
                <div className="flex flex-col items-center justify-center self-center gap-1 px-2">
                  <ArrowRight className="h-5 w-5 text-primary" />
                  <span className="text-[9px] font-semibold text-primary uppercase">Passagem</span>
                </div>
              )}
            </div>
          ))}

          {/* Sales stages */}
          <div className="flex items-start gap-0">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5 text-[10px] font-semibold text-emerald-600 uppercase tracking-wider mb-2 self-start whitespace-nowrap">
              Vendas
            </div>
          </div>
          {funnels[1].stages.map((stage, i) => (
            <div key={`sales-${stage.id}`} className="w-[250px] flex flex-col bg-secondary/40 rounded-xl shrink-0 crm-section-enter" style={{ animationDelay: `${(funnels[0].stages.length + i) * 40}ms` }}>
              <div className="flex items-center gap-2 px-3 py-2.5">
                <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                <h3 className="text-xs font-semibold text-foreground">{stage.title}</h3>
                <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
                  {stage.cards.length}
                </span>
              </div>
              <div className="px-2.5 pb-2.5 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
                {stage.cards.map((card) => (
                  <AccountCardComponent key={card.id} card={card} showTransition />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Main Page ──

type ViewMode = "pre-sales" | "sales" | "full-journey";

export default function DealsPage() {
  const [view, setView] = useState<ViewMode>("pre-sales");

  const activeFunnel = view === "pre-sales" ? funnels[0] : funnels[1];

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border crm-section-enter">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Pipeline de Negócios</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gerencie seus funis de pré-vendas e vendas com passagem de bastão integrada
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Settings2 className="h-4 w-4 mr-1" />
              Gerenciar Funis
            </Button>
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-1" />
              Filtrar
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nova Conta
            </Button>
          </div>
        </div>

        {/* View Tabs */}
        <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
          <TabsList className="h-9">
            <TabsTrigger value="pre-sales" className="text-xs gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Pré-vendas
            </TabsTrigger>
            <TabsTrigger value="sales" className="text-xs gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              Vendas
            </TabsTrigger>
            <TabsTrigger value="full-journey" className="text-xs gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Visão Completa
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {view === "full-journey" ? (
        <FullJourneyView />
      ) : (
        <KanbanBoard funnel={activeFunnel} showTransitions={view === "sales"} />
      )}
    </div>
  );
}

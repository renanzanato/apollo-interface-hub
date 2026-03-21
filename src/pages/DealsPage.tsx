import { useState } from "react";
import { Plus, MoreHorizontal, Flame, Snowflake, Sun, Users, DollarSign, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Temperature = "hot" | "warm" | "cold";

interface Persona {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

interface AccountCard {
  id: string;
  accountName: string;
  temperature: Temperature;
  revenue: string;
  personas: Persona[];
  segment?: string;
  lastActivity?: string;
}

interface PipelineStage {
  id: string;
  title: string;
  color: string;
  cards: AccountCard[];
}

const initialStages: PipelineStage[] = [
  {
    id: "prospecting",
    title: "Prospecção",
    color: "bg-blue-500",
    cards: [
      {
        id: "1",
        accountName: "TechNova Solutions",
        temperature: "warm",
        revenue: "R$ 120K",
        segment: "SaaS B2B",
        lastActivity: "Há 2 dias",
        personas: [
          { id: "p1", name: "Carlos Silva", role: "CEO", avatar: "CS" },
          { id: "p2", name: "Ana Beatriz", role: "Head of Sales", avatar: "AB" },
        ],
      },
      {
        id: "2",
        accountName: "DataFlow Corp",
        temperature: "cold",
        revenue: "R$ 85K",
        segment: "Analytics",
        lastActivity: "Há 5 dias",
        personas: [
          { id: "p3", name: "Roberto Mendes", role: "CTO", avatar: "RM" },
        ],
      },
      {
        id: "3",
        accountName: "CloudBase Inc",
        temperature: "hot",
        revenue: "R$ 200K",
        segment: "Infraestrutura",
        lastActivity: "Hoje",
        personas: [
          { id: "p4", name: "Mariana Costa", role: "VP Sales", avatar: "MC" },
          { id: "p5", name: "Lucas Ferreira", role: "Head Ops", avatar: "LF" },
          { id: "p6", name: "Paula Nunes", role: "CFO", avatar: "PN" },
        ],
      },
    ],
  },
  {
    id: "qualification",
    title: "Qualificação",
    color: "bg-amber-500",
    cards: [
      {
        id: "4",
        accountName: "Vertex Digital",
        temperature: "warm",
        revenue: "R$ 95K",
        segment: "Marketing Tech",
        lastActivity: "Há 1 dia",
        personas: [
          { id: "p7", name: "Diego Almeida", role: "CMO", avatar: "DA" },
          { id: "p8", name: "Fernanda Lima", role: "Growth Lead", avatar: "FL" },
        ],
      },
      {
        id: "5",
        accountName: "Logística Prime",
        temperature: "hot",
        revenue: "R$ 310K",
        segment: "Logística",
        lastActivity: "Hoje",
        personas: [
          { id: "p9", name: "Eduardo Santos", role: "COO", avatar: "ES" },
        ],
      },
    ],
  },
  {
    id: "proposal",
    title: "Proposta",
    color: "bg-purple-500",
    cards: [
      {
        id: "6",
        accountName: "FinServ Capital",
        temperature: "hot",
        revenue: "R$ 450K",
        segment: "Fintech",
        lastActivity: "Hoje",
        personas: [
          { id: "p10", name: "Juliana Rocha", role: "CEO", avatar: "JR" },
          { id: "p11", name: "André Martins", role: "CFO", avatar: "AM" },
          { id: "p12", name: "Camila Souza", role: "Head Legal", avatar: "CS" },
        ],
      },
      {
        id: "7",
        accountName: "EduTech Academy",
        temperature: "warm",
        revenue: "R$ 75K",
        segment: "EdTech",
        lastActivity: "Há 3 dias",
        personas: [
          { id: "p13", name: "Ricardo Oliveira", role: "Founder", avatar: "RO" },
        ],
      },
      {
        id: "8",
        accountName: "GreenEnergy SA",
        temperature: "cold",
        revenue: "R$ 180K",
        segment: "Energia",
        lastActivity: "Há 7 dias",
        personas: [
          { id: "p14", name: "Patrícia Gomes", role: "Dir. Comercial", avatar: "PG" },
          { id: "p15", name: "Thiago Ribeiro", role: "Eng. Vendas", avatar: "TR" },
        ],
      },
    ],
  },
  {
    id: "negotiation",
    title: "Negociação",
    color: "bg-emerald-500",
    cards: [
      {
        id: "9",
        accountName: "MedHealth Group",
        temperature: "hot",
        revenue: "R$ 520K",
        segment: "HealthTech",
        lastActivity: "Hoje",
        personas: [
          { id: "p16", name: "Renata Campos", role: "CEO", avatar: "RC" },
          { id: "p17", name: "Marcos Vieira", role: "CTO", avatar: "MV" },
        ],
      },
    ],
  },
  {
    id: "closed",
    title: "Fechamento",
    color: "bg-primary",
    cards: [
      {
        id: "10",
        accountName: "RetailMax Brasil",
        temperature: "hot",
        revenue: "R$ 280K",
        segment: "Retail",
        lastActivity: "Hoje",
        personas: [
          { id: "p18", name: "Isabela Duarte", role: "Dir. Geral", avatar: "ID" },
          { id: "p19", name: "Felipe Moraes", role: "Head Compras", avatar: "FM" },
        ],
      },
    ],
  },
];

const tempConfig: Record<Temperature, { label: string; icon: React.ElementType; className: string }> = {
  hot: { label: "Hot", icon: Flame, className: "bg-red-500/15 text-red-600 border-red-500/20" },
  warm: { label: "Warm", icon: Sun, className: "bg-amber-500/15 text-amber-600 border-amber-500/20" },
  cold: { label: "Cold", icon: Snowflake, className: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
};

function AccountCardComponent({ card }: { card: AccountCard }) {
  const temp = tempConfig[card.temperature];
  const TempIcon = temp.icon;

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground mb-0.5">{card.segment}</p>
          <h4 className="text-sm font-semibold text-foreground truncate">{card.accountName}</h4>
        </div>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded">
          <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${temp.className}`}>
          <TempIcon className="h-3 w-3" />
          {temp.label}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
          <DollarSign className="h-3 w-3" />
          {card.revenue}
        </span>
      </div>

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

export default function DealsPage() {
  const [stages] = useState<PipelineStage[]>(initialStages);

  const totalRevenue = stages.flatMap(s => s.cards).reduce((sum, c) => {
    const num = parseFloat(c.revenue.replace(/[^\d]/g, "")) * 1000;
    return sum + num;
  }, 0);

  const totalAccounts = stages.flatMap(s => s.cards).length;

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border crm-section-enter">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Pipeline de Negócios</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalAccounts} contas · R$ {(totalRevenue / 1000000).toFixed(1)}M em pipeline
            </p>
          </div>
          <div className="flex items-center gap-2">
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
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-6 h-full min-w-max">
          {stages.map((stage, stageIdx) => (
            <div
              key={stage.id}
              className="w-[300px] flex flex-col bg-secondary/40 rounded-xl crm-section-enter shrink-0"
              style={{ animationDelay: `${stageIdx * 60}ms` }}
            >
              {/* Column Header */}
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

              {/* Cards */}
              <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2.5">
                {stage.cards.map((card) => (
                  <AccountCardComponent key={card.id} card={card} />
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
    </div>
  );
}

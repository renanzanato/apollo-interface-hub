import { TrendingUp, TrendingDown, Target, BarChart3, DollarSign, Users, Building2, Percent } from "lucide-react";

interface MetricCard {
  label: string;
  value: string;
  target: string;
  progress: number;
  trend: "up" | "down" | "neutral";
  trendValue: string;
  icon: React.ElementType;
}

const metrics: MetricCard[] = [
  {
    label: "Receita Gerada",
    value: "R$ 284.500",
    target: "Meta: R$ 500.000",
    progress: 56.9,
    trend: "up",
    trendValue: "+12% vs mês anterior",
    icon: DollarSign,
  },
  {
    label: "Contas Prospectadas",
    value: "142",
    target: "Meta: 200",
    progress: 71,
    trend: "up",
    trendValue: "+23 esta semana",
    icon: Building2,
  },
  {
    label: "Reuniões Agendadas",
    value: "38",
    target: "Meta: 60",
    progress: 63.3,
    trend: "down",
    trendValue: "-5% vs mês anterior",
    icon: Users,
  },
  {
    label: "Taxa de Conversão",
    value: "18,4%",
    target: "Meta: 25%",
    progress: 73.6,
    trend: "up",
    trendValue: "+2.1pp vs mês anterior",
    icon: Percent,
  },
];

const pipelineStages = [
  { name: "Prospecção", count: 45, value: "R$ 890K", color: "bg-blue-500" },
  { name: "Qualificação", count: 28, value: "R$ 520K", color: "bg-amber-500" },
  { name: "Proposta", count: 15, value: "R$ 340K", color: "bg-purple-500" },
  { name: "Negociação", count: 8, value: "R$ 180K", color: "bg-emerald-500" },
  { name: "Fechamento", count: 4, value: "R$ 95K", color: "bg-primary" },
];

const weeklyActivity = [
  { day: "Seg", tasks: 12, completed: 10 },
  { day: "Ter", tasks: 15, completed: 13 },
  { day: "Qua", tasks: 18, completed: 14 },
  { day: "Qui", tasks: 10, completed: 9 },
  { day: "Sex", tasks: 20, completed: 16 },
];

export function DashboardHome() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 crm-section-enter">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Painel de Metas</h1>
            <p className="text-sm text-muted-foreground mt-1">Acompanhe o progresso das suas metas e KPIs</p>
          </div>
          <div className="flex items-center gap-2">
            <select className="text-sm bg-secondary border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20">
              <option>Este mês</option>
              <option>Esta semana</option>
              <option>Este trimestre</option>
              <option>Este ano</option>
            </select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {metrics.map((metric, i) => (
            <div
              key={metric.label}
              className="bg-card border border-border rounded-lg p-5 crm-section-enter"
              style={{ animationDelay: `${80 + i * 60}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <metric.icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  metric.trend === "up" ? "text-emerald-600" : "text-red-500"
                }`}>
                  {metric.trend === "up" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {metric.trendValue}
                </div>
              </div>
              <p className="text-2xl font-semibold text-foreground tabular-nums">{metric.value}</p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">{metric.target}</p>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${metric.progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">{metric.progress}% da meta</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-6 mb-8">
          {/* Pipeline */}
          <div className="col-span-3 bg-card border border-border rounded-lg crm-section-enter" style={{ animationDelay: "300ms" }}>
            <div className="flex items-center gap-2 p-4 border-b border-border">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Pipeline por Estágio</h2>
            </div>
            <div className="p-4 space-y-4">
              {pipelineStages.map((stage) => {
                const maxCount = Math.max(...pipelineStages.map(s => s.count));
                const width = (stage.count / maxCount) * 100;
                return (
                  <div key={stage.name} className="flex items-center gap-4">
                    <span className="text-sm text-foreground w-28 shrink-0">{stage.name}</span>
                    <div className="flex-1 h-7 bg-secondary rounded overflow-hidden relative">
                      <div
                        className={`h-full ${stage.color} rounded transition-all duration-700`}
                        style={{ width: `${width}%` }}
                      />
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-medium text-white mix-blend-difference">
                        {stage.count} contas
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground w-20 text-right tabular-nums">{stage.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Activity */}
          <div className="col-span-2 bg-card border border-border rounded-lg crm-section-enter" style={{ animationDelay: "400ms" }}>
            <div className="flex items-center gap-2 p-4 border-b border-border">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Atividade Semanal</h2>
            </div>
            <div className="p-4 space-y-3">
              {weeklyActivity.map((day) => (
                <div key={day.day} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-8">{day.day}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-5 bg-secondary rounded overflow-hidden relative">
                      <div
                        className="h-full bg-primary/30 rounded"
                        style={{ width: `${(day.tasks / 20) * 100}%` }}
                      />
                      <div
                        className="h-full bg-primary rounded absolute top-0 left-0"
                        style={{ width: `${(day.completed / 20) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
                    {day.completed}/{day.tasks}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-3 pt-2 border-t border-border mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-primary" />
                  <span className="text-xs text-muted-foreground">Concluídas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-primary/30" />
                  <span className="text-xs text-muted-foreground">Total</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-3 gap-4 crm-section-enter" style={{ animationDelay: "500ms" }}>
          <div className="bg-card border border-border rounded-lg p-5">
            <p className="text-sm text-muted-foreground mb-1">Tarefas Pendentes</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums">23</p>
            <p className="text-xs text-muted-foreground mt-1">8 vencem hoje</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-5">
            <p className="text-sm text-muted-foreground mb-1">Sinais Ativos</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums">12</p>
            <p className="text-xs text-muted-foreground mt-1">3 novos alertas</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-5">
            <p className="text-sm text-muted-foreground mb-1">Sequências Ativas</p>
            <p className="text-2xl font-semibold text-foreground tabular-nums">5</p>
            <p className="text-xs text-muted-foreground mt-1">147 contatos em cadência</p>
          </div>
        </div>
      </div>
    </div>
  );
}

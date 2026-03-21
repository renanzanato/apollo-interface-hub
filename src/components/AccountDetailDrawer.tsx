import { X, Flame, Sun, Snowflake, DollarSign, MapPin, Building2, Calendar, Clock, ArrowRightLeft, Users, FileText, Rocket, Tag, Phone, Mail, Globe, Linkedin } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Temperature = "hot" | "warm" | "cold";

interface Persona {
  id: string;
  name: string;
  role: string;
  avatar: string;
  email?: string;
  phone?: string;
  linkedin?: string;
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

const tempConfig: Record<Temperature, { label: string; icon: React.ElementType; className: string }> = {
  hot: { label: "Hot", icon: Flame, className: "bg-red-500/15 text-red-600 border-red-500/20" },
  warm: { label: "Warm", icon: Sun, className: "bg-amber-500/15 text-amber-600 border-amber-500/20" },
  cold: { label: "Cold", icon: Snowflake, className: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
};

// Mock enrichment data for accounts
const accountDossier: Record<string, {
  cnpj?: string;
  website?: string;
  employees?: string;
  founded?: string;
  region?: string;
  city?: string;
  state?: string;
  industry?: string;
  description?: string;
  annualRevenue?: string;
  launches?: string[];
  tags?: string[];
}> = {
  "TechNova Solutions": {
    cnpj: "12.345.678/0001-90",
    website: "technova.com.br",
    employees: "50-200",
    founded: "2019",
    region: "Sudeste",
    city: "São Paulo",
    state: "SP",
    industry: "SaaS B2B",
    description: "Plataforma de automação de processos para empresas de médio porte com foco em eficiência operacional.",
    annualRevenue: "R$ 5M - R$ 10M",
    launches: ["Novo módulo de BI — Mar/2026", "Integração com ERPs — Abr/2026"],
    tags: ["SaaS", "Automação", "Scale-up"],
  },
  "CloudBase Inc": {
    cnpj: "98.765.432/0001-10",
    website: "cloudbase.io",
    employees: "200-500",
    founded: "2017",
    region: "Sudeste",
    city: "Rio de Janeiro",
    state: "RJ",
    industry: "Infraestrutura Cloud",
    description: "Provedor de infraestrutura cloud para empresas que precisam de alta disponibilidade e compliance.",
    annualRevenue: "R$ 20M - R$ 50M",
    launches: ["Edge Computing Suite — Fev/2026", "Plataforma Serverless v2 — Mar/2026"],
    tags: ["Cloud", "Infraestrutura", "Enterprise"],
  },
  "FinServ Capital": {
    cnpj: "11.222.333/0001-44",
    website: "finservcapital.com.br",
    employees: "100-300",
    founded: "2015",
    region: "Sudeste",
    city: "São Paulo",
    state: "SP",
    industry: "Fintech",
    description: "Soluções financeiras digitais para gestão de investimentos e crédito empresarial.",
    annualRevenue: "R$ 50M - R$ 100M",
    launches: ["App de Crédito PJ — Mar/2026"],
    tags: ["Fintech", "Crédito", "Enterprise"],
  },
};

function getDefaultDossier() {
  return {
    cnpj: "00.000.000/0001-00",
    website: "—",
    employees: "—",
    founded: "—",
    region: "Brasil",
    city: "—",
    state: "—",
    industry: "—",
    description: "Informações detalhadas não disponíveis. Enriqueça os dados desta conta.",
    annualRevenue: "—",
    launches: [],
    tags: [],
  };
}

interface AccountDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: AccountCard | null;
  currentStage?: string;
  currentFunnel?: string;
}

export function AccountDetailDrawer({ open, onOpenChange, card, currentStage, currentFunnel }: AccountDetailDrawerProps) {
  if (!card) return null;

  const temp = tempConfig[card.temperature];
  const TempIcon = temp.icon;
  const dossier = accountDossier[card.accountName] || getDefaultDossier();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <SheetHeader className="mb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-lg font-semibold text-foreground">{card.accountName}</SheetTitle>
                  <p className="text-xs text-muted-foreground">{dossier.industry} · {dossier.city}, {dossier.state}</p>
                </div>
              </div>
            </div>
          </SheetHeader>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${temp.className}`}>
              <TempIcon className="h-3 w-3" />
              {temp.label}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
              <DollarSign className="h-3 w-3" />
              {card.revenue}
            </span>
            {currentFunnel && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                {currentFunnel} → {currentStage}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="flex-1">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-6 h-10">
            <TabsTrigger value="overview" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="personas" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              Personas ({card.personas.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="px-6 py-4 space-y-5 mt-0">
            {/* Dossiê */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Dossiê da Conta
              </h4>
              <p className="text-sm text-foreground leading-relaxed">{dossier.description}</p>
            </div>

            <Separator />

            {/* Company Info Grid */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Informações da Empresa
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <InfoField label="CNPJ" value={dossier.cnpj} />
                <InfoField label="Fundação" value={dossier.founded} />
                <InfoField label="Funcionários" value={dossier.employees} />
                <InfoField label="Receita Anual" value={dossier.annualRevenue} />
                <InfoField label="Segmento" value={card.segment} />
                <InfoField label="Website" value={dossier.website} icon={<Globe className="h-3 w-3" />} />
              </div>
            </div>

            <Separator />

            {/* Geographic Region */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Região Geográfica
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <InfoField label="Região" value={dossier.region} />
                <InfoField label="Cidade" value={dossier.city} />
                <InfoField label="Estado" value={dossier.state} />
              </div>
            </div>

            <Separator />

            {/* Launches */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Rocket className="h-3.5 w-3.5" />
                Lançamentos Disponíveis
              </h4>
              {dossier.launches && dossier.launches.length > 0 ? (
                <div className="space-y-2">
                  {dossier.launches.map((launch, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm bg-secondary/60 rounded-md px-3 py-2">
                      <Rocket className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-foreground">{launch}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum lançamento registrado.</p>
              )}
            </div>

            <Separator />

            {/* Tags */}
            {dossier.tags && dossier.tags.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  Tags
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {dossier.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[11px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Dates */}
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <InfoField label="Criado em" value={card.createdAt} icon={<Calendar className="h-3 w-3" />} />
              <InfoField label="Última atividade" value={card.lastActivity} icon={<Clock className="h-3 w-3" />} />
            </div>
          </TabsContent>

          {/* Personas Tab */}
          <TabsContent value="personas" className="px-6 py-4 space-y-3 mt-0">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Personas Vinculadas
            </h4>
            {card.personas.map((persona) => (
              <div key={persona.id} className="bg-secondary/50 border border-border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                    {persona.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{persona.name}</p>
                    <p className="text-xs text-muted-foreground">{persona.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {persona.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {persona.email}
                    </span>
                  )}
                  {persona.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {persona.phone}
                    </span>
                  )}
                  {persona.linkedin && (
                    <span className="flex items-center gap-1">
                      <Linkedin className="h-3 w-3" />
                      {persona.linkedin}
                    </span>
                  )}
                  {!persona.email && !persona.phone && !persona.linkedin && (
                    <span className="text-muted-foreground/60 italic">Sem dados de contato — enriqueça os dados</span>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="px-6 py-4 space-y-3 mt-0">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Transições de Funil
            </h4>
            {card.transitions && card.transitions.length > 0 ? (
              <div className="space-y-2">
                {card.transitions.map((t, i) => (
                  <div key={i} className="bg-secondary/50 border border-border rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-foreground">{t.fromFunnel}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{t.fromStage}</span>
                      <span className="text-primary font-bold">→</span>
                      <span className="font-medium text-foreground">{t.toFunnel}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{t.toStage}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {t.date}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-secondary/30 rounded-lg p-6 text-center">
                <ArrowRightLeft className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma transição registrada ainda.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function InfoField({ label, value, icon }: { label: string; value?: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-secondary/40 rounded-md px-3 py-2">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-foreground flex items-center gap-1">
        {icon}
        {value || "—"}
      </p>
    </div>
  );
}

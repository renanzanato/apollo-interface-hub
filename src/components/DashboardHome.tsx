import { Lightbulb, ChevronRight, LayoutGrid, List, SlidersHorizontal, Grid3X3, Pencil } from "lucide-react";
import { useState } from "react";

interface Recommendation {
  id: number;
  title: string;
  description: string;
  priority: "Critical" | "Important" | "Normal";
  nextStep: string;
}

const recommendations: Recommendation[] = [
  {
    id: 1,
    title: "Boost reply rates with a tracking subdomain",
    description: "Using a primary domain for tracking can hurt deliverability. Add a tracking subdomain to protect your sender reputation.",
    priority: "Critical",
    nextStep: "Set up",
  },
  {
    id: 2,
    title: "Prevent high bounce rates from blocking outreach",
    description: "Too many unverified contacts can increase bounce rates and damage your sending reputation significantly.",
    priority: "Critical",
    nextStep: "View 1 recommendation",
  },
  {
    id: 3,
    title: "Add teammates to win deals together",
    description: "Top-performing teams don't work solo. Add teammates to collaborate on outreach and close deals faster.",
    priority: "Important",
    nextStep: "Start",
  },
  {
    id: 4,
    title: "Set up your email integration",
    description: "Connect your email account to send personalized messages directly from the platform with full tracking.",
    priority: "Normal",
    nextStep: "Connect",
  },
  {
    id: 5,
    title: "Import your existing contacts",
    description: "Bring your contacts from spreadsheets or other CRMs to start engaging with them right away.",
    priority: "Important",
    nextStep: "Import",
  },
];

const priorityStyles: Record<string, string> = {
  Critical: "bg-priority-critical/10 text-priority-critical",
  Important: "bg-priority-important/10 text-priority-important",
  Normal: "bg-primary/10 text-primary",
};

export function DashboardHome() {
  const [filter, setFilter] = useState("Active");

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="flex items-center justify-between mb-8 crm-section-enter">
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome, Clariane 👋
          </h1>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-[0.97]">
              <Pencil className="h-4 w-4" />
              Edit layout
            </button>
            <button className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/80 transition-colors active:scale-[0.97] border border-border">
              <LayoutGrid className="h-4 w-4" />
              Generate Pipeline
            </button>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-card border border-border rounded-lg crm-section-enter" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-accent" />
              <h2 className="text-base font-semibold text-foreground">Recommendations</h2>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-sm bg-secondary border border-border rounded-md px-3 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
              >
                <option>Active</option>
                <option>Completed</option>
                <option>All</option>
              </select>
              <button className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground">
                <List className="h-4 w-4" />
              </button>
              <button className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground">
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              <button className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground">
                <Grid3X3 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-[1fr_1.2fr_120px_160px] gap-4 px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border">
            <span>Title</span>
            <span>Description</span>
            <span>Priority</span>
            <span>Next Steps</span>
          </div>

          {/* Table Rows */}
          {recommendations.map((rec, i) => (
            <div
              key={rec.id}
              className="grid grid-cols-[1fr_1.2fr_120px_160px] gap-4 px-4 py-3.5 items-center border-b border-border last:border-b-0 hover:bg-secondary/50 transition-colors cursor-pointer group crm-section-enter"
              style={{ animationDelay: `${150 + i * 60}ms` }}
            >
              <div className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                <span className="text-sm font-medium text-foreground truncate">
                  {rec.title}
                </span>
              </div>
              <span className="text-sm text-muted-foreground truncate">
                {rec.description}
              </span>
              <div>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${priorityStyles[rec.priority]}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {rec.priority}
                </span>
              </div>
              <div>
                <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors active:scale-[0.97]">
                  {rec.nextStep}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-8">
          {[
            { label: "Total Contacts", value: "12,847", change: "+234 this week" },
            { label: "Active Sequences", value: "8", change: "3 need attention" },
            { label: "Emails Sent", value: "1,293", change: "This month" },
            { label: "Deals in Pipeline", value: "$847K", change: "23 active deals" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="bg-card border border-border rounded-lg p-5 hover:shadow-md transition-shadow crm-section-enter"
              style={{ animationDelay: `${400 + i * 80}ms` }}
            >
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-semibold text-foreground tabular-nums">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

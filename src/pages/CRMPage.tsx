import { useLocation } from "react-router-dom";
import { Users, Building2, ListFilter, Database, Send, Mail, Phone, CheckSquare, CalendarDays, MessageSquare, DollarSign, Bot, UserPlus, Shield, Settings } from "lucide-react";

const pageInfo: Record<string, { title: string; icon: React.ElementType; description: string }> = {
  "/people": { title: "People", icon: Users, description: "Find and manage your contacts database. Search through millions of verified contacts." },
  "/companies": { title: "Companies", icon: Building2, description: "Explore company profiles, org charts, and buying signals." },
  "/lists": { title: "Lists", icon: ListFilter, description: "Organize your prospects into targeted lists for outreach campaigns." },
  "/data-enrichment": { title: "Data Enrichment", icon: Database, description: "Enrich your contact and company data with verified information." },
  "/sequences": { title: "Sequences", icon: Send, description: "Create automated multi-step outreach sequences." },
  "/emails": { title: "Emails", icon: Mail, description: "Manage your email campaigns and track engagement metrics." },
  "/calls": { title: "Calls", icon: Phone, description: "Log calls, track outcomes, and manage your calling workflow." },
  "/tasks": { title: "Tasks", icon: CheckSquare, description: "Stay on top of your daily tasks and follow-ups." },
  "/meetings": { title: "Meetings", icon: CalendarDays, description: "Schedule and manage your meetings with prospects." },
  "/conversations": { title: "Conversations", icon: MessageSquare, description: "Track all your conversations across channels in one place." },
  "/deals": { title: "Deals", icon: DollarSign, description: "Manage your deal pipeline and track revenue opportunities." },
  "/ai-assistant": { title: "AI Assistant", icon: Bot, description: "Get AI-powered insights and recommendations for your outreach." },
  "/add-teammates": { title: "Add Teammates", icon: UserPlus, description: "Invite team members to collaborate on outreach and deals." },
  "/deliverability": { title: "Deliverability Suite", icon: Shield, description: "Monitor and optimize your email deliverability." },
  "/settings": { title: "Admin Settings", icon: Settings, description: "Configure your workspace, integrations, and team settings." },
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
          <h3 className="text-lg font-medium text-foreground mb-2">No {info.title.toLowerCase()} yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Get started by creating your first {info.title.toLowerCase().replace(/s$/, "")} or importing existing data.
          </p>
          <button className="bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity active:scale-[0.97]">
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}

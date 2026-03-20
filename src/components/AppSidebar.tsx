import {
  Home, Bot, Search, Building2, ListFilter, Database,
  Send, MessageSquare, CheckSquare, Handshake,
  DollarSign, ChevronDown, ChevronRight, Sparkles, Radio
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: { title: string; url: string; icon: React.ElementType; badge?: string }[];
}

const navGroups: NavGroup[] = [
  {
    label: "",
    icon: Home,
    items: [
      { title: "Home", url: "/", icon: Home },
      { title: "AI Assistentes", url: "/ai-assistant", icon: Bot, badge: "New" },
    ],
  },
  {
    label: "Prospecção e aquecimento",
    icon: Search,
    items: [
      { title: "Pessoas", url: "/people", icon: MessageSquare },
      { title: "Empresas", url: "/companies", icon: Building2 },
      { title: "Listas", url: "/lists", icon: ListFilter },
      { title: "Aquecimento de dados", url: "/data-enrichment", icon: Database },
      { title: "Sinais", url: "/signals", icon: Radio },
    ],
  },
  {
    label: "Engajamento",
    icon: Send,
    items: [
      { title: "Sequências", url: "/sequences", icon: Send },
      { title: "WhatsApp", url: "/whatsapp", icon: MessageSquare },
      { title: "Tarefas", url: "/tasks", icon: CheckSquare },
    ],
  },
  {
    label: "Negócios",
    icon: Handshake,
    items: [
      { title: "Deals", url: "/deals", icon: DollarSign },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Prospecção e aquecimento": true,
    "Engajamento": true,
    "Negócios": true,
  });

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="py-2">
        {/* Logo */}
        <div className="px-4 py-3 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary shrink-0" />
          {!collapsed && <span className="text-lg font-bold text-foreground">Pipa CRM</span>}
        </div>

        {navGroups.map((group) => (
          <SidebarGroup key={group.label || "main"}>
            {group.label && !collapsed && (
              <SidebarGroupLabel
                className="cursor-pointer select-none flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-1.5 hover:text-foreground transition-colors"
                onClick={() => toggleGroup(group.label)}
              >
                <group.icon className="h-3.5 w-3.5 mr-1" />
                {group.label}
                {openGroups[group.label] ? (
                  <ChevronDown className="h-3 w-3 ml-auto" />
                ) : (
                  <ChevronRight className="h-3 w-3 ml-auto" />
                )}
              </SidebarGroupLabel>
            )}
            {(group.label === "" || openGroups[group.label] || collapsed) && (
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end
                          className={`flex items-center gap-3 px-4 py-2 text-sm rounded-md transition-colors ${
                            isActive(item.url)
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-sidebar-foreground hover:bg-sidebar-accent"
                          }`}
                          activeClassName=""
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && (
                            <span className="flex-1">{item.title}</span>
                          )}
                          {!collapsed && item.badge && (
                            <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

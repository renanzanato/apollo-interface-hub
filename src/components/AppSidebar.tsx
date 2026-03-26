import {
  Home, Bot, Search, Building2, Database,
  Send, MessageSquare, CheckSquare,
  DollarSign, ChevronDown, ChevronRight, Sparkles, Radio, Sun, Moon, Users, Zap, Target,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { PipaAIButton } from "@/components/PipaAIPanel";
import { TaskDB } from "@/lib/db";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
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
      { title: "Deals", url: "/deals", icon: DollarSign },
      { title: "Metas", url: "/metas", icon: Target },
    ],
  },
  {
    label: "Prospecção e aquecimento",
    icon: Search,
    items: [
      { title: "Pessoas", url: "/people", icon: Users },
      { title: "Empresas", url: "/companies", icon: Building2 },
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
    label: "Growth",
    icon: Zap,
    items: [
      { title: "Growth Lab", url: "/growth-lab", icon: Zap, badge: "New" },
      { title: "Agentes de IA", url: "/agents", icon: Bot },
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
    "Growth": true,
  });
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    TaskDB.getAll().then((tasks) => {
      const count = tasks.filter((t) => t.status !== "done" && t.dueDate && t.dueDate <= today).length;
      setOverdueCount(count);
    });
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="py-2">
        <div className="px-4 py-3 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary shrink-0" />
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
                          {!collapsed && item.url === "/tasks" && overdueCount > 0 && (
                            <span className="text-[10px] font-semibold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                              {overdueCount}
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

      <SidebarFooter className="p-2 border-t border-border space-y-0.5">
        {!collapsed && <PipaAIButton />}

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="flex items-center gap-3 w-full px-2 py-[6px] text-sm rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {darkMode ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
          {!collapsed && <span>{darkMode ? "Modo claro" : "Modo escuro"}</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}

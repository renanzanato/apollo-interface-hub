import {
  Home, Bot, Search, Building2, ListFilter, Database,
  Send, Mail, Phone, CheckSquare, Handshake, CalendarDays,
  MessageSquare, DollarSign, Users, Settings, Shield, ChevronDown, ChevronRight, Sparkles, UserPlus
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
      { title: "AI Assistant", url: "/ai-assistant", icon: Bot, badge: "New" },
    ],
  },
  {
    label: "Prospect and enrich",
    icon: Search,
    items: [
      { title: "People", url: "/people", icon: Users },
      { title: "Companies", url: "/companies", icon: Building2 },
      { title: "Lists", url: "/lists", icon: ListFilter },
      { title: "Data enrichment", url: "/data-enrichment", icon: Database },
    ],
  },
  {
    label: "Engage",
    icon: Send,
    items: [
      { title: "Sequences", url: "/sequences", icon: Send },
      { title: "Emails", url: "/emails", icon: Mail },
      { title: "Calls", url: "/calls", icon: Phone },
      { title: "Tasks", url: "/tasks", icon: CheckSquare },
    ],
  },
  {
    label: "Win deals",
    icon: Handshake,
    items: [
      { title: "Meetings", url: "/meetings", icon: CalendarDays },
      { title: "Conversations", url: "/conversations", icon: MessageSquare },
      { title: "Deals", url: "/deals", icon: DollarSign },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Prospect and enrich": true,
    "Engage": true,
    "Win deals": true,
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
          {!collapsed && <span className="text-lg font-bold text-foreground">CRM Pro</span>}
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

      <SidebarFooter className="border-t border-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/add-teammates"
                end
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium bg-accent text-accent-foreground rounded-md hover:opacity-90 transition-opacity"
                activeClassName=""
              >
                <UserPlus className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Add teammates</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/deliverability"
                end
                className="flex items-center gap-3 px-4 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors"
                activeClassName="bg-primary/10 text-primary font-medium"
              >
                <Shield className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Deliverability suite</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/settings"
                end
                className="flex items-center gap-3 px-4 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent rounded-md transition-colors"
                activeClassName="bg-primary/10 text-primary font-medium"
              >
                <Settings className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Admin Settings</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

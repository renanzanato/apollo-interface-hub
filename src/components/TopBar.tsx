import { Search, Bot, X } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useState } from "react";

export function TopBar() {
  const [showBanner, setShowBanner] = useState(true);

  return (
    <div className="flex flex-col">
      {showBanner && (
        <div className="bg-banner text-banner-foreground px-4 py-2.5 flex items-center justify-between text-sm crm-section-enter">
          <div className="flex items-center gap-3">
            <span className="text-primary">📈</span>
            <span>
              Our Basic plan just got better with unlimited sequences! Start scaling your outreach and win more deals
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-accent text-accent-foreground px-4 py-1.5 rounded text-sm font-medium hover:opacity-90 transition-opacity active:scale-[0.97]">
              Create Sequence
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="text-banner-foreground/60 hover:text-banner-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="h-14 flex items-center gap-3 px-4 border-b border-border bg-background">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

        <div className="flex-1 flex items-center">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search across CRM Pro..."
              className="w-full pl-10 pr-20 py-2 bg-secondary rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-shadow"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border">
              Ctrl K
            </kbd>
          </div>
        </div>

        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity active:scale-[0.97]">
          <Bot className="h-4 w-4" />
          AI Assistant
        </button>

        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
          CA
        </div>
      </div>
    </div>
  );
}

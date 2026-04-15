"use client";

import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { AlertTriangle, Bug, ChevronLeft, ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/weekly-bug-report", label: "Weekly Bug Report", icon: Bug },
  { href: "/incident-tracking", label: "Incident Tracking", icon: AlertTriangle },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, toggleSidebar } = useAppStore();

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200 ease-in-out shrink-0",
        isSidebarOpen ? "w-56" : "w-14"
      )}
    >
      {/* Nav items */}
      <nav className="flex flex-col gap-1 p-2 pt-4 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              title={!isSidebarOpen ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon
                className={cn("shrink-0", isActive ? "text-sidebar-accent-foreground" : "")}
                size={18}
                aria-hidden="true"
              />
              {isSidebarOpen && (
                <span className="truncate">{label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse / expand toggle */}
      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? "Collapse navigation" : "Expand navigation"}
          className="flex w-full items-center justify-center rounded-md px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {isSidebarOpen ? (
            <ChevronLeft size={18} aria-hidden="true" />
          ) : (
            <ChevronRight size={18} aria-hidden="true" />
          )}
        </button>
      </div>
    </aside>
  );
}

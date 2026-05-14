"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, Bug, Home, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const baseNavItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/weekly-bug-report", label: "Weekly Bug Report", icon: Bug },
  { href: "/incident-tracking", label: "Incident Tracking", icon: AlertTriangle },
];

const adminNavItems = [
  { href: "/admin/users", label: "User Management", icon: Users },
];

export function AppSidebar({ userPanel }: { userPanel?: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role ?? "Viewer";

  const navItems = role === "Admin" ? [...baseNavItems, ...adminNavItems] : baseNavItems;

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shrink-0 w-64 h-screen sticky top-0"
      )}
    >
      <div className="flex h-16 items-center px-4 pt-6 mb-5">
        <Link href="/">
          <img src="/das-logo.svg" alt="DAS Technology" loading="eager" width={160} height={48} className="w-full h-auto object-contain object-left" />
        </Link>
      </div>
      <nav className="flex flex-col gap-1 p-2 pt-4 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2 py-1.5 text-md font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon
                className={cn("shrink-0 h-4 w-4", isActive ? "text-sidebar-accent-foreground" : "")}
                aria-hidden="true"
              />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
      {userPanel}
    </aside>
  );
}

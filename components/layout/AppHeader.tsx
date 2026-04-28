import { SidebarToggle } from "@/components/layout/SidebarToggle";
import Link from "next/link";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-xs">
      <div className="flex items-center px-2 py-3">
        <div className="flex items-center gap-2">
          <SidebarToggle />
          <Link href="/" aria-label="Home">
            <img
              src="/das-logo.svg"
              alt="DAS Technology"
              className="h-10 w-auto pl-4"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}

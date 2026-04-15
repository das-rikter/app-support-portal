import { SidebarToggle } from "@/components/layout/SidebarToggle";
import { Button } from "@/components/ui/button";
import { auth, signOut } from "@/lib/auth";
import { LogOut } from "lucide-react";
import Link from "next/link";

export async function AppHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 bg-sidebar shadow-xs">
      <div className="flex items-center justify-between px-2 py-3">
        {/* Sidebar toggle + Logo */}
        <div className="flex items-center gap-2">
          <SidebarToggle />
          <Link href="/" aria-label="Home">
            <img
              src="/das-logo.png"
              alt="DAS Technology"
              className="h-10 w-auto pl-4"
            />
          </Link>
        </div>

        {/* User / sign-out */}
        <div className="flex items-center gap-3">
          {session?.user && (
            <>
              <span className="hidden text-xs text-txt-neutral-100 sm:block">
                {session.user.name}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-txt-neutral-100 hover:bg-primary-shuttle-gray-800 hover:text-white"
                >
                  <LogOut />
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

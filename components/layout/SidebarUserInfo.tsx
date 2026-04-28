import { Button } from "@/components/ui/button";
import { auth, signOut } from "@/lib/auth";
import { LogOut } from "lucide-react";

export async function SidebarUserInfo() {
  const session = await auth();
  if (!session?.user) return null;

  const { name, email } = session.user;

  const initials = name
    ? name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
    : '?'

  return (
    <div className="flex items-center justify-between gap-2 border-t border-sidebar-border px-3 py-3">
      <div
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-clementine-900 text-xs font-semibold text-white"
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        {name && (
          <p className="truncate text-md font-medium text-txt-neutral-900">{name}</p>
        )}
        {email && (
          <p className="truncate text-xs text-txt-neutral-600">{email}</p>
        )}
      </div>
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
          className="text-foreground hover:bg-primary-shuttle-gray-800 hover:text-white"
        >
          <LogOut size={16} />
        </Button>
      </form>
    </div>
  );
}

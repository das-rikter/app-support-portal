import { auth } from "@/lib/auth";
import { SidebarUserMenu } from "./SidebarUserMenu";

export async function SidebarUserInfo() {
  const session = await auth();
  if (!session?.user) return null;

  const { name, email } = session.user;

  const initials = name
    ? name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '?';

  return (
    <SidebarUserMenu
      name={name ?? ''}
      email={email ?? ''}
      initials={initials}
    />
  );
}

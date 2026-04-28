'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Moon, Sun } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface Props {
  name: string;
  email: string;
  initials: string;
}

export function SidebarUserMenu({ name, email, initials }: Props) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-2 border-t border-sidebar-border px-3 py-3 text-left transition-colors cursor-pointer outline-none">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-clementine-900 text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted-foreground">
            <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />
          </svg>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-52 mb-1">
        <DropdownMenuItem onClick={toggleDark} className="gap-2 cursor-pointer">
          {dark ? <Sun size={14} /> : <Moon size={14} />}
          {dark ? 'Light mode' : 'Dark mode'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="gap-2 cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut size={14} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";
import { Menu } from "lucide-react";

export function SidebarToggle() {
  const { isSidebarOpen, toggleSidebar } = useAppStore();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleSidebar}
      aria-label={isSidebarOpen ? "Collapse navigation" : "Expand navigation"}
      className="text-txt-neutral-100 hover:bg-primary-shuttle-gray-800 hover:text-white"
    >
      <Menu size={18} aria-hidden="true" />
    </Button>
  );
}

"use client";

import { useIncidentStore } from '@/store/useIncidentStore';
import type { IncidentView } from '@/types/incident';

const TABS: { id: IncidentView; label: string }[] = [
  { id: 'overview',   label: 'Overview' },
  { id: 'products',   label: 'Product & Ownership' },
  { id: 'process',    label: 'Process & Reliability' },
  { id: 'incidents',  label: 'All Incidents' },
  { id: 'multi-app',  label: 'Multi-App' },
];

export function ViewTabs() {
  const activeView = useIncidentStore((s) => s.activeView);
  const setView = useIncidentStore((s) => s.setView);

  return (
    <nav className="sticky top-16 z-40 id-tab-nav -mx-6 mb-4">
      <div className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`id-tab-button px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
              activeView === tab.id ? 'active' : ''
            }`}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

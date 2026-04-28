'use client';

import { useScrollSpy } from '@/hooks/useScrollSpy';
import { useBugReportStore } from '@/store/useBugReportStore';

const TABS = [
  { id: 'section-kpis', label: 'Overview' },
  { id: 'section-projects', label: 'By Project' },
  { id: 'section-priority', label: 'Priority' },
  { id: 'section-age', label: 'Age' },
  { id: 'section-timeline', label: 'Timeline' },
  { id: 'section-status-table', label: 'Status Table' },
  { id: 'section-weekly', label: 'Weekly Updates' },
  { id: 'section-open-bugs', label: 'All Open Bugs' },
  { id: 'section-leads', label: 'By Lead' },
];

export function NavTabs() {
  const activeSection = useBugReportStore((s) => s.activeSection);
  const setActiveSectionFromClick = useScrollSpy();

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    setActiveSectionFromClick(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <nav className="sticky top-0 z-40 bg-card border-b border-border -mx-6">
      <div className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => (
          <a
            key={tab.id}
            href={`#${tab.id}`}
            className={`px-4 py-3 text-xs font-semibold no-underline border-b-2 whitespace-nowrap transition-colors ${activeSection === tab.id
                ? 'text-[#dd6000] border-[#dd6000]'
                : 'text-gray-500 border-transparent hover:text-gray-900'
              }`}
            onClick={(e) => handleClick(e, tab.id)}
          >
            {tab.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

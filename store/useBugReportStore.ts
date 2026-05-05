import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Bug, WeeklyRange } from '@/types/bug-report';

interface BugReportState {
  bugs: Bug[];
  weeklyBugs: Bug[];
  weeklyRange: WeeklyRange | null;
  activeSection: string;

  setBugs: (bugs: Bug[]) => void;
  setWeeklyBugs: (bugs: Bug[], range: WeeklyRange) => void;
  setActiveSection: (id: string) => void;
}

export const useBugReportStore = create<BugReportState>()(
  devtools(
    (set) => ({
      bugs: [],
      weeklyBugs: [],
      weeklyRange: null,
      activeSection: 'section-kpis',

      setBugs: (bugs) => set({ bugs }),
      setWeeklyBugs: (bugs, range) => set({ weeklyBugs: bugs, weeklyRange: range }),
      setActiveSection: (id) => set({ activeSection: id }),
    }),
    { name: 'BugReportStore' }
  )
);

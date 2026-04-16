import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Incident, IncidentView } from '@/types/incident';
import { INCIDENTS } from '@/lib/incidentData';

interface IncidentFilters {
  month: string;
  product: string;
  severity: string;
  ownership: string; // '' | 'Internal' | 'External'
}

interface IncidentState {
  filters: IncidentFilters;
  filtered: Incident[];
  activeView: IncidentView;
  setView: (view: IncidentView) => void;
  setFilters: (filters: Partial<IncidentFilters>) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: IncidentFilters = {
  month: '',
  product: '',
  severity: '',
  ownership: '',
};

function applyFilters(filters: IncidentFilters): Incident[] {
  return INCIDENTS.filter((d) => {
    if (filters.month && d.month !== filters.month) return false;
    if (filters.product && d.product !== filters.product) return false;
    if (filters.severity && d.sev !== filters.severity) return false;
    if (filters.ownership) {
      const internal = d.dasCaused === 1;
      if (filters.ownership === 'Internal' && !internal) return false;
      if (filters.ownership === 'External' && internal) return false;
    }
    return true;
  });
}

export const useIncidentStore = create<IncidentState>()(
  devtools(
    (set) => ({
      filters: DEFAULT_FILTERS,
      filtered: [...INCIDENTS],
      activeView: 'overview',

      setView: (view) => set({ activeView: view }),

      setFilters: (newFilters) =>
        set((s) => {
          const filters = { ...s.filters, ...newFilters };
          return { filters, filtered: applyFilters(filters) };
        }),

      resetFilters: () =>
        set({ filters: DEFAULT_FILTERS, filtered: [...INCIDENTS] }),
    }),
    { name: 'IncidentStore' }
  )
);

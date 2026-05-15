import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Incident, IncidentView } from '@/types/incident';
import { extractYear, getMonthFromDate } from '@/lib/incidentUtils';

const CURRENT_YEAR = String(new Date().getFullYear());

interface IncidentFilters {
  year: string;
  month: string;
  product: string;
  severity: string;
  ownership: string; // '' | 'Internal' | 'External'
}

interface IncidentState {
  filters: IncidentFilters;
  filtered: Incident[];
  activeView: IncidentView;
  incidents: Incident[];
  setView: (view: IncidentView) => void;
  setFilters: (filters: Partial<IncidentFilters>) => void;
  resetFilters: () => void;
  setIncidents: (incidents: Incident[]) => void;
}

const DEFAULT_FILTERS: IncidentFilters = {
  year: CURRENT_YEAR,
  month: '',
  product: '',
  severity: '',
  ownership: '',
};

function applyFilters(incidents: Incident[], filters: IncidentFilters): Incident[] {
  return incidents.filter((d) => {
    if (filters.year) {
      if (extractYear(d.date ?? '') !== filters.year) return false;
    }
    if (filters.month && getMonthFromDate(d.date ?? '') !== filters.month) return false;
    if (filters.product && d.product !== filters.product) return false;
    if (filters.severity && d.severity !== filters.severity) return false;
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
      incidents: [],
      filtered: [],
      activeView: 'overview',

      setView: (view) => set({ activeView: view }),

      setFilters: (newFilters) =>
        set((s) => {
          const filters = { ...s.filters, ...newFilters };
          return { filters, filtered: applyFilters(s.incidents, filters) };
        }),

      resetFilters: () =>
        set((s) => ({ filters: DEFAULT_FILTERS, filtered: applyFilters(s.incidents, DEFAULT_FILTERS) })),

      setIncidents: (incidents) =>
        set((s) => {
          const years = [...new Set(incidents.map((d) => extractYear(d.date ?? '')).filter(Boolean))].sort();
          const defaultYear = years[years.length - 1] || CURRENT_YEAR;
          const filters = { ...s.filters, year: defaultYear };
          return { incidents, filters, filtered: applyFilters(incidents, filters) };
        }),
    }),
    { name: 'IncidentStore' }
  )
);

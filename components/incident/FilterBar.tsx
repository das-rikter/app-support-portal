"use client";

import { INCIDENTS } from '@/lib/incidentData';
import { getMonths, getProducts } from '@/lib/incidentUtils';
import { useIncidentStore } from '@/store/useIncidentStore';

const ALL_MONTHS = getMonths(INCIDENTS);
const ALL_PRODUCTS = getProducts(INCIDENTS);

export function FilterBar() {
  const filters = useIncidentStore((s) => s.filters);
  const filtered = useIncidentStore((s) => s.filtered);
  const setFilters = useIncidentStore((s) => s.setFilters);
  const resetFilters = useIncidentStore((s) => s.resetFilters);

  const hasFilters =
    filters.month || filters.product || filters.severity || filters.ownership;

  const selectClass =
    'border border-sidebar-border rounded-md px-3 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:border-[#d66a06] cursor-pointer';

  return (
    <div className="flex flex-wrap gap-3 mb-4 items-center mt-6">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Month</span>
        <select
          className={selectClass}
          value={filters.month}
          onChange={(e) => setFilters({ month: e.target.value })}
        >
          <option value="">All months</option>
          {ALL_MONTHS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Product</span>
        <select
          className={selectClass}
          value={filters.product}
          onChange={(e) => setFilters({ product: e.target.value })}
        >
          <option value="">All products</option>
          {ALL_PRODUCTS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Severity</span>
        <select
          className={selectClass}
          value={filters.severity}
          onChange={(e) => setFilters({ severity: e.target.value })}
        >
          <option value="">All severity</option>
          <option value="P1">P1 – Critical</option>
          <option value="P2">P2 – High</option>
          <option value="P3">P3 – Medium</option>
          <option value="P4">P4 – Low</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ownership</span>
        <select
          className={selectClass}
          value={filters.ownership}
          onChange={(e) => setFilters({ ownership: e.target.value })}
        >
          <option value="">All</option>
          <option value="Internal">Internal</option>
          <option value="External">External</option>
        </select>
      </div>

      <button
        onClick={resetFilters}
        className="px-3 py-1.5 rounded-md border border-sidebar-border bg-background text-sm font-semibold text-gray-700 hover:border-[#d66a06] hover:text-[#d66a06] transition-colors"
      >
        Reset
      </button>

      {hasFilters && (
        <span className="text-sm text-gray-500 font-semibold ml-1">
          {filtered.length} of {INCIDENTS.length} incidents
        </span>
      )}
    </div>
  );
}

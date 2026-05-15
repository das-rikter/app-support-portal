"use client";

import { IncidentModal } from "@/components/incident/IncidentModal";
import { useDeleteIncident, useIncidents } from "@/hooks/useIncidents";
import { formatMinutes, getProducts, getYears, parseOutageHrs } from "@/lib/incidentUtils";
import type { Incident } from "@/types/incident";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";

const TH = "px-3 py-2.5 text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-bold text-left border-b border-border whitespace-nowrap select-none bg-secondary";
const TD = "px-3 py-2.5 border-b border-border text-[13px] align-middle";

const SEV_CLASS: Record<string, string> = {
  P1: "inline-flex px-2 py-0.5 rounded-full text-[11px] font-extrabold tracking-[0.04em] bg-[rgba(220,38,38,0.12)] text-[#dc2626]",
  P2: "inline-flex px-2 py-0.5 rounded-full text-[11px] font-extrabold tracking-[0.04em] bg-[rgba(217,119,6,0.12)] text-[#d97706]",
  P3: "inline-flex px-2 py-0.5 rounded-full text-[11px] font-extrabold tracking-[0.04em] bg-[rgba(59,130,246,0.12)] text-[#3b82f6]",
  P4: "inline-flex px-2 py-0.5 rounded-full text-[11px] font-extrabold tracking-[0.04em] bg-[rgba(22,163,74,0.12)] text-[#16a34a]",
};

const CHIP: Record<string, string> = {
  internal: "inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-[rgba(214,106,6,0.10)] text-[#d66a06]",
  external: "inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-[rgba(59,130,246,0.12)] text-[#3b82f6]",
  yes: "inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-[rgba(22,163,74,0.12)] text-[#16a34a]",
  no: "inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-[rgba(107,114,128,0.12)] text-muted-foreground",
};

const selectCls =
  "border border-border rounded-lg px-2.5 py-1.5 text-xs cursor-pointer focus:outline-none bg-background text-foreground focus:border-[#d66a06]";

type SortCol = "date" | "product" | "severity" | "outage" | "downtime" | "title";

const PAGE_SIZES = [10, 20, 50, 100];

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ChevronsUpDown size={11} className="text-muted-foreground/50 inline ml-0.5" />;
  return dir === "asc"
    ? <ChevronUp size={11} className="text-[#d66a06] inline ml-0.5" />
    : <ChevronDown size={11} className="text-[#d66a06] inline ml-0.5" />;
}

interface SortTHProps {
  col: SortCol;
  children: React.ReactNode;
  activeCol: SortCol;
  dir: "asc" | "desc";
  onSort: (col: SortCol) => void;
}

function SortTH({ col, children, activeCol, dir, onSort }: SortTHProps) {
  return (
    <th
      className={TH + " cursor-pointer hover:text-foreground transition-colors"}
      onClick={() => onSort(col)}
    >
      {children}
      <SortIcon active={activeCol === col} dir={dir} />
    </th>
  );
}

export function IncidentManagementTable() {
  const { data: incidents = [], isLoading, error } = useIncidents();
  const deleteIncident = useDeleteIncident();

  const [search, setSearch] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterOwnership, setFilterOwnership] = useState("");
  const [sortCol, setSortCol] = useState<SortCol>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Incident | null>(null);

  const allYears = useMemo(() => getYears(incidents as Incident[]), [incidents]);
  const allProducts = useMemo(() => getProducts(incidents as Incident[]), [incidents]);

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (incidents as Incident[]).filter((d) => {
      if (filterYear && !d.date.startsWith(filterYear)) return false;
      if (filterProduct && d.product !== filterProduct) return false;
      if (filterSeverity && d.severity !== filterSeverity) return false;
      if (filterOwnership === "Internal" && !d.dasCaused) return false;
      if (filterOwnership === "External" && d.dasCaused) return false;
      if (q && !(
        d.title.toLowerCase().includes(q) ||
        d.product.toLowerCase().includes(q) ||
        d.function.toLowerCase().includes(q) ||
        (d.cause || "").toLowerCase().includes(q) ||
        (d.owner || "").toLowerCase().includes(q) ||
        (d.lead || "").toLowerCase().includes(q)
      )) return false;
      return true;
    });
  }, [incidents, search, filterYear, filterProduct, filterSeverity, filterOwnership]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let va: number | string | Date, vb: number | string | Date;
      if (sortCol === "date") { va = new Date(a.date); vb = new Date(b.date); }
      else if (sortCol === "product") { va = a.product; vb = b.product; }
      else if (sortCol === "title") { va = a.title; vb = b.title; }
      else if (sortCol === "severity") {
        va = ["P1", "P2", "P3", "P4"].indexOf(a.severity);
        vb = ["P1", "P2", "P3", "P4"].indexOf(b.severity);
      } else if (sortCol === "outage") {
        va = parseOutageHrs(a.outage);
        vb = parseOutageHrs(b.outage);
      } else {
        va = parseOutageHrs(a.downtime);
        vb = parseOutageHrs(b.downtime);
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleDelete = async (incident: Incident) => {
    if (incident.id == null) return;
    await deleteIncident.mutateAsync(incident.id);
    setConfirmDelete(null);
  };

  const openAdd = () => { setEditingIncident(null); setModalOpen(true); };
  const openEdit = (inc: Incident) => { setEditingIncident(inc); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingIncident(null); };

  const resetFilters = () => {
    setSearch("");
    setFilterYear("");
    setFilterProduct("");
    setFilterSeverity("");
    setFilterOwnership("");
    setPage(1);
  };

  const hasActiveFilters = search || filterYear || filterProduct || filterSeverity || filterOwnership;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        Loading incidents…
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-destructive/30 bg-destructive/10 rounded-2xl p-8 text-center">
        <p className="text-sm text-destructive font-medium">
          {error instanceof Error ? error.message : "Failed to load incidents"}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center mb-4 mt-4">
        <input
          type="text"
          placeholder="Search by title, product, function, cause…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border border-border rounded-lg px-3 py-1.5 text-sm w-72 focus:outline-none focus:border-[#d66a06] bg-background text-foreground"
        />

        <select value={filterYear} onChange={(e) => { setFilterYear(e.target.value); setPage(1); }} className={selectCls}>
          <option value="">All years</option>
          {allYears.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>

        <select value={filterProduct} onChange={(e) => { setFilterProduct(e.target.value); setPage(1); }} className={selectCls}>
          <option value="">All products</option>
          {allProducts.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <select value={filterSeverity} onChange={(e) => { setFilterSeverity(e.target.value); setPage(1); }} className={selectCls}>
          <option value="">All severity</option>
          <option value="P1">P1 – Critical</option>
          <option value="P2">P2 – High</option>
          <option value="P3">P3 – Medium</option>
          <option value="P4">P4 – Low</option>
        </select>

        <select value={filterOwnership} onChange={(e) => { setFilterOwnership(e.target.value); setPage(1); }} className={selectCls}>
          <option value="">All ownership</option>
          <option value="Internal">Internal (DAS)</option>
          <option value="External">External</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold text-foreground hover:border-[#d66a06] hover:text-[#d66a06] transition-colors"
          >
            Reset
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          {hasActiveFilters && (
            <span className="text-xs text-muted-foreground font-medium">
              {filtered.length} of {incidents.length} incidents
            </span>
          )}
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#d66a06] text-white text-sm font-semibold hover:bg-[#b85505] transition-colors"
          >
            <Plus size={15} />
            Add Incident
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-225">
            <thead>
              <tr>
                <SortTH col="date" activeCol={sortCol} dir={sortDir} onSort={handleSort}>Date</SortTH>
                <SortTH col="product" activeCol={sortCol} dir={sortDir} onSort={handleSort}>Product</SortTH>
                <th className={TH}>Function</th>
                <SortTH col="severity" activeCol={sortCol} dir={sortDir} onSort={handleSort}>Severity</SortTH>
                <SortTH col="title" activeCol={sortCol} dir={sortDir} onSort={handleSort}>Incident</SortTH>
                <SortTH col="outage" activeCol={sortCol} dir={sortDir} onSort={handleSort}>Outage (HH:MM)</SortTH>
                <SortTH col="downtime" activeCol={sortCol} dir={sortDir} onSort={handleSort}>Downtime (HH:MM)</SortTH>
                <th className={TH}>Cause</th>
                <th className={TH}>Ownership</th>
                <th className={TH}>Alert</th>
                <th className={TH}></th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No incidents match your filters.
                  </td>
                </tr>
              ) : (
                pageRows.map((d, i) => (
                  <tr key={d.id ?? i} className="hover:bg-secondary/40 transition-colors">
                    <td className={TD + " tabular-nums text-xs font-medium text-muted-foreground whitespace-nowrap"}>{new Date(d.date).toLocaleDateString()}</td>
                    <td className={TD + " font-semibold max-w-40"}>{d.product}</td>
                    <td className={TD + " text-muted-foreground text-xs max-w-28"}>{d.function || "-"}</td>
                    <td className={TD}><span className={SEV_CLASS[d.severity]}>{d.severity}</span></td>
                    <td className={TD + " max-w-64 text-sm"}>{d.title}</td>
                    <td className={TD + " tabular-nums text-xs font-medium whitespace-nowrap"}>{formatMinutes(d.outage)}</td>
                    <td className={TD + " tabular-nums text-xs font-medium whitespace-nowrap"}>{formatMinutes(d.downtime)}</td>
                    <td className={TD + " text-muted-foreground text-xs max-w-36"}>{d.cause || "-"}</td>
                    <td className={TD}><span className={d.dasCaused ? CHIP.internal : CHIP.external}>{d.dasCaused ? "Internal" : "External"}</span></td>
                    <td className={TD}><span className={d.alerted ? CHIP.yes : CHIP.no}>{d.alerted ? "Yes" : "No"}</span></td>
                    <td className={TD}>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(d)}
                          className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(d)}
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="border border-border rounded px-1.5 py-1 text-xs bg-background text-foreground focus:outline-none"
            >
              {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span>
              {sorted.length === 0 ? "0" : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, sorted.length)}`} of {sorted.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1 rounded hover:bg-secondary disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1 rounded hover:bg-secondary disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit/Add modal */}
      <IncidentModal open={modalOpen} onClose={closeModal} editing={editingIncident} />

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-bold text-foreground mb-2">Delete Incident?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              <span className="font-semibold text-foreground">{confirmDelete.title}</span> will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleteIncident.isPending}
                className="px-4 py-2 rounded-lg bg-destructive text-white text-sm font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {deleteIncident.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

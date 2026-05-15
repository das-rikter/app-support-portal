"use client";

import { formatMinutes, parseOutageHrs } from "@/lib/incidentUtils";
import { useIncidentStore } from "@/store/useIncidentStore";
import type { Incident } from "@/types/incident";
import { useMemo, useState } from "react";

const TH =
  "sticky top-0 z-[2] px-[14px] py-[10px] text-[11px] uppercase tracking-[0.08em] text-muted-foreground font-bold text-left border-b border-border whitespace-nowrap select-none bg-secondary";
const TD = "px-[14px] py-3 border-b border-border text-[13px] align-middle";

const SEV_CLASS: Record<string, string> = {
  P1: "inline-flex px-[9px] py-[3px] rounded-full text-[11px] font-extrabold tracking-[0.04em] bg-[rgba(220,38,38,0.12)] text-[#dc2626] dark:bg-[rgba(220,38,38,0.18)]",
  P2: "inline-flex px-[9px] py-[3px] rounded-full text-[11px] font-extrabold tracking-[0.04em] bg-[rgba(217,119,6,0.12)] text-[#d97706] dark:bg-[rgba(217,119,6,0.18)]",
  P3: "inline-flex px-[9px] py-[3px] rounded-full text-[11px] font-extrabold tracking-[0.04em] bg-[rgba(59,130,246,0.12)] text-[#3b82f6] dark:bg-[rgba(59,130,246,0.18)]",
  P4: "inline-flex px-[9px] py-[3px] rounded-full text-[11px] font-extrabold tracking-[0.04em] bg-[rgba(22,163,74,0.12)] text-[#16a34a] dark:bg-[rgba(22,163,74,0.18)]",
};

const CHIP: Record<string, string> = {
  internal: "inline-flex px-[9px] py-[3px] rounded-full text-[11px] font-bold bg-[rgba(214,106,6,0.10)] text-[#d66a06] dark:bg-[rgba(214,106,6,0.18)]",
  external: "inline-flex px-[9px] py-[3px] rounded-full text-[11px] font-bold bg-[rgba(59,130,246,0.12)] text-[#3b82f6] dark:bg-[rgba(59,130,246,0.18)]",
  yes: "inline-flex px-[9px] py-[3px] rounded-full text-[11px] font-bold bg-[rgba(22,163,74,0.12)] text-[#16a34a] dark:bg-[rgba(22,163,74,0.18)]",
  no: "inline-flex px-[9px] py-[3px] rounded-full text-[11px] font-bold bg-[rgba(107,114,128,0.12)] text-muted-foreground",
};

const controlCls =
  "border border-border rounded-lg px-2 py-1.5 text-xs cursor-pointer focus:outline-none bg-secondary text-foreground";

export function IncidentsView() {
  const filtered = useIncidentStore((s) => s.filtered) as Incident[];
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<"date" | "product" | "severity" | "downtime">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    let r = filtered.filter(
      (d) =>
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.product.toLowerCase().includes(q) ||
        d.function.toLowerCase().includes(q) ||
        (d.cause || "").toLowerCase().includes(q)
    );
    r = [...r].sort((a, b) => {
      let va: number | string | Date, vb: number | string | Date;
      if (sortCol === "date") {
        va = new Date(a.date);
        vb = new Date(b.date);
      } else if (sortCol === "product") {
        va = a.product;
        vb = b.product;
      } else if (sortCol === "severity") {
        va = ["P1", "P2", "P3", "P4"].indexOf(a.severity);
        vb = ["P1", "P2", "P3", "P4"].indexOf(b.severity);
      } else {
        va = parseOutageHrs(a.downtime);
        vb = parseOutageHrs(b.downtime);
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return r;
  }, [filtered, search, sortCol, sortDir]);

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
      <div className="flex justify-between items-center px-5 pt-4 pb-3 gap-3">
        <div>
          <div className="text-sm font-bold text-foreground">All Incidents</div>
          <div className="text-xs mt-0.5 text-muted-foreground">Full incident log with search and filters</div>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search incidents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-border rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:border-[#d66a06] bg-secondary text-foreground"
          />
          <select
            value={sortCol}
            onChange={(e) => setSortCol(e.target.value as typeof sortCol)}
            className={controlCls}
          >
            <option value="date">Sort: Date</option>
            <option value="product">Sort: Product</option>
            <option value="severity">Sort: Severity</option>
            <option value="downtime">Sort: Downtime hrs</option>
          </select>
          <select
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
            className={controlCls}
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </div>

      <div className="max-h-120 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={TH}>Date</th>
              <th className={TH}>Product</th>
              <th className={TH}>Function</th>
              <th className={TH}>Sev</th>
              <th className={TH}>Incident</th>
              <th className={TH}>Outage</th>
              <th className={TH}>Cause</th>
              <th className={TH}>Ownership</th>
              <th className={TH}>Alert</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d, i) => (
              <tr key={d.id ?? i} className="hover:bg-secondary/50">
                <td className={TD + " tabular-nums text-xs font-medium text-muted-foreground whitespace-nowrap"}>{d.date}</td>
                <td className={TD + " font-semibold"}>{d.product}</td>
                <td className={TD + " text-muted-foreground text-xs"}>{d.function}</td>
                <td className={TD}><span className={SEV_CLASS[d.severity]}>{d.severity}</span></td>
                <td className={TD + " max-w-60"}>{d.title}</td>
                <td className={TD + " tabular-nums text-xs font-medium"}>{formatMinutes(d.downtime)}</td>
                <td className={TD + " text-muted-foreground text-xs"}>{d.cause || "-"}</td>
                <td className={TD}><span className={d.dasCaused ? CHIP.internal : CHIP.external}>{d.dasCaused ? "Internal" : "External"}</span></td>
                <td className={TD}><span className={d.alerted ? CHIP.yes : CHIP.no}>{d.alerted ? "Yes" : "No"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between px-5 py-2.5 text-xs border-t border-border text-muted-foreground">
        <span>{rows.length} incidents shown</span>
        <span>DAS Incident Log</span>
      </div>
    </div>
  );
}

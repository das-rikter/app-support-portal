"use client";

import { GROUPED_MONITOR_NAMES, MONITOR_GROUPS } from "@/lib/monitorGroups";
import type { DayStatus } from "@/lib/monitorGroups";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ChevronDown, ExternalLink, RefreshCw, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

interface Monitor {
  id: string;
  name: string;
  url: string;
  status: string;
  lastCheckedAt: string | null;
  availability: string;
}

type HistoryMap = Record<string, DayStatus[]>;

const statusInfo = (status: string) => {
  switch (status) {
    case "up":
      return { label: "Online", color: "text-[#16a34a]", bg: "bg-[rgba(22,163,74,0.12)] dark:bg-[rgba(22,163,74,0.18)]", dot: "bg-[#16a34a]" };
    case "down":
      return { label: "Offline", color: "text-[#dc2626]", bg: "bg-[rgba(220,38,38,0.12)] dark:bg-[rgba(220,38,38,0.18)]", dot: "bg-[#dc2626]" };
    case "maintenance":
      return { label: "Maintenance", color: "text-[#d97706]", bg: "bg-[rgba(217,119,6,0.12)] dark:bg-[rgba(217,119,6,0.18)]", dot: "bg-[#d97706]" };
    case "paused":
      return { label: "Paused", color: "text-muted-foreground", bg: "bg-[rgba(107,114,128,0.12)]", dot: "bg-muted-foreground" };
    default:
      return { label: "Checking…", color: "text-muted-foreground", bg: "bg-[rgba(107,114,128,0.08)]", dot: "bg-muted-foreground animate-pulse" };
  }
};

function HistoryBars({ history }: { history?: DayStatus[] }) {
  if (!history) {
    return (
      <div className="hidden sm:flex items-end gap-px">
        {Array.from({ length: 45 }).map((_, i) => (
          <span key={i} className="inline-block h-4 w-0.75 rounded-sm bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="hidden sm:flex items-end gap-px" title="45-day uptime history (oldest → newest)">
      {history.map((day) => (
        <span
          key={day.date}
          title={`${new Date(day.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}: ${day.status}`}
          className={`inline-block h-4 w-0.75 rounded-sm ${day.status === "up"
              ? "bg-[#16a34a]"
              : day.status === "down"
                ? "bg-[#dc2626]"
                : day.status === "maintenance"
                  ? "bg-[#d97706]"
                  : "bg-muted"
            }`}
        />
      ))}
    </div>
  );
}

function MonitorRow({ monitor, history }: { monitor: Monitor; history?: DayStatus[] }) {
  const info = statusInfo(monitor.status);
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/50 transition-colors group gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${info.dot}`} />
        <span className="text-sm text-foreground truncate">{monitor.name}</span>
        {monitor.url && (
          <a
            href={monitor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
          >
            <ExternalLink size={11} />
          </a>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <HistoryBars history={history} />
        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${info.color} ${info.bg}`}>
          {info.label}
        </span>
      </div>
    </div>
  );
}

function GroupCard({ group, monitors, history }: {
  group: { name: string; monitors: string[] };
  monitors: Monitor[];
  history: HistoryMap | undefined;
}) {
  const byName = new Map(monitors.map((m) => [m.name.toLowerCase(), m]));
  const groupMonitors = group.monitors.map(
    (name) =>
      byName.get(name.toLowerCase()) ?? {
        id: name,
        name,
        url: "",
        status: "pending",
        lastCheckedAt: null,
        availability: "",
      }
  );

  const active = groupMonitors.filter((m) => m.status !== "paused");
  const anyDown = active.some((m) => m.status === "down");
  const anyMaint = active.some((m) => m.status === "maintenance");
  const allUp = active.length > 0 && active.every((m) => m.status === "up");
  const groupStatus = anyDown ? "down" : anyMaint ? "maintenance" : allUp ? "up" : "pending";
  const info = statusInfo(groupStatus);

  const [isOpen, setIsOpen] = useState(!allUp);

  return (
    <div className="border border-border rounded-2xl bg-card shadow-xs overflow-hidden">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 bg-secondary/50 hover:bg-secondary/70 transition-colors${isOpen ? " border-b border-border" : ""}`}
      >
        <h3 className="text-sm font-semibold text-foreground">{group.name}</h3>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${info.color} ${info.bg}`}>
            {allUp && <CheckCircle2 size={11} />}
            {anyDown && <XCircle size={11} />}
            {!allUp && !anyDown && <AlertTriangle size={11} />}
            {info.label}
          </span>
          <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200${isOpen ? " rotate-180" : ""}`} />
        </div>
      </button>
      {isOpen && (
        <div className="px-1 py-1">
          {groupMonitors.map((m) => (
            <MonitorRow
              key={`${group.name}-${m.name}`}
              monitor={m}
              history={history?.[m.name.toLowerCase()]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function StatusPage() {
  const { data: monitors, isLoading, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["betterstack-monitors"],
    queryFn: async (): Promise<Monitor[]> => {
      const res = await fetch("/api/betterstack/monitors");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const today = new Date().toISOString().slice(0, 10);
  const { data: history } = useQuery({
    queryKey: ["betterstack-history", today],
    queryFn: async (): Promise<HistoryMap> => {
      const res = await fetch("/api/betterstack/history");
      if (!res.ok) return {};
      return res.json();
    },
    staleTime: Infinity,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  const groupedMonitors = useMemo(
    () => monitors?.filter((m) => GROUPED_MONITOR_NAMES.has(m.name.toLowerCase())),
    [monitors]
  );
  const activeMonitors = useMemo(
    () => groupedMonitors?.filter((m) => m.status !== "paused"),
    [groupedMonitors]
  );
  const allUp = useMemo(
    () => !!activeMonitors && activeMonitors.length > 0 && activeMonitors.every((m) => m.status === "up"),
    [activeMonitors]
  );
  const anyDown = useMemo(() => activeMonitors?.some((m) => m.status === "down"), [activeMonitors]);
  const lastUpdated = useMemo(() => (dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null), [dataUpdatedAt]);

  return (
    <div className="space-y-6 pt-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-9 w-9 rounded-full bg-secondary animate-pulse" />
          ) : anyDown ? (
            <div className="h-9 w-9 rounded-full flex items-center justify-center bg-[rgba(220,38,38,0.12)]">
              <XCircle size={20} className="text-[#dc2626]" />
            </div>
          ) : (
            <div className="h-9 w-9 rounded-full flex items-center justify-center bg-[rgba(22,163,74,0.12)]">
              <CheckCircle2 size={20} className="text-[#16a34a]" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {isLoading
                ? "Checking status…"
                : anyDown
                  ? "Service Disruption Detected"
                  : allUp
                    ? "All Systems Online"
                    : "Status Overview"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Real-time status for DAS Technology services
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 mt-1">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground hidden sm:block">Updated {lastUpdated}</span>
          )}
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
          <a
            href="https://status.digitalairstrike.io"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors"
          >
            <ExternalLink size={12} />
            Public Status
          </a>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load monitor status"}
        </div>
      )}

      {/* Summary bar */}
      {groupedMonitors && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {[
            { label: "Online", status: "up", color: "text-[#16a34a]" },
            { label: "Offline", status: "down", color: "text-[#dc2626]" },
            { label: "Maintenance", status: "maintenance", color: "text-[#d97706]" },
            { label: "Paused", status: "paused", color: "text-muted-foreground" },
          ].map(({ label, status, color }) => {
            const count = groupedMonitors.filter((m) => m.status === status).length;
            if (count === 0) return null;
            return (
              <div key={status} className="flex items-center gap-1.5">
                <span className={`font-bold tabular-nums ${color}`}>{count}</span>
                <span className="text-muted-foreground">{label}</span>
              </div>
            );
          })}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="font-bold tabular-nums text-foreground">{groupedMonitors.length}</span>
            <span className="text-muted-foreground">total monitors</span>
          </div>
        </div>
      )}

      {/* Groups grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-border rounded-2xl bg-card h-40 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {MONITOR_GROUPS.map((group) => (
            <GroupCard key={group.name} group={group} monitors={monitors ?? []} history={history} />
          ))}
        </div>
      )}
    </div>
  );
}

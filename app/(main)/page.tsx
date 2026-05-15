"use client";

import type { DayStatus, MonitorGroup } from "@/lib/monitorGroups";
import { GROUPED_MONITOR_NAMES, MONITOR_GROUPS, getMonitorDisplayName, normalizeMonitorName } from "@/lib/monitorGroups";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface Monitor {
  id: string;
  name: string;
  url: string;
  status: string;
  lastCheckedAt: string | null;
  availability: string;
}

type HistoryMap = Record<string, DayStatus[]>;
type DayStatusAgg = "up" | "degraded" | "down" | "maintenance" | "unknown";

const COLS = 7;

function computeGroupDayStatus(
  group: MonitorGroup,
  history: HistoryMap | undefined,
  date: string
): DayStatusAgg {
  if (!history) return "unknown";
  const statuses = group.monitors
    .map((entry) => history[normalizeMonitorName(entry.betterStackName)]?.find((d) => d.date === date)?.status)
    .filter((s): s is "up" | "down" | "maintenance" => s !== undefined);
  if (statuses.length === 0) return "unknown";
  if (statuses.some((s) => s === "down"))
    return statuses.some((s) => s === "up") ? "degraded" : "down";
  if (statuses.some((s) => s === "maintenance")) return "maintenance";
  return "up";
}

function DayIcon({ status, size = 18 }: { status: DayStatusAgg; size?: number }) {
  switch (status) {
    case "up":
      return <CheckCircle2 size={size} className="text-[#16a34a] mx-auto" />;
    case "down":
      return <XCircle size={size} className="text-[#dc2626] mx-auto" />;
    case "degraded":
      return <AlertTriangle size={size} className="text-[#d97706] mx-auto" />;
    case "maintenance":
      return (
        <div
          className="rounded-full bg-[#3b82f6] flex items-center justify-center mx-auto"
          style={{ width: size, height: size }}
        >
          <span className="text-white font-bold leading-none" style={{ fontSize: Math.round(size * 0.55) }}>
            i
          </span>
        </div>
      );
    default:
      return <span className="text-muted-foreground/30 text-sm block text-center">–</span>;
  }
}

function formatDateLabel(date: string): string {
  return new Date(date + "T12:00:00Z").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatElapsed(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d} day${d !== 1 ? "s" : ""}`);
  if (h > 0 || d > 0) parts.push(`${h} hour${h !== 1 ? "s" : ""}`);
  if (m > 0 || h > 0 || d > 0) parts.push(`${m} minute${m !== 1 ? "s" : ""}`);
  parts.push(`${s} second${s !== 1 ? "s" : ""}`);
  if (parts.length === 1) return parts[0];
  return parts.slice(0, -1).join(", ") + ", and " + parts[parts.length - 1];
}

function GroupStatusRows({
  group,
  monitors,
  history,
  visibleDates,
  defaultExpanded,
}: {
  group: MonitorGroup;
  monitors: Monitor[];
  history: HistoryMap | undefined;
  visibleDates: string[];
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const byName = useMemo(
    () => new Map(monitors.map((m) => [normalizeMonitorName(m.name), m])),
    [monitors]
  );

  return (
    <>
      <tr
        className="bg-card hover:bg-secondary/40 cursor-pointer transition-colors border-b border-border"
        onClick={() => setExpanded((e) => !e)}
      >
        <td className="sticky left-0 z-1 bg-inherit px-4 py-3 min-w-60">
          <div className="flex items-center gap-2">
            <ChevronRight
              size={13}
              className={`text-muted-foreground shrink-0 transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
            />
            <span className="text-sm font-semibold text-foreground leading-snug">{group.name}</span>
          </div>
        </td>
        <td className="w-9" />
        {visibleDates.map((date) => (
          <td key={date} className="w-18 text-center px-1 py-3">
            <DayIcon status={computeGroupDayStatus(group, history, date)} />
          </td>
        ))}
        <td className="w-9" />
      </tr>

      {expanded &&
        group.monitors.map((entry) => {
          const monitor = byName.get(normalizeMonitorName(entry.betterStackName));
          return (
            <tr key={entry.betterStackName} className="bg-secondary/20 border-b border-border/50">
              <td className="sticky left-0 z-1 bg-secondary/20 px-4 py-2">
                <div className="flex items-center gap-1.5 pl-7">
                  <span className="text-xs text-muted-foreground">{getMonitorDisplayName(entry)}</span>
                  {monitor?.url && (
                    <a
                      href={monitor.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground/40 hover:text-muted-foreground"
                    >
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </td>
              <td className="w-9" />
              {visibleDates.map((date) => {
                const monHistory = history?.[normalizeMonitorName(entry.betterStackName)];
                const dayStatus = (monHistory?.find((d) => d.date === date)?.status ?? "unknown") as DayStatusAgg;
                return (
                  <td key={date} className="w-18 text-center px-1 py-2">
                    <DayIcon status={dayStatus} size={15} />
                  </td>
                );
              })}
              <td className="w-9" />
            </tr>
          );
        })}
    </>
  );
}

export default function StatusPage() {
  const {
    data: monitors,
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
  } = useQuery({
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
      const res = await fetch("/api/betterstack/history", { cache: "no-cache" });
      if (!res.ok) return {};
      return res.json();
    },
    staleTime: Infinity,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  const groupedMonitors = useMemo(
    () => monitors?.filter((m) => GROUPED_MONITOR_NAMES.has(normalizeMonitorName(m.name))),
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
  const anyMaint = useMemo(
    () => !anyDown && activeMonitors?.some((m) => m.status === "maintenance"),
    [activeMonitors, anyDown]
  );
  const lastUpdated = useMemo(
    () => (dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null),
    [dataUpdatedAt]
  );

  // ── Date navigation ──
  const [dateOffset, setDateOffset] = useState(0);

  const allHistoryDates = useMemo(() => {
    const dates = new Set<string>();
    dates.add(today);
    if (history) {
      Object.values(history).forEach((days) => days.forEach((d) => dates.add(d.date)));
    }
    return [...dates].sort().reverse(); // newest first (index 0 = today)
  }, [history, today]);

  const visibleDates = useMemo(
    () => allHistoryDates.slice(dateOffset, dateOffset + COLS).reverse(), // oldest left → newest right
    [allHistoryDates, dateOffset]
  );

  const canGoPrev = dateOffset + COLS < allHistoryDates.length; // go to older dates
  const canGoNext = dateOffset > 0; // go to newer dates

  // ── Status duration timer ──
  const statusSince = useMemo(() => {
    if (!history || !allUp) return new Date();
    const histDates = [
      ...new Set(Object.values(history).flatMap((days) => days.map((d) => d.date))),
    ].sort().reverse();

    let lastBadDate: string | null = null;
    for (const date of histDates) {
      const anyBad = Object.values(history).some((days) => {
        const d = days.find((x) => x.date === date);
        return d && d.status !== "up";
      });
      if (anyBad) { lastBadDate = date; break; }
    }

    if (!lastBadDate) {
      const oldest = histDates[histDates.length - 1];
      return oldest ? new Date(oldest + "T00:00:00Z") : new Date();
    }
    const since = new Date(lastBadDate + "T00:00:00Z");
    since.setDate(since.getDate() + 1);
    return since;
  }, [history, allUp]);

  const [elapsedSecs, setElapsedSecs] = useState(0);
  useEffect(() => {
    const update = () =>
      setElapsedSecs(Math.max(0, Math.floor((Date.now() - statusSince.getTime()) / 1000)));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [statusSince]);

  // ── Default expanded state per group (expand if any monitor is down/maintenance) ──
  const groupDefaultExpanded = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const group of MONITOR_GROUPS) {
      if (!monitors) { map.set(group.name, false); continue; }
      const groupMonitors = group.monitors
        .map((entry) =>
          monitors.find((m) => normalizeMonitorName(m.name) === normalizeMonitorName(entry.betterStackName))
        )
        .filter((m): m is Monitor => !!m && m.status !== "paused");
      map.set(
        group.name,
        groupMonitors.some((m) => m.status === "down" || m.status === "maintenance")
      );
    }
    return map;
  }, [monitors]);

  const navBtnCls =
    "h-full w-full flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-default transition-colors py-3 px-2";
  const actionBtnCls =
    "flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/70 transition-colors disabled:opacity-50";

  return (
    <div className="space-y-4 pt-6 pb-10">
      {/* ── Current Status Card ── */}
      <div className="border border-border rounded-2xl bg-card shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-sm font-bold text-foreground">Current Status</h2>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground hidden sm:block">
                Updated {lastUpdated}
              </span>
            )}
            <button onClick={() => refetch()} disabled={isLoading} className={actionBtnCls}>
              <RefreshCw size={11} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </button>
            <a
              href="https://status.digitalairstrike.io"
              target="_blank"
              rel="noopener noreferrer"
              className={actionBtnCls}
            >
              <ExternalLink size={11} />
              Public Status
            </a>
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="flex items-start gap-3">
            {isLoading ? (
              <div className="h-7 w-7 rounded-full bg-secondary animate-pulse shrink-0 mt-0.5" />
            ) : anyDown ? (
              <XCircle size={26} className="text-[#dc2626] shrink-0 mt-0.5" />
            ) : anyMaint ? (
              <div className="h-6.5 w-6.5 rounded-full bg-[#3b82f6] flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-white font-bold text-sm leading-none">i</span>
              </div>
            ) : allUp ? (
              <CheckCircle2 size={26} className="text-[#16a34a] shrink-0 mt-0.5" />
            ) : (
              <div className="h-6.5 w-6.5 rounded-full bg-secondary animate-pulse shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xl font-bold text-foreground leading-tight">
                {isLoading
                  ? "Checking status…"
                  : anyDown
                    ? "Disruption Detected"
                    : anyMaint
                      ? "Maintenance in Progress"
                      : allUp
                        ? "Normal"
                        : "Status Overview"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {!isLoading && allUp && elapsedSecs > 0
                  ? `Current status in effect for ${formatElapsed(elapsedSecs)}.`
                  : !isLoading && anyDown
                    ? "One or more services are currently experiencing issues."
                    : !isLoading && anyMaint
                      ? "Scheduled maintenance is currently in progress."
                      : !isLoading
                        ? "Real-time status for DAS Technology services."
                        : "Fetching live status from monitoring systems…"}
              </p>
            </div>
          </div>

          {groupedMonitors && groupedMonitors.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-4 pt-4 border-t border-border text-sm">
              {(
                [
                  { label: "Online", status: "up", color: "text-[#16a34a]" },
                  { label: "Offline", status: "down", color: "text-[#dc2626]" },
                  { label: "Maintenance", status: "maintenance", color: "text-[#d97706]" },
                  { label: "Paused", status: "paused", color: "text-muted-foreground" },
                ] as const
              ).map(({ label, status, color }) => {
                const count = groupedMonitors.filter((m) => m.status === status).length;
                return (
                  <div key={status} className="flex items-center gap-1.5">
                    <span className={`font-bold tabular-nums ${color}`}>{count}</span>
                    <span className="text-muted-foreground">{label}</span>
                  </div>
                );
              })}
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="font-bold tabular-nums text-foreground">{groupedMonitors.length}</span>
                <span className="text-muted-foreground">monitors</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load monitor status"}
        </div>
      )}

      {/* ── Status Grid Card ── */}
      <div className="border border-border rounded-2xl bg-card shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h2 className="text-sm font-bold text-foreground">Status Grid</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-secondary/40 border-b border-border">
                <th className="sticky left-0 z-2 bg-secondary/40 text-left px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground min-w-60 whitespace-nowrap">
                  Product
                </th>
                {/* Prev (older) */}
                <th className="w-9 p-0">
                  <button
                    onClick={() => setDateOffset((o) => Math.min(allHistoryDates.length - COLS, o + COLS))}
                    disabled={!canGoPrev}
                    className={navBtnCls}
                    title="Older dates"
                  >
                    <ChevronLeft size={14} />
                  </button>
                </th>
                {/* Date headers */}
                {visibleDates.length > 0
                  ? visibleDates.map((date) => (
                    <th
                      key={date}
                      className={`w-18 text-center px-1 py-3 text-xs font-semibold whitespace-nowrap ${date === today ? "text-[#d66a06]" : "text-foreground"
                        }`}
                    >
                      {date === today ? "Today" : formatDateLabel(date)}
                    </th>
                  ))
                  : Array.from({ length: COLS }).map((_, i) => (
                    <th key={i} className="w-18 text-center px-1 py-3">
                      <div className="h-3 w-10 bg-secondary animate-pulse rounded mx-auto" />
                    </th>
                  ))}
                {/* Next (newer) */}
                <th className="w-9 p-0">
                  <button
                    onClick={() => setDateOffset((o) => Math.max(0, o - COLS))}
                    disabled={!canGoNext}
                    className={navBtnCls}
                    title="Newer dates"
                  >
                    <ChevronRight size={14} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: MONITOR_GROUPS.length }).map((_, i) => (
                  <tr key={i} className="bg-card border-b border-border">
                    <td className="sticky left-0 bg-inherit px-4 py-3">
                      <div className="h-4 w-44 bg-secondary animate-pulse rounded" />
                    </td>
                    <td />
                    {Array.from({ length: COLS }).map((_, j) => (
                      <td key={j} className="text-center px-1 py-3">
                        <div className="h-4.5 w-4.5 bg-secondary animate-pulse rounded-full mx-auto" />
                      </td>
                    ))}
                    <td />
                  </tr>
                ))
                : MONITOR_GROUPS.map((group) => (
                  <GroupStatusRows
                    key={group.name}
                    group={group}
                    monitors={monitors ?? []}
                    history={history}
                    visibleDates={visibleDates}
                    defaultExpanded={groupDefaultExpanded.get(group.name) ?? false}
                  />
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

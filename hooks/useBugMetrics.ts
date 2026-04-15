import { useMemo } from 'react';
import type { Bug, BugMetrics } from '@/types/bug-report';

export function useBugMetrics(bugs: Bug[]): BugMetrics {
  return useMemo(() => {
    if (!bugs.length) {
      return { total: 0, active: 0, backlog: 0, avgAge: 0, maxAge: 0, highPrio: 0, blocked: 0, projCount: 0 };
    }
    const now = Date.now();
    const ages = bugs.map((b) => {
      const d = new Date(b.created);
      return isNaN(d.getTime()) ? 0 : Math.floor((now - d.getTime()) / 86400000);
    });
    const total = bugs.length;
    const backlog = bugs.filter((b) => b.status === 'Backlog').length;
    const active = total - backlog;
    const highPrio = bugs.filter((b) => b.priority === 'High' || b.priority === 'Highest').length;
    const blocked = bugs.filter(
      (b) => b.status === 'Blocked' || b.status === 'Waiting for dependencies'
    ).length;
    const avgAge = Math.round(ages.reduce((a, b) => a + b, 0) / ages.length);
    const maxAge = Math.max(...ages);
    const projCount = new Set(bugs.map((b) => b.project)).size;
    return { total, active, backlog, avgAge, maxAge, highPrio, blocked, projCount };
  }, [bugs]);
}

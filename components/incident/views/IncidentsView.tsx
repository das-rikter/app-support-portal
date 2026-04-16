"use client";

import { useMemo, useState } from 'react';
import { useIncidentStore } from '@/store/useIncidentStore';
import { parseOutageHrs } from '@/lib/incidentUtils';

export function IncidentsView() {
  const filtered = useIncidentStore((s) => s.filtered);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<'date' | 'product' | 'severity' | 'outage'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    let r = filtered.filter(
      (d) =>
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.product.toLowerCase().includes(q) ||
        d.fn.toLowerCase().includes(q) ||
        (d.cause || '').toLowerCase().includes(q)
    );
    r = [...r].sort((a, b) => {
      let va: number | string | Date, vb: number | string | Date;
      if (sortCol === 'date') { va = new Date(a.date); vb = new Date(b.date); }
      else if (sortCol === 'product') { va = a.product; vb = b.product; }
      else if (sortCol === 'severity') { va = ['P1', 'P2', 'P3', 'P4'].indexOf(a.sev); vb = ['P1', 'P2', 'P3', 'P4'].indexOf(b.sev); }
      else { va = parseOutageHrs(a.outage); vb = parseOutageHrs(b.outage); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return r;
  }, [filtered, search, sortCol, sortDir]);

  const sevClass: Record<string, string> = {
    P1: 'id-sev id-sev-p1', P2: 'id-sev id-sev-p2', P3: 'id-sev id-sev-p3', P4: 'id-sev id-sev-p4',
  };

  return (
    <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--id-border)', boxShadow: 'var(--id-shadow-sm)' }}>
      <div className="flex justify-between items-center px-5 pt-4 pb-3 gap-3">
        <div>
          <div className="text-sm font-bold" style={{ color: 'var(--id-text)' }}>All Incidents</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--id-muted)' }}>Full incident log with search and filters</div>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search incidents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:border-[#d66a06]"
            style={{ borderColor: 'var(--id-border)', background: 'var(--id-surface2)', color: 'var(--id-text)' }}
          />
          <select
            value={sortCol}
            onChange={(e) => setSortCol(e.target.value as typeof sortCol)}
            className="border rounded-lg px-2 py-1.5 text-xs cursor-pointer focus:outline-none"
            style={{ borderColor: 'var(--id-border)', background: 'var(--id-surface)', color: 'var(--id-text)' }}
          >
            <option value="date">Sort: Date</option>
            <option value="product">Sort: Product</option>
            <option value="severity">Sort: Severity</option>
            <option value="outage">Sort: Outage hrs</option>
          </select>
          <select
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}
            className="border rounded-lg px-2 py-1.5 text-xs cursor-pointer focus:outline-none"
            style={{ borderColor: 'var(--id-border)', background: 'var(--id-surface)', color: 'var(--id-text)' }}
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </div>

      <div className="id-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>Function</th>
              <th>Sev</th>
              <th>Incident</th>
              <th>Outage</th>
              <th>Cause</th>
              <th>Ownership</th>
              <th>Alert</th>
              <th>Reoccurring</th>
              <th>Postmortem</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d, i) => (
              <tr key={i}>
                <td className="id-outage-dur" style={{ whiteSpace: 'nowrap', color: 'var(--id-muted)' }}>{d.date}</td>
                <td style={{ fontWeight: 600, fontSize: 13 }}>{d.product}</td>
                <td style={{ color: 'var(--id-muted)', fontSize: 12 }}>{d.fn}</td>
                <td><span className={sevClass[d.sev]}>{d.sev}</span></td>
                <td style={{ maxWidth: 240, fontSize: 13 }}>{d.title}</td>
                <td className="id-outage-dur">{d.outage || '—'}</td>
                <td style={{ color: 'var(--id-muted)', fontSize: 12 }}>{d.cause || '—'}</td>
                <td><span className={d.dasCaused ? 'id-chip id-chip-internal' : 'id-chip id-chip-external'}>{d.dasCaused ? 'Internal' : 'External'}</span></td>
                <td><span className={d.alerted ? 'id-chip id-chip-yes' : 'id-chip id-chip-no'}>{d.alerted ? 'Yes' : 'No'}</span></td>
                <td><span className={d.reoccurring ? 'id-chip id-chip-yes' : 'id-chip id-chip-no'}>{d.reoccurring ? 'Yes' : 'No'}</span></td>
                <td><span className={d.postmortem === 'Yes' ? 'id-chip id-chip-yes' : d.postmortem === 'N/A' ? 'id-chip id-chip-na' : 'id-chip id-chip-no'}>{d.postmortem || '—'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between px-5 py-2.5 text-xs border-t" style={{ borderColor: 'var(--id-border)', color: 'var(--id-muted)' }}>
        <span>{rows.length} incidents shown</span>
        <span>DAS Incident Log · 2025</span>
      </div>
    </div>
  );
}

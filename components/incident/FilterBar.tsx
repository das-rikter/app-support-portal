"use client";

import { useState, useEffect } from 'react';
import { Moon, Sun, CheckCircle2, FileText } from 'lucide-react';
import { parseIncidentsCSV } from '@/lib/csvParser';
import { getMonths, getProducts } from '@/lib/incidentUtils';
import { useIncidentStore } from '@/store/useIncidentStore';
import type { Incident } from '@/types/incident';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const SEV_LABELS: Record<string, string> = {
  P1: 'Critical', P2: 'High', P3: 'Medium', P4: 'Low',
};

const SEV_COLORS: Record<string, string> = {
  P1: '#ef4444', P2: '#f97316', P3: '#eab308', P4: '#6b7280',
};

function buildSummary(incidents: Incident[]) {
  const sevCounts = { P1: 0, P2: 0, P3: 0, P4: 0 };
  const monthSet = new Set<string>();
  const productSet = new Set<string>();
  for (const inc of incidents) {
    if (inc.sev in sevCounts) sevCounts[inc.sev as keyof typeof sevCounts]++;
    monthSet.add(inc.month);
    productSet.add(inc.product);
  }
  return { sevCounts, months: [...monthSet], products: [...productSet] };
}

export function FilterBar() {
  const filters = useIncidentStore((s) => s.filters);
  const filtered = useIncidentStore((s) => s.filtered);
  const incidents = useIncidentStore((s) => s.incidents);
  const setFilters = useIncidentStore((s) => s.setFilters);
  const resetFilters = useIncidentStore((s) => s.resetFilters);
  const setIncidents = useIncidentStore((s) => s.setIncidents);

  const [pending, setPending] = useState<Incident[] | null>(null);
  const [pendingName, setPendingName] = useState('');
  const [dialogState, setDialogState] = useState<'closed' | 'verify' | 'success' | 'error'>('closed');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedMode);
    updateDarkMode(savedMode);
  }, []);

  const updateDarkMode = (dark: boolean) => {
    const html = document.documentElement;
    if (dark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    localStorage.setItem('darkMode', dark.toString());
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    updateDarkMode(newMode);
  };

  const ALL_MONTHS = getMonths(incidents);
  const ALL_PRODUCTS = getProducts(incidents);
  const hasFilters = filters.month || filters.product || filters.severity || filters.ownership;

  const selectClass =
    'border border-sidebar-border rounded-md px-3 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:border-[#d66a06] cursor-pointer';

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseIncidentsCSV(text);
        setPending(parsed);
        setPendingName(file.name);
        setUploadError(null);
        setDialogState('verify');
        event.target.value = '';
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        setUploadError(message);
        setPending(null);
        setDialogState('error');
      }
    };
    reader.onerror = () => {
      setUploadError('Error reading file.');
      setPending(null);
      setDialogState('error');
    };
    reader.readAsText(file);
  };

  const handleConfirm = () => {
    if (!pending) return;
    setIncidents(pending);
    setDialogState('success');
  };

  const handleClose = () => {
    setDialogState('closed');
    if (dialogState !== 'success') setPending(null);
  };

  const summary = pending ? buildSummary(pending) : null;

  return (
    <div className="flex flex-wrap gap-3 mb-4 items-center mt-6 justify-between">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Month</span>
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
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Product</span>
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
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Severity</span>
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
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Ownership</span>
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
          className="px-3 py-1.5 rounded-md border border-sidebar-border bg-background text-sm font-semibold text-foreground hover:border-[#d66a06] hover:text-[#d66a06] transition-colors"
        >
          Reset
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Upload CSV</span>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#d66a06] file:text-white hover:file:bg-[#b85505] cursor-pointer"
          />
        </div>

        {hasFilters && (
          <span className="text-sm text-muted-foreground font-semibold ml-1">
            {filtered.length} of {incidents.length} incidents
          </span>
        )}
      </div>

      <button
        onClick={toggleDarkMode}
        className="p-2 rounded-md border border-sidebar-border bg-background text-foreground hover:border-[#d66a06] hover:text-[#d66a06] transition-colors"
        title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Verify / Success / Error dialog */}
      <Dialog open={dialogState !== 'closed'} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <DialogContent className="max-w-md">

          {/* ── Verify ── */}
          {dialogState === 'verify' && summary && (
            <>
              <DialogHeader>
                <DialogTitle>Review Upload</DialogTitle>
                <DialogDescription>
                  Confirm the data below looks correct before loading it into the dashboard.
                </DialogDescription>
              </DialogHeader>

              {/* File name */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                style={{ background: 'var(--id-surface2, #f8fafc)', border: '1px solid var(--id-border, #e2e8f0)' }}>
                <FileText size={15} className="shrink-0 text-muted-foreground" />
                <span className="truncate text-muted-foreground font-medium">{pendingName}</span>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="rounded-lg p-3 text-center"
                  style={{ background: 'var(--id-surface2, #f8fafc)', border: '1px solid var(--id-border, #e2e8f0)' }}>
                  <div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--id-text, #0f172a)' }}>
                    {pending!.length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Total Incidents</div>
                </div>
                <div className="rounded-lg p-3 text-center"
                  style={{ background: 'var(--id-surface2, #f8fafc)', border: '1px solid var(--id-border, #e2e8f0)' }}>
                  <div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--id-text, #0f172a)' }}>
                    {summary.products.length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Products</div>
                </div>
              </div>

              {/* Severity breakdown */}
              <div className="rounded-lg p-3"
                style={{ background: 'var(--id-surface2, #f8fafc)', border: '1px solid var(--id-border, #e2e8f0)' }}>
                <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Severity Breakdown</div>
                <div className="grid grid-cols-4 gap-2">
                  {(['P1', 'P2', 'P3', 'P4'] as const).map((sev) => (
                    <div key={sev} className="text-center">
                      <div className="text-lg font-bold tabular-nums" style={{ color: SEV_COLORS[sev] }}>
                        {summary.sevCounts[sev]}
                      </div>
                      <div className="text-xs font-semibold" style={{ color: SEV_COLORS[sev] }}>{sev}</div>
                      <div className="text-[10px] text-muted-foreground">{SEV_LABELS[sev]}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Months */}
              <div className="rounded-lg p-3"
                style={{ background: 'var(--id-surface2, #f8fafc)', border: '1px solid var(--id-border, #e2e8f0)' }}>
                <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                  Months Covered ({summary.months.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {summary.months.map((m) => (
                    <span key={m} className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--id-accent-bg, #fff3e0)', color: 'var(--id-accent, #d66a06)' }}>
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 font-semibold"
                  style={{ background: '#d66a06', color: '#fff' }}
                  onClick={handleConfirm}
                >
                  Confirm & Load Data
                </Button>
              </div>
            </>
          )}

          {/* ── Success ── */}
          {dialogState === 'success' && pending && (
            <>
              <DialogHeader>
                <DialogTitle>Upload Successful</DialogTitle>
                <DialogDescription>
                  Your incident data has been loaded into the dashboard.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--id-green-soft, #dcfce7)' }}>
                  <CheckCircle2 size={32} style={{ color: 'var(--id-green, #16a34a)' }} />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--id-text, #0f172a)' }}>
                    {pending.length} incident{pending.length !== 1 ? 's' : ''} loaded
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {buildSummary(pending).months.length} month{buildSummary(pending).months.length !== 1 ? 's' : ''} · {buildSummary(pending).products.length} product{buildSummary(pending).products.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <Button
                className="w-full font-semibold"
                style={{ background: '#d66a06', color: '#fff' }}
                onClick={handleClose}
              >
                Done
              </Button>
            </>
          )}

          {/* ── Error ── */}
          {dialogState === 'error' && (
            <>
              <DialogHeader>
                <DialogTitle>Upload Failed</DialogTitle>
                <DialogDescription>
                  {uploadError || 'There was an issue reading the CSV file. Please check the format and try again.'}
                </DialogDescription>
              </DialogHeader>
              <Button variant="outline" className="w-full mt-2" onClick={handleClose}>
                Close
              </Button>
            </>
          )}

        </DialogContent>
      </Dialog>
    </div>
  );
}

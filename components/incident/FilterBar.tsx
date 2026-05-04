"use client";

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { parseIncidentsCSV, parseIncidentsXLSX } from '@/lib/csvParser';
import type { XLSXParseResult } from '@/lib/csvParser';
import { getMonths, getProducts, getYears } from '@/lib/incidentUtils';
import { useIncidentStore } from '@/store/useIncidentStore';
import type { Incident } from '@/types/incident';
import { CheckCircle2, FileText } from 'lucide-react';
import { useState } from 'react';

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
  const [pendingSheets, setPendingSheets] = useState<XLSXParseResult['sheets']>([]);
  const [pendingSkipped, setPendingSkipped] = useState<XLSXParseResult['skipped']>([]);
  const [dialogState, setDialogState] = useState<'closed' | 'verify' | 'success' | 'error'>('closed');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const ALL_YEARS = getYears(incidents);
  const ALL_MONTHS = getMonths(incidents);
  const ALL_PRODUCTS = getProducts(incidents);
  const hasFilters = filters.year !== String(new Date().getFullYear()) || filters.month || filters.product || filters.severity || filters.ownership;

  const selectClass =
    'border border-sidebar-border rounded-md px-3 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:border-[#d66a06] cursor-pointer';

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        if (isExcel) {
          const result = await parseIncidentsXLSX(e.target?.result as ArrayBuffer);
          setPending(result.incidents);
          setPendingSheets(result.sheets);
          setPendingSkipped(result.skipped);
        } else {
          setPending(parseIncidentsCSV(e.target?.result as string));
          setPendingSheets([]);
          setPendingSkipped([]);
        }
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

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
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
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Year</span>
          <select
            className={selectClass}
            value={filters.year}
            onChange={(e) => setFilters({ year: e.target.value, month: '' })}
          >
            <option value="">All years</option>
            {ALL_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

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
            accept=".csv,.xlsx,.xls"
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
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-secondary border border-border">
                <FileText size={15} className="shrink-0 text-muted-foreground" />
                <span className="truncate text-muted-foreground font-medium">{pendingName}</span>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="rounded-lg p-3 text-center bg-secondary border border-border">
                  <div className="text-2xl font-bold tabular-nums text-foreground">
                    {pending!.length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Total Incidents</div>
                </div>
                <div className="rounded-lg p-3 text-center bg-secondary border border-border">
                  <div className="text-2xl font-bold tabular-nums text-foreground">
                    {summary.products.length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Products</div>
                </div>
              </div>

              {/* Severity breakdown */}
              <div className="rounded-lg p-3 bg-secondary border border-border">
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
              <div className="rounded-lg p-3 bg-secondary border border-border">
                <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                  Months Covered ({summary.months.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {summary.months.map((m) => (
                    <span key={m} className="text-xs font-medium px-2 py-0.5 rounded-full bg-[rgba(214,106,6,0.10)] dark:bg-[rgba(214,106,6,0.18)] text-[#d66a06]">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sheets (Excel only) */}
              {pendingSheets.length > 0 && (
                <div className="rounded-lg p-3 bg-secondary border border-border">
                  <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                    Sheets Loaded ({pendingSheets.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {pendingSheets.map((s) => (
                      <span key={s.name} className="text-xs font-medium px-2 py-0.5 rounded-full bg-[rgba(59,130,246,0.10)] dark:bg-[rgba(59,130,246,0.18)] text-[#3b82f6]">
                        {s.name} ({s.rows})
                      </span>
                    ))}
                  </div>
                  {pendingSkipped.length > 0 && (
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      Skipped: {pendingSkipped.map((s) => s.name).join(', ')}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 font-semibold bg-[#d66a06] text-white hover:bg-[#b85505]"
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
                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[rgba(22,163,74,0.12)] dark:bg-[rgba(22,163,74,0.18)]">
                  <CheckCircle2 size={32} className="text-[#16a34a]" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold tabular-nums text-foreground">
                    {pending.length} incident{pending.length !== 1 ? 's' : ''} loaded
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {buildSummary(pending).months.length} month{buildSummary(pending).months.length !== 1 ? 's' : ''} · {buildSummary(pending).products.length} product{buildSummary(pending).products.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <Button
                className="w-full font-semibold bg-[#d66a06] text-white hover:bg-[#b85505]"
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

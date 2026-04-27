"use client";

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { parseIncidentsCSV } from '@/lib/csvParser';
import { getMonths, getProducts } from '@/lib/incidentUtils';
import { useIncidentStore } from '@/store/useIncidentStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function FilterBar() {
  const filters = useIncidentStore((s) => s.filters);
  const filtered = useIncidentStore((s) => s.filtered);
  const incidents = useIncidentStore((s) => s.incidents);
  const setFilters = useIncidentStore((s) => s.setFilters);
  const resetFilters = useIncidentStore((s) => s.resetFilters);
  const setIncidents = useIncidentStore((s) => s.setIncidents);

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ count: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize dark mode from localStorage and set up system preference listener
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedMode);
    updateDarkMode(savedMode);
  }, []);

  const updateDarkMode = (dark: boolean) => {
    const html = document.documentElement;
    if (dark) {
      html.classList.add('dark');
      console.log('Dark mode enabled, classes:', html.className);
    } else {
      html.classList.remove('dark');
      console.log('Dark mode disabled, classes:', html.className);
    }
    console.log('Current --background:', getComputedStyle(html).getPropertyValue('--background'));
    localStorage.setItem('darkMode', dark.toString());
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    updateDarkMode(newMode);
  };

  const ALL_MONTHS = getMonths(incidents);
  const ALL_PRODUCTS = getProducts(incidents);

  const hasFilters =
    filters.month || filters.product || filters.severity || filters.ownership;

  const selectClass =
    'border border-sidebar-border rounded-md px-3 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:border-[#d66a06] cursor-pointer';

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File upload triggered', event.target.files);
    const file = event.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('Reading file:', file.name, file.type, file.size);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const incidents = parseIncidentsCSV(text);
        setIncidents(incidents);
        setUploadResult({ count: incidents.length });
        setUploadError(null);
        setShowSuccessDialog(true);
        setShowErrorDialog(false);
        event.target.value = '';
      } catch (error) {
        console.error('Error parsing CSV:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        setUploadError(message);
        setUploadResult(null);
        setShowErrorDialog(true);
      }
    };
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      setUploadError('Error reading file.');
      setUploadResult(null);
      setShowErrorDialog(true);
    };
    reader.readAsText(file);
  };

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

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Successful</DialogTitle>
            <DialogDescription>
              Successfully loaded {uploadResult?.count} incident{uploadResult?.count !== 1 ? 's' : ''} from CSV file.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Failed</DialogTitle>
            <DialogDescription>
              {uploadError || 'There was an issue reading the CSV file. Please check the format and try again.'}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

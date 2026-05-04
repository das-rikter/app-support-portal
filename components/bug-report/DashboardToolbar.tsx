'use client';

import { parseMainCSV, parseWeeklyCSV } from '@/lib/csvParser';
import { cn } from '@/lib/utils';
import { useBugReportStore } from '@/store/useBugReportStore';
import { useRef } from 'react';

const uploadSvg = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const BTN_BASE = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap border select-none transition-[background,border-color,transform] duration-150 hover:-translate-y-px active:translate-y-0 no-underline';
const BTN_UPLOAD = 'bg-[rgba(212,97,10,0.18)] text-[#c75c00] border-[rgba(212,97,10,0.45)] hover:bg-[rgba(212,97,10,0.28)] hover:border-[#d4610a]';
const BTN_LOADING = 'opacity-70 pointer-events-none cursor-wait';
const BTN_SUCCESS = '!bg-[rgba(22,163,74,0.15)] !border-[rgba(22,163,74,0.5)] !text-[#15803d]';

export function DashboardToolbar() {
  const uploadState = useBugReportStore((s) => s.uploadState);
  const stageMainUpload = useBugReportStore((s) => s.stageMainUpload);
  const stageWeeklyUpload = useBugReportStore((s) => s.stageWeeklyUpload);
  const setMainPhase = useBugReportStore((s) => s.setMainPhase);
  const setWeeklyPhase = useBugReportStore((s) => s.setWeeklyPhase);
  const showToast = useBugReportStore((s) => s.showToast);
  const openPublishModal = useBugReportStore((s) => s.openPublishModal);

  const mainInputRef = useRef<HTMLInputElement>(null);
  const weeklyInputRef = useRef<HTMLInputElement>(null);

  function handlePdfClick() {
    window.print();
  }

  function handleMainUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMainPhase('reading');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        setMainPhase('verifying');
        const rows = parseMainCSV(ev.target!.result as string);
        stageMainUpload(rows);
        showToast(`✓ ${rows.length} bugs verified - click Publish to apply.`, 'success');
      } catch (err) {
        setMainPhase('error');
        showToast(`Error: ${(err as Error).message}`, 'error');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  }

  function handleWeeklyUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setWeeklyPhase('reading');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        setWeeklyPhase('verifying');
        const { bugs, range } = parseWeeklyCSV(ev.target!.result as string);
        stageWeeklyUpload(bugs, range);
        showToast(`✓ ${bugs.length} weekly bugs verified - click Publish to apply.`, 'success');
      } catch (err) {
        setWeeklyPhase('error');
        showToast(`Error: ${(err as Error).message}`, 'error');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  }

  function weeklyBtnLabel() {
    switch (uploadState.weeklyPhase) {
      case 'reading': return 'Reading…';
      case 'verifying': return 'Verifying…';
      case 'staged': return `✓ ${uploadState.staged.weeklyRows?.length ?? 0} bugs verified`;
      default: return 'Weekly CSV';
    }
  }

  function mainBtnLabel() {
    switch (uploadState.mainPhase) {
      case 'reading': return 'Reading…';
      case 'verifying': return 'Verifying…';
      case 'staged': return `✓ ${uploadState.staged.mainRows?.length ?? 0} bugs verified`;
      default: return 'Full Bug List';
    }
  }

  const weeklyLoading = uploadState.weeklyPhase === 'reading' || uploadState.weeklyPhase === 'verifying';
  const mainLoading = uploadState.mainPhase === 'reading' || uploadState.mainPhase === 'verifying';

  return (
    <div className="flex items-center gap-3 flex-wrap mb-6 mt-6">
      <label
        className={cn(BTN_BASE, BTN_UPLOAD, weeklyLoading && BTN_LOADING, uploadState.weeklyPhase === 'staged' && BTN_SUCCESS)}
        title="Upload your weekly bug CSV export"
      >
        {uploadSvg}
        {weeklyBtnLabel()}
        <input ref={weeklyInputRef} type="file" accept=".csv" hidden onChange={handleWeeklyUpload} />
      </label>

      <label
        className={cn(BTN_BASE, BTN_UPLOAD, mainLoading && BTN_LOADING, uploadState.mainPhase === 'staged' && BTN_SUCCESS)}
        title="Upload your main historical bug list CSV"
      >
        {uploadSvg}
        {mainBtnLabel()}
        <input ref={mainInputRef} type="file" accept=".csv" hidden onChange={handleMainUpload} />
      </label>

      <button
        className={cn(BTN_BASE, 'bg-secondary text-muted-foreground border-border hover:bg-muted hover:border-[#a0aab8] bg-blue-700')}
        title="Download dashboard as PDF"
        onClick={handlePdfClick}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
        Download PDF
      </button>

      <button
        className={cn(
          BTN_BASE,
          uploadState.publishReady
            ? 'bg-[rgba(22,163,74,0.12)] text-[#15803d] border-[rgba(22,163,74,0.45)] hover:bg-[rgba(22,163,74,0.22)] hover:border-[#16a34a]'
            : 'bg-[rgba(22,163,74,0.08)] text-[rgba(22,163,74,0.4)] border-[rgba(22,163,74,0.18)] cursor-not-allowed opacity-60'
        )}
        title="Publish data so everyone sees updated numbers"
        disabled={!uploadState.publishReady}
        onClick={openPublishModal}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2L11 13" />
          <path d="M22 2L15 22 11 13 2 9l20-7z" />
        </svg>
        Publish
      </button>
    </div>
  );
}

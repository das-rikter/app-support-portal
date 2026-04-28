'use client';

import { createPortal } from 'react-dom';
import { useBugReportStore } from '@/store/useBugReportStore';

export function PublishModal() {
  const { publishModalOpen, staged } = useBugReportStore((s) => s.uploadState);
  const publish = useBugReportStore((s) => s.publish);
  const closePublishModal = useBugReportStore((s) => s.closePublishModal);

  if (!publishModalOpen) return null;

  const hasMain   = (staged.mainRows?.length   ?? 0) > 0;
  const hasWeekly = (staged.weeklyRows?.length ?? 0) > 0;

  let summary = '';
  if (hasMain)   summary += `${staged.mainRows!.length} open bugs`;
  if (hasMain && hasWeekly) summary += ' + ';
  if (hasWeekly) summary += `${staged.weeklyRows!.length} weekly bugs (${staged.weeklyRange?.start} - ${staged.weeklyRange?.end})`;

  function handleConfirm() {
    publish();
    closePublishModal();
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 z-10000 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) closePublishModal(); }}
    >
      <div className="bg-card border border-border border-t-[3px] border-t-[#16a34a] rounded-lg p-6 max-w-135 w-full shadow-lg">
        <h3 className="text-base font-bold text-foreground mb-2">Publish Dashboard</h3>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          This will apply the verified data and update all sections live.
        </p>
        <div className="bg-secondary rounded-md px-4 py-3 mb-4 text-xs text-muted-foreground leading-[1.8]">
          <strong className="text-foreground">Ready to publish:</strong> {summary}
        </div>
        <div className="flex gap-2 justify-end">
          <button
            className="py-2 px-4 rounded-md text-xs font-semibold cursor-pointer border border-border bg-secondary text-muted-foreground hover:bg-muted transition-colors"
            onClick={closePublishModal}
          >
            Cancel
          </button>
          <button
            className="py-2 px-4 rounded-md text-xs font-semibold cursor-pointer border border-primary-clementine-900 bg-primary-clementine-900 text-white inline-flex items-center gap-1 hover:bg-primary-clementine-800 transition-colors"
            onClick={handleConfirm}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22 11 13 2 9l20-7z" />
            </svg>
            Publish Now
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

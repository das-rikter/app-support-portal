'use client';

import { createPortal } from 'react-dom';
import { useBugReportStore } from '@/store/useBugReportStore';

export function PublishModal() {
  const { publishModalOpen, staged } = useBugReportStore((s) => s.uploadState);
  const publish = useBugReportStore((s) => s.publish);
  const closePublishModal = useBugReportStore((s) => s.closePublishModal);

  if (!publishModalOpen) return null;

  const hasMain = (staged.mainRows?.length ?? 0) > 0;
  const hasWeekly = (staged.weeklyRows?.length ?? 0) > 0;

  let summary = '';
  if (hasMain) summary += `${staged.mainRows!.length} open bugs`;
  if (hasMain && hasWeekly) summary += ' + ';
  if (hasWeekly)
    summary += `${staged.weeklyRows!.length} weekly bugs (${staged.weeklyRange?.start} - ${staged.weeklyRange?.end})`;

  function handleConfirm() {
    publish();
    closePublishModal();
  }

  return createPortal(
    <div
      className="publish-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) closePublishModal();
      }}
    >
      <div className="publish-modal">
        <h3>Publish Dashboard</h3>
        <p>This will apply the verified data and update all sections live.</p>
        <div className="publish-steps">
          <strong>Ready to publish:</strong> {summary}
        </div>
        <div className="publish-modal-btns">
          <button className="publish-cancel" onClick={closePublishModal}>
            Cancel
          </button>
          <button className="publish-download flex" onClick={handleConfirm}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ verticalAlign: 'middle', marginRight: 4 }}
            >
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

'use client';

import { createPortal } from 'react-dom';
import { useBugReportStore } from '@/store/useBugReportStore';

export function Toast() {
  const toast = useBugReportStore((s) => s.uploadState.toast);
  if (!toast) return null;

  return createPortal(
    <div className={`upload-toast ${toast.type}`}>{toast.message}</div>,
    document.body
  );
}

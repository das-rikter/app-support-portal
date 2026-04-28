'use client';

import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';
import { useBugReportStore } from '@/store/useBugReportStore';

const BORDER_COLOR: Record<string, string> = {
  success: 'border-l-[#16a34a]',
  error:   'border-l-[#dc2626]',
};

export function Toast() {
  const toast = useBugReportStore((s) => s.uploadState.toast);
  if (!toast) return null;

  return createPortal(
    <div
      className={cn(
        'fixed bottom-6 right-6 bg-card border border-border border-l-[3px] border-l-primary-clementine-900 rounded-md px-4 py-3 text-xs font-medium text-foreground shadow-lg z-9999 max-w-85 animate-[toastIn_0.2s_ease]',
        BORDER_COLOR[toast.type]
      )}
    >
      {toast.message}
    </div>,
    document.body
  );
}

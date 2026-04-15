import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Bug, WeeklyRange, BugUploadState, UploadPhase, ToastState } from '@/types/bug-report';

const INITIAL_UPLOAD_STATE: BugUploadState = {
  mainPhase: 'idle',
  weeklyPhase: 'idle',
  staged: { mainRows: null, weeklyRows: null, weeklyRange: null },
  publishReady: false,
  toast: null,
  publishModalOpen: false,
};

interface BugReportState {
  bugs: Bug[];
  weeklyBugs: Bug[];
  weeklyRange: WeeklyRange | null;
  uploadState: BugUploadState;
  activeSection: string;

  stageMainUpload: (rows: Bug[]) => void;
  stageWeeklyUpload: (rows: Bug[], range: WeeklyRange) => void;
  publish: () => void;
  showToast: (message: string, type: ToastState['type']) => void;
  setMainPhase: (phase: UploadPhase) => void;
  setWeeklyPhase: (phase: UploadPhase) => void;
  openPublishModal: () => void;
  closePublishModal: () => void;
  setActiveSection: (id: string) => void;
}

export const useBugReportStore = create<BugReportState>()(
  devtools(
    (set, get) => ({
      bugs: [],
      weeklyBugs: [],
      weeklyRange: null,
      uploadState: INITIAL_UPLOAD_STATE,
      activeSection: 'section-kpis',

      stageMainUpload: (rows) => {
        set((s) => {
          const staged = { ...s.uploadState.staged, mainRows: rows };
          return {
            uploadState: {
              ...s.uploadState,
              mainPhase: 'staged' as UploadPhase,
              staged,
              publishReady: staged.mainRows !== null && staged.weeklyRows !== null,
            },
          };
        });
      },

      stageWeeklyUpload: (rows, range) => {
        set((s) => {
          const staged = { ...s.uploadState.staged, weeklyRows: rows, weeklyRange: range };
          return {
            uploadState: {
              ...s.uploadState,
              weeklyPhase: 'staged' as UploadPhase,
              staged,
              publishReady: staged.mainRows !== null && staged.weeklyRows !== null,
            },
          };
        });
      },

      publish: () => {
        const { uploadState } = get();
        const newBugs = uploadState.staged.mainRows ?? get().bugs;
        const newWeeklyBugs = uploadState.staged.weeklyRows ?? get().weeklyBugs;
        const newWeeklyRange = uploadState.staged.weeklyRange ?? get().weeklyRange;
        set({
          bugs: newBugs,
          weeklyBugs: newWeeklyBugs,
          weeklyRange: newWeeklyRange,
          uploadState: {
            ...INITIAL_UPLOAD_STATE,
            toast: { message: '✓ Dashboard published successfully!', type: 'success' },
          },
        });
        setTimeout(() => {
          set((s) => ({ uploadState: { ...s.uploadState, toast: null } }));
        }, 5000);
      },

      showToast: (message, type) => {
        set((s) => ({ uploadState: { ...s.uploadState, toast: { message, type } } }));
        setTimeout(() => {
          set((s) => ({ uploadState: { ...s.uploadState, toast: null } }));
        }, 5000);
      },

      setMainPhase: (phase) => {
        set((s) => ({ uploadState: { ...s.uploadState, mainPhase: phase } }));
      },

      setWeeklyPhase: (phase) => {
        set((s) => ({ uploadState: { ...s.uploadState, weeklyPhase: phase } }));
      },

      openPublishModal: () => {
        set((s) => ({ uploadState: { ...s.uploadState, publishModalOpen: true } }));
      },

      closePublishModal: () => {
        set((s) => ({ uploadState: { ...s.uploadState, publishModalOpen: false } }));
      },

      setActiveSection: (id) => {
        set({ activeSection: id });
      },
    }),
    { name: 'BugReportStore' }
  )
);

import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

interface AppState {
  isSidebarOpen: boolean;
  notifications: Notification[];

  toggleSidebar: () => void;
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      isSidebarOpen: false,
      notifications: [],

      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            { ...notification, id: crypto.randomUUID() },
          ],
        })),

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
    }),
    { name: "AppStore" }
  )
);

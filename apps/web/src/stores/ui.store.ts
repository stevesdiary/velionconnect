import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  activeConversationId: string | null;
  notificationPanelOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveConversation: (id: string | null) => void;
  toggleNotificationPanel: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  activeConversationId: null,
  notificationPanelOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveConversation: (id) => set({ activeConversationId: id }),
  toggleNotificationPanel: () =>
    set((s) => ({ notificationPanelOpen: !s.notificationPanelOpen })),
}));

import { Socket } from 'socket.io-client';
import { create } from 'zustand';

interface RealtimeState {
  socket: Socket | null;
  connected: boolean;
  suggestions: Record<string, string[]>;
  setSocket: (socket: Socket | null) => void;
  setConnected: (connected: boolean) => void;
  setSuggestions: (conversationId: string, suggestions: string[]) => void;
  clearSuggestions: (conversationId: string) => void;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  socket: null,
  connected: false,
  suggestions: {},
  setSocket: (socket) => set({ socket }),
  setConnected: (connected) => set({ connected }),
  setSuggestions: (conversationId, suggestions) =>
    set((s) => ({ suggestions: { ...s.suggestions, [conversationId]: suggestions } })),
  clearSuggestions: (conversationId) =>
    set((s) => {
      const next = { ...s.suggestions };
      delete next[conversationId];
      return { suggestions: next };
    }),
}));

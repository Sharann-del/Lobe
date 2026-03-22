import { create } from "zustand";

export type StreamDensity = "compact" | "comfortable";

interface StreamViewState {
  subtitlePropertyId: string | null;
  statusPropertyId: string | null;
  datePropertyId: string | null;
  groupByPropertyId: string | null;
  groupCollapsed: Record<string, boolean>;
  density: StreamDensity;

  setSubtitlePropertyId: (id: string | null) => void;
  setStatusPropertyId: (id: string | null) => void;
  setDatePropertyId: (id: string | null) => void;
  setGroupByPropertyId: (id: string | null) => void;
  toggleGroupCollapsed: (key: string) => void;
  setDensity: (density: StreamDensity) => void;
}

export const useStreamViewStore = create<StreamViewState>()((set) => ({
  subtitlePropertyId: null,
  statusPropertyId: null,
  datePropertyId: null,
  groupByPropertyId: null,
  groupCollapsed: {},
  density: "comfortable",

  setSubtitlePropertyId: (id) => set({ subtitlePropertyId: id }),

  setStatusPropertyId: (id) => set({ statusPropertyId: id }),

  setDatePropertyId: (id) => set({ datePropertyId: id }),

  setGroupByPropertyId: (id) =>
    set({ groupByPropertyId: id, groupCollapsed: {} }),

  toggleGroupCollapsed: (key) => {
    set((state) => {
      const next = { ...state.groupCollapsed };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return { groupCollapsed: next };
    });
  },

  setDensity: (density) => set({ density }),
}));

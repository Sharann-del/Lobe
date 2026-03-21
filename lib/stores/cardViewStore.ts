import { create } from "zustand";

export type CardSize = "small" | "medium" | "large";
export type ImageFit = "cover" | "contain";
export type ColumnCount = 2 | 3 | 4 | 5;

interface CardViewState {
  columns: ColumnCount;
  cardSize: CardSize;
  imageFit: ImageFit;
  badgePropertyIds: string[];
  groupByPropertyId: string | null;
  groupCollapsed: Record<string, boolean>;

  setColumns: (columns: ColumnCount) => void;
  setCardSize: (size: CardSize) => void;
  setImageFit: (fit: ImageFit) => void;
  setBadgePropertyIds: (ids: string[]) => void;
  toggleBadgeProperty: (id: string) => void;
  setGroupByPropertyId: (id: string | null) => void;
  toggleGroupCollapsed: (key: string) => void;
  initBadgeProperties: (
    schemas: { id: string; type: string }[]
  ) => void;
}

const BADGE_TYPES = ["select", "multi_select", "person", "date", "checkbox"];

export const useCardViewStore = create<CardViewState>()((set, get) => ({
  columns: 3,
  cardSize: "medium",
  imageFit: "cover",
  badgePropertyIds: [],
  groupByPropertyId: null,
  groupCollapsed: {},

  setColumns: (columns) => set({ columns }),

  setCardSize: (size) => set({ cardSize: size }),

  setImageFit: (fit) => set({ imageFit: fit }),

  setBadgePropertyIds: (ids) => set({ badgePropertyIds: ids }),

  toggleBadgeProperty: (id) => {
    set((state) => {
      const has = state.badgePropertyIds.includes(id);
      return {
        badgePropertyIds: has
          ? state.badgePropertyIds.filter((x) => x !== id)
          : [...state.badgePropertyIds, id].slice(0, 3),
      };
    });
  },

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

  initBadgeProperties: (schemas) => {
    if (get().badgePropertyIds.length > 0) return;
    const ids = schemas
      .filter((s) => BADGE_TYPES.includes(s.type))
      .slice(0, 3)
      .map((s) => s.id);
    set({ badgePropertyIds: ids });
  },
}));

import { create } from "zustand";
import type { PropertyValueType } from "@/lib/types/properties";

export interface CardDisplayField {
  propertyId: string;
  visible: boolean;
}

interface BoardViewState {
  groupByPropertyId: string | null;
  subGroupByPropertyId: string | null;
  collapsedColumns: Record<string, boolean>;
  columnOrder: string[];
  hideEmptyGroups: boolean;
  cardDisplayFields: CardDisplayField[];

  setGroupByPropertyId: (id: string | null) => void;
  setSubGroupByPropertyId: (id: string | null) => void;
  toggleColumnCollapsed: (columnKey: string) => void;
  setColumnOrder: (order: string[]) => void;
  reorderColumns: (fromKey: string, toKey: string) => void;
  setHideEmptyGroups: (hide: boolean) => void;
  setCardDisplayFields: (fields: CardDisplayField[]) => void;
  toggleCardDisplayField: (propertyId: string) => void;
  initCardDisplayFields: (
    schemas: { id: string; type: PropertyValueType }[]
  ) => void;
}

const DEFAULT_CARD_TYPES: PropertyValueType[] = [
  "select",
  "multi_select",
  "person",
  "date",
  "checkbox",
];

export const useBoardViewStore = create<BoardViewState>()((set, get) => ({
  groupByPropertyId: null,
  subGroupByPropertyId: null,
  collapsedColumns: {},
  columnOrder: [],
  hideEmptyGroups: false,
  cardDisplayFields: [],

  setGroupByPropertyId: (id) => {
    set({ groupByPropertyId: id, collapsedColumns: {}, columnOrder: [] });
  },

  setSubGroupByPropertyId: (id) => {
    set({ subGroupByPropertyId: id });
  },

  toggleColumnCollapsed: (columnKey) => {
    set((state) => {
      const next = { ...state.collapsedColumns };
      if (next[columnKey]) {
        delete next[columnKey];
      } else {
        next[columnKey] = true;
      }
      return { collapsedColumns: next };
    });
  },

  setColumnOrder: (order) => set({ columnOrder: order }),

  reorderColumns: (fromKey, toKey) => {
    set((state) => {
      const order = [...state.columnOrder];
      const fromIdx = order.indexOf(fromKey);
      const toIdx = order.indexOf(toKey);
      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return {};
      const [moved] = order.splice(fromIdx, 1);
      if (!moved) return {};
      order.splice(toIdx, 0, moved);
      return { columnOrder: order };
    });
  },

  setHideEmptyGroups: (hide) => set({ hideEmptyGroups: hide }),

  setCardDisplayFields: (fields) => set({ cardDisplayFields: fields }),

  toggleCardDisplayField: (propertyId) => {
    set((state) => ({
      cardDisplayFields: state.cardDisplayFields.map((f) =>
        f.propertyId === propertyId ? { ...f, visible: !f.visible } : f
      ),
    }));
  },

  initCardDisplayFields: (schemas) => {
    if (get().cardDisplayFields.length > 0) return;
    set({
      cardDisplayFields: schemas.map((s) => ({
        propertyId: s.id,
        visible: DEFAULT_CARD_TYPES.includes(s.type),
      })),
    });
  },
}));

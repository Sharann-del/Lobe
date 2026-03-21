import { create } from "zustand";

interface LocationViewState {
  locationPropertyId: string | null;
  searchQuery: string;
  highlightedPageId: string | null;
  addPinMode: boolean;

  setLocationPropertyId: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  setHighlightedPageId: (id: string | null) => void;
  setAddPinMode: (on: boolean) => void;
}

export const useLocationViewStore = create<LocationViewState>()((set) => ({
  locationPropertyId: null,
  searchQuery: "",
  highlightedPageId: null,
  addPinMode: false,

  setLocationPropertyId: (id) => set({ locationPropertyId: id }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setHighlightedPageId: (highlightedPageId) => set({ highlightedPageId }),

  setAddPinMode: (addPinMode) => set({ addPinMode }),
}));

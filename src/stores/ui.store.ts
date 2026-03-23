import { create } from 'zustand'

type UIState = {
  isBottomSheetOpen: boolean
  bottomSheetContent: React.ReactNode | null
  isSearchOpen: boolean
  activeTab: string

  openBottomSheet: (content: React.ReactNode) => void
  closeBottomSheet: () => void
  setSearchOpen: (open: boolean) => void
  setActiveTab: (tab: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  isBottomSheetOpen: false,
  bottomSheetContent: null,
  isSearchOpen: false,
  activeTab: 'menu',

  openBottomSheet: (content) => set({ isBottomSheetOpen: true, bottomSheetContent: content }),
  closeBottomSheet: () => set({ isBottomSheetOpen: false, bottomSheetContent: null }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}))

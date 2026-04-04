import type { ReactNode } from 'react'
import { create } from 'zustand'

type UIState = {
  isBottomSheetOpen: boolean
  bottomSheetContent: ReactNode | null
  isSearchOpen: boolean
  activeTab: string
  isCartDrawerOpen: boolean

  openBottomSheet: (content: ReactNode) => void
  closeBottomSheet: () => void
  setSearchOpen: (open: boolean) => void
  setActiveTab: (tab: string) => void
  openCartDrawer: () => void
  closeCartDrawer: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isBottomSheetOpen: false,
  bottomSheetContent: null,
  isSearchOpen: false,
  activeTab: 'menu',
  isCartDrawerOpen: false,

  openBottomSheet: (content) => set({ isBottomSheetOpen: true, bottomSheetContent: content }),
  closeBottomSheet: () => set({ isBottomSheetOpen: false, bottomSheetContent: null }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  openCartDrawer: () => set({ isCartDrawerOpen: true }),
  closeCartDrawer: () => set({ isCartDrawerOpen: false }),
}))

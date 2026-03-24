import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MenuItem } from '@/types/menu'

// ─── Constant ────────────────────────────────────────────────────────────────
export const FRAIS_LIVRAISON = 500

// ─── Types ───────────────────────────────────────────────────────────────────
export type CartItem = {
  id: string // unique per item+options combo
  menuItem: MenuItem
  quantity: number
  selectedOptions: Array<{
    groupId: string
    groupName: string
    optionId: string
    optionName: string
    priceModifier: number
  }>
  specialInstructions?: string
  unitPrice: number
  totalPrice: number
}

type CartState = {
  items: CartItem[]
  deliveryAddressId: string | null
  promoCode: string | null
  discount: number

  // SSR hydration guard — NOT persisted
  _hasHydrated: boolean

  // Last add event for toast notifications — NOT persisted
  lastAdded: { id: string; wasUpdate: boolean; timestamp: number } | null

  // Actions
  addItem: (item: CartItem) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  setDeliveryAddress: (addressId: string) => void
  applyPromoCode: (code: string, discount: number) => void
  clearCart: () => void
  setHasHydrated: (val: boolean) => void
  clearLastAdded: () => void

  // Computed
  getSubtotal: () => number
  getTotal: () => number
  getItemCount: () => number
}

// ─── Store ───────────────────────────────────────────────────────────────────
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      deliveryAddressId: null,
      promoCode: null,
      discount: 0,
      _hasHydrated: false,
      lastAdded: null,

      addItem: (newItem) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === newItem.id)
          const lastAdded = {
            id: newItem.id,
            wasUpdate: !!existing,
            timestamp: Date.now(),
          }
          if (existing) {
            return {
              lastAdded,
              items: state.items.map((i) =>
                i.id === newItem.id
                  ? {
                      ...i,
                      quantity: i.quantity + newItem.quantity,
                      totalPrice: (i.quantity + newItem.quantity) * i.unitPrice,
                    }
                  : i
              ),
            }
          }
          return { lastAdded, items: [...state.items, newItem] }
        }),

      removeItem: (itemId) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== itemId) })),

      updateQuantity: (itemId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.id !== itemId) }
          }
          return {
            items: state.items.map((i) =>
              i.id === itemId
                ? { ...i, quantity, totalPrice: quantity * i.unitPrice }
                : i
            ),
          }
        }),

      setDeliveryAddress: (addressId) => set({ deliveryAddressId: addressId }),

      applyPromoCode: (code, discount) => set({ promoCode: code, discount }),

      clearCart: () =>
        set({ items: [], deliveryAddressId: null, promoCode: null, discount: 0 }),

      setHasHydrated: (val) => set({ _hasHydrated: val }),

      clearLastAdded: () => set({ lastAdded: null }),

      getSubtotal: () =>
        get().items.reduce((acc, item) => acc + item.totalPrice, 0),

      getTotal: () => {
        const subtotal = get().items.reduce((acc, item) => acc + item.totalPrice, 0)
        return subtotal > 0 ? subtotal + FRAIS_LIVRAISON : 0
      },

      getItemCount: () =>
        get().items.reduce((acc, item) => acc + item.quantity, 0),
    }),
    {
      name: 'daada-cart',
      // Only persist these fields — exclude runtime-only state
      partialize: (state) => ({
        items:              state.items,
        deliveryAddressId: state.deliveryAddressId,
        promoCode:          state.promoCode,
        discount:           state.discount,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

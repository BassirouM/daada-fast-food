'use client'

import useSWR from 'swr'
import { menuService } from '@/services/menu'

export function useMenuCategories() {
  return useSWR('menu/categories', () => menuService.getCategories(), {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
  })
}

export function useMenuItems(categoryId?: string) {
  const key = categoryId ? `menu/items/${categoryId}` : 'menu/items'
  return useSWR(key, () => menuService.getMenuItems(categoryId), {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  })
}

export function useFeaturedItems() {
  return useSWR('menu/featured', () => menuService.getFeaturedItems(), {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })
}

export function useMenuItemBySlug(slug: string) {
  return useSWR(`menu/item/${slug}`, () => menuService.getItemBySlug(slug), {
    revalidateOnFocus: false,
  })
}

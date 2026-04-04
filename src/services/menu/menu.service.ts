import { supabase } from '@/lib/supabase'
import type { MenuItem, MenuCategory } from '@/types/menu'

export const menuService = {
  async getCategories(): Promise<MenuCategory[]> {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) throw new Error(error.message)
    return data as MenuCategory[]
  },

  async getMenuItems(categoryId?: string): Promise<MenuItem[]> {
    let query = supabase
      .from('menu_items')
      .select(`
        *,
        option_groups:menu_item_option_groups(
          *,
          options:menu_item_options(*)
        )
      `)
      .eq('is_available', true)

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data as MenuItem[]
  },

  async getFeaturedItems(): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        option_groups:menu_item_option_groups(
          *,
          options:menu_item_options(*)
        )
      `)
      .eq('is_featured', true)
      .eq('is_available', true)
      .limit(10)

    if (error) throw new Error(error.message)
    return data as MenuItem[]
  },

  async getItemBySlug(slug: string): Promise<MenuItem | null> {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        option_groups:menu_item_option_groups(
          *,
          options:menu_item_options(*)
        )
      `)
      .eq('slug', slug)
      .single()

    if (error) return null
    return data as MenuItem
  },

  async searchItems(query: string): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .ilike('name', `%${query}%`)
      .eq('is_available', true)
      .limit(20)

    if (error) throw new Error(error.message)
    return data as MenuItem[]
  },
}

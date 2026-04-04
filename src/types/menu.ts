export type MenuCategory = {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  display_order: number
  is_active: boolean
}

export type MenuItemOption = {
  id: string
  name: string
  price_modifier: number
  is_available: boolean
}

export type MenuItemOptionGroup = {
  id: string
  name: string
  is_required: boolean
  min_selections: number
  max_selections: number
  options: MenuItemOption[]
}

export type MenuItem = {
  id: string
  category_id: string
  name: string
  slug: string
  description: string
  price: number
  image_url?: string
  option_groups: MenuItemOptionGroup[]
  is_available: boolean
  is_featured: boolean
  preparation_time_minutes: number
  calories?: number
  tags: string[]
  created_at: string
}

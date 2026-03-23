'use client'

import Image from 'next/image'
import { ShoppingCart, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import type { MenuItem } from '@/types/menu'

type MenuItemCardProps = {
  item: MenuItem
  onPress?: () => void
}

export function MenuItemCard({ item, onPress }: MenuItemCardProps) {
  const { addToCart } = useCart()

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (item.option_groups.length > 0) {
      onPress?.()
    } else {
      addToCart(item, 1)
    }
  }

  return (
    <div
      className="bg-card rounded-xl overflow-hidden border border-border cursor-pointer hover:border-brand-orange/50 transition-colors"
      onClick={onPress}
    >
      {/* Image */}
      <div className="relative aspect-video bg-muted">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">🍔</div>
        )}
        {item.is_featured && (
          <Badge className="absolute top-2 left-2">Populaire</Badge>
        )}
        {!item.is_available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-medium">Non disponible</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-1">{item.name}</h3>
        <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{item.description}</p>

        <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{item.preparation_time_minutes} min</span>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-brand-orange">{formatPrice(item.price)}</span>
          <Button
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={handleQuickAdd}
            disabled={!item.is_available}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

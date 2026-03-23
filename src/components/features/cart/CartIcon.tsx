'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/stores/cart.store'

export function CartIcon() {
  const itemCount = useCartStore((s) => s.getItemCount())

  return (
    <Link href="/cart" className="relative p-2">
      <ShoppingCart className="h-6 w-6" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-brand-orange text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  )
}

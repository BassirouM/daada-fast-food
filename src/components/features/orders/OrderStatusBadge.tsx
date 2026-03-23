import { Badge } from '@/components/ui/badge'
import type { OrderStatus } from '@/types/orders'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' },
  confirmed: { label: 'Confirmée', className: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
  preparing: { label: 'En préparation', className: 'bg-orange-500/20 text-orange-600 border-orange-500/30' },
  ready: { label: 'Prête', className: 'bg-green-500/20 text-green-600 border-green-500/30' },
  picked_up: { label: 'En livraison', className: 'bg-purple-500/20 text-purple-600 border-purple-500/30' },
  delivered: { label: 'Livrée', className: 'bg-green-700/20 text-green-700 border-green-700/30' },
  cancelled: { label: 'Annulée', className: 'bg-red-500/20 text-red-600 border-red-500/30' },
}

type OrderStatusBadgeProps = {
  status: OrderStatus
  className?: string
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}

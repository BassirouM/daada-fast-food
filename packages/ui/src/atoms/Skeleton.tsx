import * as React from 'react'
import { cn } from '../utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?:   number | string
  height?:  number | string
  rounded?: 'sm' | 'md' | 'lg' | 'full'
  animate?: boolean
}

const roundedMap = {
  sm:   'rounded',
  md:   'rounded-xl',
  lg:   'rounded-2xl',
  full: 'rounded-full',
}

export function Skeleton({
  width,
  height,
  rounded = 'md',
  animate = true,
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      role="presentation"
      className={cn(
        animate && 'animate-shimmer',
        !animate && 'bg-[var(--bg-elevated)]',
        roundedMap[rounded],
        className
      )}
      style={{ width, height, ...style }}
      {...props}
    />
  )
}

// ─── Pre-built skeleton layouts ───────────────────────────────────────────────

export function MenuItemCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border)]">
      <Skeleton className="w-full aspect-video" rounded="sm" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-8 w-8" rounded="full" />
        </div>
      </div>
    </div>
  )
}

export function RecipeCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-[var(--bg-surface)] border border-[var(--border)]">
      <Skeleton className="w-full aspect-[4/3]" rounded="sm" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" rounded="full" />
          <Skeleton className="h-5 w-16" rounded="full" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  )
}

export function OrderCardSkeleton() {
  return (
    <div className="rounded-2xl p-4 bg-[var(--bg-surface)] border border-[var(--border)] space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-20" rounded="full" />
      </div>
      <Skeleton className="h-3 w-40" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-24" rounded="lg" />
      </div>
    </div>
  )
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  )
}

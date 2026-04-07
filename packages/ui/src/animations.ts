/**
 * Animation utilities for @daada/ui.
 *
 * CSS classes (defined in globals.css) are used for component-level animations.
 * Framer Motion variants are exported for page-level transitions (CLAUDE.md rule).
 *
 * Usage with CSS:  className="animate-fade-in"
 * Usage with FM:   <motion.div variants={fadeIn} initial="hidden" animate="visible" />
 */

// ─── CSS animation class names ────────────────────────────────────────────────

export const animationClasses = {
  fadeIn:      'animate-fade-in',
  fadeOut:     'animate-fade-out',
  slideUp:     'animate-slide-up',
  slideDown:   'animate-slide-down',
  slideRight:  'animate-slide-right',
  scaleIn:     'animate-scale-in',
  bounceIn:    'animate-bounce-in',
  spin:        'animate-spin',
  shimmer:     'animate-shimmer',
  pulseBrand:  'animate-pulse-brand',
  pageIn:      'animate-page-in',
} as const

// ─── Framer Motion variants ───────────────────────────────────────────────────
// Used for PageTransition wrapper ONLY (CLAUDE.md)

export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit:    { opacity: 0, transition: { duration: 0.1 } },
}

export const slideUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit:    { opacity: 0, y: 20, transition: { duration: 0.2 } },
}

export const slideRight = {
  hidden:  { opacity: 0, x: '-100%' },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit:    { opacity: 0, x: '-100%', transition: { duration: 0.25 } },
}

/** For cart drawer — slides from right */
export const drawerRight = {
  hidden:  { x: '100%' },
  visible: { x: 0, transition: { duration: 0.3, ease: [0.34, 1.1, 0.64, 1] } },
  exit:    { x: '100%', transition: { duration: 0.25, ease: 'easeIn' } },
}

/** For add-to-cart bounce */
export const bounce = {
  tap: { scale: 1.2, transition: { duration: 0.1 } },
  rest: { scale: 1, transition: { duration: 0.1 } },
}

/** For live stream reaction float */
export const floatUp = {
  initial: { opacity: 1, y: 0 },
  animate: {
    opacity: 0,
    y: -60,
    transition: { duration: 1, ease: 'easeOut' },
  },
}

/** Shimmer gradient (for skeleton loaders via inline style) */
export const shimmerStyle = {
  background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-overlay) 50%, var(--bg-elevated) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.6s ease-in-out infinite',
}

/** Pulse for LIVE badge */
export const pulseLive = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.05, 1],
    transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
  },
}

// ─── Stagger helpers ──────────────────────────────────────────────────────────

export function staggerChildren(staggerMs = 50) {
  return {
    visible: {
      transition: {
        staggerChildren: staggerMs / 1000,
        delayChildren: 0.05,
      },
    },
  }
}

export const listItem = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

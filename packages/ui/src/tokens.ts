/**
 * DAADA Design Tokens — v2
 * Source of truth for all design decisions.
 * CSS variables are injected via globals.css in the main app.
 * This file exports the same values as a JS object for use in JS/TS contexts.
 */

// ─── Colors ──────────────────────────────────────────────────────────────────

export const colors = {
  brand: {
    // orange-500 Tailwind — primary
    orange:      '#F97316',
    orangeLight: '#FB923C',
    orangeDark:  '#EA580C',
    // red-600 — secondary
    red:         '#DC2626',
    redLight:    '#EF4444',
    redDark:     '#B91C1C',
    // amber-400 — accent / promo
    amber:       '#FBBF24',
    amberLight:  '#FCD34D',
    amberDark:   '#F59E0B',
    // gray-900 for dark surfaces
    dark:        '#111827',
    darkSoft:    '#1F2937',
    // warm white for light surfaces
    light:       '#FAFAF8',
    lightSoft:   '#FFFFFF',
  },

  // Neutral scale
  neutral: {
    50:  '#FAFAFA',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },

  // Semantic status colors (light mode)
  success:  '#16A34A',
  warning:  '#D97706',
  danger:   '#DC2626',
  info:     '#2563EB',
  premium:  '#F59E0B',

  // CSS variable refs (resolved at runtime via globals.css)
  css: {
    bgBase:     'var(--bg-base)',
    bgSurface:  'var(--bg-surface)',
    bgElevated: 'var(--bg-elevated)',
    bgOverlay:  'var(--bg-overlay)',
    bgInput:    'var(--bg-input)',

    textPrimary:   'var(--text-primary)',
    textSecondary: 'var(--text-secondary)',
    textMuted:     'var(--text-muted)',
    textInverse:   'var(--text-inverse)',

    brand:       'var(--brand)',
    brandLight:  'var(--brand-light)',
    brandDark:   'var(--brand-dark)',
    brandSubtle: 'var(--brand-subtle)',
    brandGlow:   'var(--brand-glow)',

    secondary:       'var(--secondary)',
    secondarySubtle: 'var(--secondary-subtle)',

    accent:       'var(--accent)',
    accentSubtle: 'var(--accent-subtle)',

    border:       'var(--border)',
    borderStrong: 'var(--border-strong)',
    borderBrand:  'var(--border-brand)',

    success:        'var(--success)',
    successSubtle:  'var(--success-subtle)',
    warning:        'var(--warning)',
    warningSubtle:  'var(--warning-subtle)',
    danger:         'var(--danger)',
    dangerSubtle:   'var(--danger-subtle)',
    info:           'var(--info)',
    infoSubtle:     'var(--info-subtle)',

    shadowSm:    'var(--shadow-sm)',
    shadowMd:    'var(--shadow-md)',
    shadowLg:    'var(--shadow-lg)',
    shadowBrand: 'var(--shadow-brand)',
  },
} as const

// ─── Typography ───────────────────────────────────────────────────────────────

export const typography = {
  fonts: {
    sans:    "'Inter', ui-sans-serif, system-ui, sans-serif",
    display: "'Syne', ui-sans-serif, system-ui, sans-serif",
  },
  sizes: {
    xs:    '0.75rem',    // 12px
    sm:    '0.875rem',   // 14px
    md:    '1rem',       // 16px
    lg:    '1.125rem',   // 18px
    xl:    '1.25rem',    // 20px
    '2xl': '1.5rem',     // 24px
    '3xl': '1.875rem',   // 30px
    '4xl': '2.25rem',    // 36px
    '5xl': '3rem',       // 48px
    '6xl': '3.75rem',    // 60px
  },
  weights: {
    normal:    400,
    medium:    500,
    semibold:  600,
    bold:      700,
    extrabold: 800,
  },
  lineHeights: {
    none:    1,
    tight:   1.25,
    snug:    1.375,
    normal:  1.5,
    relaxed: 1.625,
    loose:   2,
  },
} as const

// ─── Spacing (4px base scale) ─────────────────────────────────────────────────

export const spacing = {
  0:  '0px',
  1:  '4px',
  2:  '8px',
  3:  '12px',
  4:  '16px',
  5:  '20px',
  6:  '24px',
  7:  '28px',
  8:  '32px',
  9:  '36px',
  10: '40px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
} as const

// ─── Border Radius ────────────────────────────────────────────────────────────

export const radius = {
  sm:   '6px',
  md:   '10px',
  lg:   '14px',
  xl:   '20px',
  '2xl':'28px',
  full: '9999px',
  css: {
    sm:   'var(--radius-sm)',
    md:   'var(--radius-md)',
    lg:   'var(--radius-lg)',
    xl:   'var(--radius-xl)',
    full: 'var(--radius-full)',
  },
} as const

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const shadows = {
  sm:         '0 1px 3px rgba(0,0,0,0.08)',
  md:         '0 4px 12px rgba(0,0,0,0.10)',
  lg:         '0 8px 24px rgba(0,0,0,0.12)',
  xl:         '0 20px 48px rgba(0,0,0,0.16)',
  glowOrange: '0 4px 20px rgba(249,115,22,0.30)',
} as const

// ─── Transitions ──────────────────────────────────────────────────────────────

export const transitions = {
  fast:   '150ms ease',
  normal: '300ms ease',
  slow:   '500ms ease',
  spring: '300ms cubic-bezier(0.34,1.56,0.64,1)',
  classes: {
    fast:   'transition-all duration-150 ease-out',
    normal: 'transition-all duration-300 ease-out',
    slow:   'transition-all duration-500 ease-out',
  },
} as const

// ─── Z-index ──────────────────────────────────────────────────────────────────

export const zIndex = {
  base:     0,
  raised:   10,
  dropdown: 100,
  sticky:   200,
  overlay:  300,
  modal:    400,
  toast:    500,
  tooltip:  600,
} as const

// ─── CSS Variables injection helper ───────────────────────────────────────────

/** Generates a <style> block with all Daada CSS variables (light theme).
 *  Useful for Storybook / isolated component previews. */
export const cssVariablesBlock = `
:root {
  --bg-base: #FAFAF8;
  --bg-surface: #FFFFFF;
  --bg-elevated: #F3F4F6;
  --bg-overlay: #E5E7EB;
  --bg-input: #F9FAFB;
  --text-primary: #1F2937;
  --text-secondary: #6B7280;
  --text-muted: #9CA3AF;
  --text-inverse: #FFFFFF;
  --brand: #F97316;
  --brand-light: #FB923C;
  --brand-dark: #EA580C;
  --brand-subtle: rgba(249,115,22,0.10);
  --brand-glow: rgba(249,115,22,0.20);
  --secondary: #DC2626;
  --secondary-subtle: rgba(220,38,38,0.10);
  --accent: #FBBF24;
  --accent-subtle: rgba(251,191,36,0.15);
  --border: rgba(0,0,0,0.08);
  --border-strong: rgba(0,0,0,0.15);
  --border-brand: rgba(249,115,22,0.40);
  --success: #16A34A;
  --success-subtle: rgba(22,163,74,0.10);
  --warning: #D97706;
  --warning-subtle: rgba(217,119,6,0.10);
  --danger: #DC2626;
  --danger-subtle: rgba(220,38,38,0.10);
  --info: #2563EB;
  --info-subtle: rgba(37,99,235,0.10);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.10);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
  --shadow-brand: 0 4px 20px rgba(249,115,22,0.25);
  --t-fast: 120ms ease;
  --t-base: 200ms ease;
  --t-slow: 300ms ease;
  --t-spring: 300ms cubic-bezier(0.34,1.56,0.64,1);
  --radius-sm: 0.375rem;
  --radius-md: 0.625rem;
  --radius-lg: 0.875rem;
  --radius-xl: 1.25rem;
  --radius-full: 9999px;
}
`

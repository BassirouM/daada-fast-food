/**
 * DAADA Design Tokens
 * Source of truth for all design decisions.
 * CSS variables are injected via globals.css in the main app.
 * This file exports the same values as a JS object for use in JS/TS contexts.
 */

// ─── Colors ──────────────────────────────────────────────────────────────────

export const colors = {
  brand: {
    orange: '#FF6B00',
    orangeLight: '#FF8C38',
    orangeDark: '#CC5500',
    black: '#0A0A0A',
    blackSoft: '#1A1A1A',
    grayDark: '#2A2A2A',
    grayMid: '#4A4A4A',
    grayLight: '#8A8A8A',
    cream: '#FFF8F3',
  },

  // Neutral scale (dark-first)
  neutral: {
    50:  '#FAFAFA',
    100: '#F4F4F4',
    200: '#E8E8E8',
    300: '#D0D0D0',
    400: '#A0A0A0',
    500: '#6A6A6A',
    600: '#4A4A4A',
    700: '#2A2A2A',
    800: '#1A1A1A',
    900: '#0F0F0F',
    950: '#0A0A0A',
  },

  // Semantic status colors
  success:  '#22C55E',
  warning:  '#F59E0B',
  danger:   '#EF4444',
  info:     '#3B82F6',
  premium:  '#F59E0B',

  // CSS variable refs (resolved at runtime)
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
    xs:  '0.75rem',    // 12px
    sm:  '0.875rem',   // 14px
    md:  '1rem',       // 16px
    lg:  '1.125rem',   // 18px
    xl:  '1.25rem',    // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
  },
  weights: {
    normal:   400,
    medium:   500,
    semibold: 600,
    bold:     700,
    extrabold:800,
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

// ─── Border Radius ───────────────────────────────────────────────────────────

export const radius = {
  sm:   '6px',
  md:   '10px',
  lg:   '14px',
  xl:   '20px',
  '2xl':'28px',
  full: '9999px',
  // CSS vars
  css: {
    sm:   'var(--radius-sm)',
    md:   'var(--radius-md)',
    lg:   'var(--radius-lg)',
    xl:   'var(--radius-xl)',
    full: 'var(--radius-full)',
  },
} as const

// ─── Shadows ─────────────────────────────────────────────────────────────────

export const shadows = {
  sm:      '0 1px 3px rgba(0,0,0,0.5)',
  md:      '0 4px 12px rgba(0,0,0,0.5)',
  lg:      '0 8px 24px rgba(0,0,0,0.6)',
  xl:      '0 20px 48px rgba(0,0,0,0.7)',
  glowOrange: '0 4px 20px rgba(255,107,0,0.35)',
} as const

// ─── Transitions ─────────────────────────────────────────────────────────────

export const transitions = {
  fast:   '150ms ease',
  normal: '300ms ease',
  slow:   '500ms ease',
  spring: '300ms cubic-bezier(0.34,1.56,0.64,1)',
  // CSS class helpers (defined in globals.css)
  classes: {
    fast:   'transition-all duration-150 ease-out',
    normal: 'transition-all duration-300 ease-out',
    slow:   'transition-all duration-500 ease-out',
  },
} as const

// ─── Z-index ─────────────────────────────────────────────────────────────────

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

// ─── CSS Variables injection helper ──────────────────────────────────────────

/** Generates a <style> block with all Daada CSS variables.
 *  Useful for Storybook / isolated component previews. */
export const cssVariablesBlock = `
:root {
  --bg-base: #0A0A0A;
  --bg-surface: #141414;
  --bg-elevated: #1E1E1E;
  --bg-overlay: #252525;
  --bg-input: #1A1A1A;
  --text-primary: #FFFFFF;
  --text-secondary: #A0A0A0;
  --text-muted: #5A5A5A;
  --text-inverse: #0A0A0A;
  --brand: #FF6B00;
  --brand-light: #FF8C38;
  --brand-dark: #CC5500;
  --brand-subtle: rgba(255,107,0,0.12);
  --brand-glow: rgba(255,107,0,0.25);
  --border: rgba(255,255,255,0.08);
  --border-strong: rgba(255,255,255,0.15);
  --border-brand: rgba(255,107,0,0.4);
  --success: #22C55E;
  --success-subtle: rgba(34,197,94,0.12);
  --warning: #F59E0B;
  --warning-subtle: rgba(245,158,11,0.12);
  --danger: #EF4444;
  --danger-subtle: rgba(239,68,68,0.12);
  --info: #3B82F6;
  --info-subtle: rgba(59,130,246,0.12);
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.5);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.5);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.6);
  --shadow-brand: 0 4px 20px rgba(255,107,0,0.3);
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

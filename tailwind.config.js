/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#F97316',
          light:   '#FB923C',
          dark:    '#EA580C',
        },
        secondary: {
          DEFAULT: '#DC2626',
          light:   '#EF4444',
          dark:    '#B91C1C',
        },
        accent: {
          DEFAULT: '#FBBF24',
          light:   '#FCD34D',
          dark:    '#F59E0B',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Syne', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm:    '0.375rem',
        md:    '0.625rem',
        lg:    '0.875rem',
        xl:    '1.25rem',
        '2xl': '1.75rem',
      },
      boxShadow: {
        brand: '0 4px 20px rgba(249,115,22,0.30)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34,1.56,0.64,1)',
      },
    },
  },
  plugins: [],
}

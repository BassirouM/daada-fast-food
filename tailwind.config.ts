// Tailwind v4 — theme is defined via @theme in globals.css
// This file is kept for IDE tooling compatibility

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './packages/ui/src/**/*.{ts,tsx}',
  ],
}

export default config

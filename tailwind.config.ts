import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        neu: {
          bg: 'var(--neu-bg)',
          dark: 'var(--neu-dark)',
          light: 'var(--neu-light)',
          text: 'var(--neu-text)',
          'text-muted': 'var(--neu-text-muted)',
          accent: 'var(--neu-accent)',
          success: 'var(--neu-success)',
          warning: 'var(--neu-warning)',
          danger: 'var(--neu-danger)',
          // Legacy support
          'bg-dark': '#2d2d2d',
          'dark-shadow': '#1a1a1a',
          'light-shadow': '#404040',
        },
      },
      boxShadow: {
        // Light mode shadows
        'neu-sm': '3px 3px 6px var(--neu-dark), -3px -3px 6px var(--neu-light)',
        'neu': '6px 6px 12px var(--neu-dark), -6px -6px 12px var(--neu-light)',
        'neu-md': '8px 8px 16px var(--neu-dark), -8px -8px 16px var(--neu-light)',
        'neu-lg': '12px 12px 24px var(--neu-dark), -12px -12px 24px var(--neu-light)',
        'neu-inset-sm': 'inset 2px 2px 4px var(--neu-dark), inset -2px -2px 4px var(--neu-light)',
        'neu-inset': 'inset 4px 4px 8px var(--neu-dark), inset -4px -4px 8px var(--neu-light)',
        'neu-inset-md': 'inset 6px 6px 12px var(--neu-dark), inset -6px -6px 12px var(--neu-light)',
      },
    },
  },
  plugins: [typography],
}

export default config

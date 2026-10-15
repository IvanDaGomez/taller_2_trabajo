import type { Config } from 'tailwindcss'

// Colors read CSS variables (RGB channels) so opacity utilities work
// and light/dark switch without `dark:` variants everywhere.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        surface: token('surface'),
        ink: token('ink'),
        muted: token('muted'),
        accent: token('accent'),
        'accent-ink': token('accent-ink'),
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"',
          'system-ui', '"Segoe UI"', 'Roboto', 'sans-serif',
        ],
      },
      // Size-specific tracking: tighter as text grows, near 0 for body.
      letterSpacing: {
        display: '-0.03em',
        title: '-0.02em',
        snug: '-0.01em',
      },
      maxWidth: { page: '75rem' },
      borderRadius: { sheet: '1.75rem' },
    },
  },
  plugins: [],
} satisfies Config

import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'
import animate from 'tailwindcss-animate'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: ['light', 'theme-ocean', 'theme-forest', 'theme-sunset'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['Space Mono', 'monospace'],
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        retro: {
          pink: 'hsl(var(--retro-pink))',
          yellow: 'hsl(var(--retro-yellow))',
          blue: 'hsl(var(--retro-blue))',
          mint: 'hsl(var(--retro-mint))',
          orange: 'hsl(var(--retro-orange))',
          dark: 'hsl(var(--retro-dark))',
          cream: 'hsl(var(--retro-cream))',
        },
        sidebar: {
          bg: 'hsl(var(--sidebar-bg))',
          fg: 'hsl(var(--sidebar-fg))',
        },
        page: {
          bg: 'hsl(var(--background))',
          'bg-subtle': 'hsl(var(--page-bg-subtle))',
        },
        surface: 'hsl(var(--surface) / <alpha-value>)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      boxShadow: {
        glass:
          '0 1px 2px hsl(var(--retro-dark) / 0.04), 0 12px 32px -16px hsl(var(--retro-dark) / 0.18)',
        'glass-lg':
          '0 2px 4px hsl(var(--retro-dark) / 0.05), 0 24px 48px -20px hsl(var(--retro-dark) / 0.28)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pop: {
          '0%': { transform: 'scale(0.85)', opacity: '0' },
          '60%': { transform: 'scale(1.04)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.8s linear infinite',
        pop: 'pop 0.22s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'pulse-soft': 'pulse-soft 1.6s ease-in-out infinite',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      borderWidth: {
        '3': '3px',
        '4': '4px',
      },
    },
  },
  plugins: [typography, animate],
}

export default config

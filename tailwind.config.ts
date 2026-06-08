import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: '#0a0a0c',
          surface: '#111115',
          card: '#16161c',
          border: '#2a2a35',
          gold: '#c9a84c',
          'gold-light': '#e8c97a',
          'gold-dim': 'rgba(201,168,76,0.12)',
          text: '#e8e4dc',
          muted: '#6b6872',
          danger: '#c0392b',
          green: '#1a6b3c',
          'green-dark': '#155c33',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['DM Mono', 'Courier New', 'monospace'],
      },
      animation: {
        'shimmer': 'shimmer 1.4s infinite',
        'dot-pop': 'dotpop 0.15s ease',
        'dot-err': 'doterr 0.5s ease',
        'fade-in': 'fadeIn 0.3s ease',
        'slide-up': 'slideUp 0.3s ease',
        'slide-down': 'slideDown 0.3s ease',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        dotpop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.5)' },
          '100%': { transform: 'scale(1.25)' },
        },
        doterr: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(1.03) translateY(-16px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config

import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'var(--brand-50, #ecfdf5)',
          100: 'var(--brand-100, #d1fae5)',
          200: 'var(--brand-200, #a7f3d0)',
          300: 'var(--brand-300, #6ee7b7)',
          400: 'var(--brand-400, #34d399)',
          500: 'var(--brand-500, #10b981)',
          600: 'var(--brand-600, #059669)',
          700: 'var(--brand-700, #047857)',
          800: 'var(--brand-800, #065f46)',
          900: 'var(--brand-900, #064e3b)',
        },
        wellness: {
          green: '#10b981',
          blue: '#0ea5e9',
          orange: '#f59e0b',
          teal: '#14b8a6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [forms, typography],
}

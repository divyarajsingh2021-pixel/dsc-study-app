/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155'
        },
        primary: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
          light: '#eff6ff',
        },
        surface: '#ffffff',
        canvas: '#f8fafc',
      },
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
        'blue-glow': '0 4px 14px rgba(37, 99, 235, 0.35)',
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
      }
    },
  },
  plugins: [],
}

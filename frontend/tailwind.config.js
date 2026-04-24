/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#eef5ff',
          100: '#d9e8ff',
          200: '#bcd4ff',
          300: '#8eb6ff',
          400: '#598dff',
          500: '#3366ff',
          600: '#1a44f5',
          700: '#1432e1',
          800: '#172ab6',
          900: '#182a8f',
          950: '#131c57',
        },
      },
    },
  },
  plugins: [],
}

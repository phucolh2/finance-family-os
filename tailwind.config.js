/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        family: {
          bg: '#fff8ef',
          bgDark: '#fff0dd',
          bgDeep: '#f7dec1',
          text: '#2f241d',
          textMuted: '#6f5d50',
          textLight: '#9c816d',
          accent: '#d97706',
          accentDark: '#b45309',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

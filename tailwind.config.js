/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5bbfc',
          400: '#8098f9',
          500: '#6175f4',
          600: '#4a52e8',
          700: '#3b40ce',
          800: '#3137a6',
          900: '#2e3383',
        }
      }
    },
  },
  plugins: [],
}
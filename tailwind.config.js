/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        squishy: {
          pink: '#FF6B8B',
          peach: '#FFA07A',
          yellow: '#FFD166',
          purple: '#A06CD5',
          blue: '#4D96FF',
          green: '#06D6A0',
          dark: '#1E1E2E'
        }
      }
    },
  },
  plugins: [],
}
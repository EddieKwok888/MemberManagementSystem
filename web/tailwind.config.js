/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,tsx,jsx}",
  ],
  theme: {
    extend: {
      animation: {
        'shake': 'shake 0.2s ease-in-out 0s 2',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        }
      }
    },
  },
  plugins: [],
}

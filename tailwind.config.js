/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    {
      pattern: /(bg|text|border|shadow|from|to)-(indigo|rose|amber|emerald|sky)(-\d+)?(\/\d+)?/,
      variants: ['hover', 'focus', 'active', 'group-hover', 'dark', 'dark:hover', 'selection', 'dark:selection'],
    },
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5',
      }
    },
  },
  plugins: [],
}

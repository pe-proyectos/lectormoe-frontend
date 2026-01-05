/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,svelte,vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      perspective: {
        '1000': '1000px',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        ".no-scrollbar::-webkit-scrollbar": {
          "display": "none",
        },
        ".no-scrollbar": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
        },
        ".perspective-1000": {
          "perspective": "1000px",
        },
      };

      addUtilities(newUtilities);
    }
  ],
}

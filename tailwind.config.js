const withMT = require("@material-tailwind/react/utils/withMT");

/** @type {import('tailwindcss').Config} */
export default withMT({
  content: ['./src/**/*.{astro,html,svelte,vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // brand colors
      colors: {
        "brand-primary-content": {
          50: "#f7f7f7",
          100: "#eaeaea",
          200: "#d5d5d5",
          300: "#bfbfbf",
          400: "#a6a6a6",
          500: "#8c8c8c",
          600: "#6f6f6f",
          700: "#515151",
          800: "#313131",
          900: "#141414",
        },
        "brand-primary": {
          50: "#f3f9f8",
          100: "#e6f3f1",
          200: "#c0e0df",
          300: "#99cdc9",
          400: "#4db8b0",
          500: "#00a39a",
          600: "#00908a",
          700: "#007775",
          800: "#005b5f",
          900: "#00484d",
        },
        "brand-secondary": {
          50: "#f8f7f9",
          100: "#f1eff3",
          200: "#dfd7e1",
          300: "#cdb0cf",
          400: "#ba89bc",
          500: "#a362a8",
          600: "#8e5a97",
          700: "#754b7d",
          800: "#5b3c63",
          900: "#49314f",
        },
        "brand-content": {
          50: "#f7f7f7",
          100: "#eaeaea",
          200: "#d5d5d5",
          300: "#bfbfbf",
          400: "#a6a6a6",
          500: "#8c8c8c",
          600: "#6f6f6f",
          700: "#515151",
          800: "#313131",
          900: "#141414",
        },
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
      };

      addUtilities(newUtilities);
    }
  ],
})

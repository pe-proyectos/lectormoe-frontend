const withMT = require("@material-tailwind/react/utils/withMT");

/** @type {import('tailwindcss').Config} */
export default withMT({
  content: ['./src/**/*.{astro,html,svelte,vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
})

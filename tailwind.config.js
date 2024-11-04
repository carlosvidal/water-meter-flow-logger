/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  darkMode: "class", // o 'media' si prefieres que siga el sistema
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/forms")],
};

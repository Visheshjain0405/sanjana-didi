/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#C94F5B",
        secondary: "#F59B8F",
        background: "#FFF4EA",
        card: "#FFF9F4",
        text: "#3A2525",
        muted: "#8B6F6F",
        accent: "#F6C76A",
        success: "#77A86B",
      },
    },
  },
  plugins: [],
};

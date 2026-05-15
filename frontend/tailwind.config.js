/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1d4ed8", // Blue
        secondary: "#9333ea", // Purple
        dark: "#1e293b",
        light: "#f8fafc",
      }
    },
  },
  plugins: [],
}

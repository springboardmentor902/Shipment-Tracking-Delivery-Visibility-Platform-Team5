/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        ink: "#1f2937",
        inkfaint: "#374151",
        paper: "#f8f5ef",
        manifest: "#d6c7ad",
        slate: "#64748b",
        beacon: "#f59e0b",
      },

      fontFamily: {
        display: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },

  plugins: [],
}
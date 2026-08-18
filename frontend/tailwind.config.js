/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#010816",        // Very dark blue/black background
        surface: "#0b182f",    // Dark blue card / panel background
        surfaceRaised: "#162846", // Raised panels
        border: "#253b61",     // Borders
        cream: "#f8fafc",      // Primary text
        muted: "#94a3b8",      // Secondary text
        primary: { 
          DEFAULT: "#38bdf8",  // Bright light blue/cyan
          dim: "#0284c7",      
          soft: "#7dd3fc",     
        },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Charleston-inspired palette (harbor blues + pluff-mud / palmetto accents)
        harbor: {
          50: "#eef6fb",
          100: "#d6eaf5",
          200: "#aed4ea",
          300: "#7bb8da",
          400: "#4a98c6",
          500: "#2c7bac",
          600: "#22618c",
          700: "#1d4f72",
          800: "#1b425e",
          900: "#1a3850",
          950: "#102434",
        },
        palmetto: {
          50: "#f1f9ed",
          100: "#dff1d6",
          200: "#c0e4ae",
          300: "#97d07d",
          400: "#71b853",
          500: "#539b36",
          600: "#3f7c28",
          700: "#326022",
          800: "#2b4d20",
          900: "#26421f",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        glass: "rgba(255,255,255,0.1)"
      },
      backdropBlur: {
        xs: "2px"
      }
    },
  },
  plugins: [],
};

export default config;

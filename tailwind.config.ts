import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        pearl: {
          light: '#F0F3F5',
          DEFAULT: '#E5E9EB',
          dark: '#D1D5D7',
        },
        gold: {
          light: '#E5C158',
          DEFAULT: '#D4AF37',
          dark: '#B69220',
        },
        rose: {
          light: '#F5C5C9',
          DEFAULT: '#E8B4B8',
          dark: '#D49FA3',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

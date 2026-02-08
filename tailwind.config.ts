import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#1a237e',
          DEFAULT: '#0d47a1',
          light: '#1565c0',
        },
        accent: {
          gold: '#ffd700',
          'gold-dark': '#ccac00',
        },
        dark: {
          bg: '#0a0a0a',
          card: '#121212',
          border: '#1f1f1f',
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: '#F5A800', 50: '#FFF8E7', 500: '#F5A800', 600: '#D08C00', 700: '#A66E00' },
        secondary: { DEFAULT: '#2A9A58', 500: '#2A9A58', 600: '#228A4C' },
      },
      fontFamily: {
        dzongkha: ['Jomolhari', 'Tibetan Machine Uni', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;

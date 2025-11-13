import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: [
    './apps/dashboard/index.html',
    './apps/dashboard/src/**/*.{vue,js,ts,jsx,tsx}',
    './packages/*/src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        background: '#05060a',
        foreground: '#e9f1ff',
        primary: {
          DEFAULT: '#4bbcff',
          foreground: '#05060a'
        },
        accent: {
          DEFAULT: '#8b5cf6',
          foreground: '#f5f3ff'
        }
      },
      boxShadow: {
        glow: '0 0 40px rgba(75, 188, 255, 0.4)'
      }
    }
  },
  plugins: [tailwindcssAnimate]
};

export default config;

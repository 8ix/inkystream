import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Vibrant theme colors
        ink: {
          black: '#1a1a1a',
          white: '#f5f5f5',
          gray: '#6b7280',
        },
        // Primary vibrant pink/magenta
        vibrant: {
          pink: '#d835ba',
          purple: '#8b5cf6',
          blue: '#3b82f6',
          cyan: '#06b6d4',
        },
        // Category colors
        category: {
          landscapes: '#10b981',
          family: '#f472b6',
          art: '#a855f7',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      backgroundImage: {
        'gradient-vibrant': 'linear-gradient(135deg, #d835ba 0%, #8b5cf6 50%, #3b82f6 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, #1a1a1a 0%, #2d1f3d 100%)',
      },
    },
  },
  plugins: [],
};

export default config;

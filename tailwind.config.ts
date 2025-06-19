/** @type {import('tailwindcss').Config} */
import type { Config } from 'tailwindcss';

const config: Config & { daisyui?: Record<string, unknown> } = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)', // Blue-600 (light) / Blue-500 (dark)
        secondary: 'var(--secondary)', // Gray-500 (light) / Gray-400 (dark)
        accent: 'var(--accent)', // Teal-500 (light) / Teal-400 (dark)
        success: 'var(--success)', // Green-600 (light) / Green-500 (dark)
        error: 'var(--error)', // Red-600 (light) / Red-500 (dark)
        background: 'var(--background)', // Gray-50 (light) / Gray-900 (dark)
        foreground: 'var(--foreground)', // Gray-900 (light) / Gray-50 (dark)
      },
    },
  },
};

export default config;
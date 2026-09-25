import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: '#060606',
        coal: '#101011',
        paper: '#ECEBE7',
        bone: '#F6F5F2',
        ash: '#8D8C88',
        smoke: '#62615D',
        led: '#8FB8FF',
      },
      fontFamily: {
        wide: ['"KAIRO Ruble Display"', 'var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['"KAIRO Ruble Text"', 'var(--font-body)', 'system-ui', 'sans-serif'],
      },
      maxWidth: { page: '1440px' },
      transitionTimingFunction: { out: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    },
  },
  plugins: [],
};

export default config;

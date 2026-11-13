/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FEF2F2',
          100: '#FDE3E3',
          200: '#FBCBCB',
          300: '#F7A4A5',
          400: '#F06E70',
          500: '#E5393C',
          600: '#D71920',
          700: '#B3141A',
          800: '#94151A',
          900: '#7A171B',
        },
      },
      fontFamily: {
        sans: ['Inter', '"Noto Sans Sinhala"', 'Nirmala UI', 'Iskoola Pota', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(24 24 27 / 0.04), 0 1px 3px 0 rgb(24 24 27 / 0.06)',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        corporate: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          // Premium Gold Overrides
          gold: {
            light: '#FFEB3B',
            DEFAULT: '#FFD700',
            dark: '#EAB308',
            deep: '#CA8A04',
          }
        },
        // Re-purposing mustard for metallic transitions
        mustard: {
          50: '#fdfcf0',
          100: '#fbf9e1',
          200: '#f7f3c2',
          300: '#f3eda4',
          400: '#efe785',
          500: '#ebe167',
          600: '#bc9d4b', // Bronze transition
          700: '#91793a',
          800: '#665529',
          900: '#3c3218',
        },
      },
      boxShadow: {
        'modern-sm': '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'modern': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'modern-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'modern-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'modern-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'premium': '0 0 50px -12px rgba(0, 0, 0, 0.25)',
        'glow': '0 0 20px rgba(212, 175, 55, 0.15)',
        'gold-glow': '0 0 25px rgba(212, 175, 55, 0.25)',
        'inner-gold': 'inset 0 0 10px rgba(212, 175, 55, 0.05)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

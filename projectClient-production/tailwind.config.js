/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // "Display" font — for headings, card titles, nav links
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        // "Body/UI" font — for labels, badges, body copy, meta text
        sans: ['Inter', 'sans-serif'],
      },

      // Enable backdrop filters for glassmorphism
      backdropBlur: {
        xs: '2px',
      },
      // Add custom box shadows for glow effects
      boxShadow: {
        'glow-yellow': '0 0 20px rgba(255, 193, 7, 0.6), 0 0 40px rgba(255, 193, 7, 0.3)',
        'glow-yellow-sm': '0 0 10px rgba(255, 193, 7, 0.4)',
      },
      // Add animations for modals
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
        scaleIn: 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0.9)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eefff4',
          100: '#d7ffe7',
          200: '#b2ffd0',
          300: '#76ffab',
          400: '#33f57f',
          500: '#09dc5a',
          600: '#00b747',
          700: '#048f3b',
          800: '#0a7033',
          900: '#0a5c2c',
          950: '#003416',
        },
        surface: {
          50: '#f4f6fb',
          100: '#e9ecf5',
          200: '#ced5e9',
          300: '#a3b1d6',
          400: '#7288bf',
          500: '#506aa8',
          600: '#3e538d',
          700: '#334372',
          800: '#1e2a4a',
          900: '#141c33',
          950: '#0b1120',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 10s linear infinite',
        'bounce-sm': 'bounceSm 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(9,220,90,0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(9,220,90,0.5)' },
        },
        bounceSm: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(2deg)' },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#13151A',
          800: '#1D2027',
          700: '#2A2E37',
        },
        paper: '#F6F4EE',
        steel: {
          300: '#C7CAD1',
          400: '#9A9FA8',
          600: '#5B6068',
          800: '#3A3E44',
        },
        ember: {
          DEFAULT: '#9A2B1F',
          50: '#FBEEEC',
          500: '#9A2B1F',
          600: '#7E241A',
          700: '#671D15',
        },
        brass: {
          DEFAULT: '#B08D57',
          400: '#C7A876',
          600: '#93753F',
        },
      },
      fontFamily: {
        display: ['"Oswald"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '.22em',
      },
    },
  },
  plugins: [],
};

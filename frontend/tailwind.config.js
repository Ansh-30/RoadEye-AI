/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        forest: '#1E3B2F',
        sage: '#7F8C6A',
        sand: '#C8B48A',
        ivory: '#F5F0E6',
        darkText: '#24342C',
        secondaryText: '#77796F',
        border: '#E5E0D5',
        white: '#FFFFFF'
      },
      boxShadow: {
        soft: '0 18px 40px rgba(30, 59, 47, 0.10)',
        card: '0 10px 25px rgba(36, 52, 44, 0.08)'
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0d0e12',
        panel: '#16181d',
        line: '#2a2d35',
        mute: '#9aa0ab',
        saffron: '#ff9a3c'
      }
    }
  },
  plugins: []
};

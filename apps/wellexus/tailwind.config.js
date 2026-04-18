/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        mint:             '#A8EDCA',
        lavender:         '#C9B8F5',
        cream:            '#FAFAF7',
        charcoal:         '#1A1A2E',
        'mint-light':     '#D4F5E5',
        'lavender-light': '#E8E0FB',
        'charcoal-light': '#2E2E4A',
      },
      fontFamily: {
        poppins:          ['Poppins_400Regular'],
        'poppins-medium': ['Poppins_500Medium'],
        'poppins-semi':   ['Poppins_600SemiBold'],
        'poppins-bold':   ['Poppins_700Bold'],
      },
    },
  },
  plugins: [],
};

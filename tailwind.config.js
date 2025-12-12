module.exports = {
  content: [
    './src/renderer/index.html',
    './src/**/*.{js,ts,jsx,tsx,html}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#171717',
        secondary: '#d4d4d4',
        neutral: {
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        accent: {
          500: '#f97316',
          600: '#ea580c',
        },
        success: {
          500: '#22c55e',
          600: '#16a34a',
        },
        danger: {
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        'slide-up-fast': {
          'from': { transform: 'translateY(0)' },
          'to': { transform: 'translateY(-20px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-in-out',
        'slide-up-fast': 'slide-up-fast 0.5s ease-in-out forwards',
      },
    },
  },
  plugins: [],
}
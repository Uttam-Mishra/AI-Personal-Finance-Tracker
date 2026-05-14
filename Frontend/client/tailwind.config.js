/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        shell: '#EEF4FF',
        ink: '#0F172A',
        muted: '#64748B'
      },
      boxShadow: {
        glass: '0 24px 70px rgba(15, 23, 42, 0.12)',
        glow: '0 18px 60px rgba(37, 99, 235, 0.28)'
      }
    }
  },
  plugins: []
};

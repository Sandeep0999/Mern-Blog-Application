/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // DailyPen design token surface layers
        dp: {
          bg:       '#0c0e14', // deep charcoal page bg
          s1:       '#111318', // surface level 1 (card base)
          s2:       '#161820', // surface level 2 (card elevated)
          s3:       '#1c1f2b', // surface level 3 (hover)
          border:   '#252836', // default dark border
          muted:    '#4b5063', // muted text / icons
          subtle:   '#6b7280', // secondary text
          label:    '#9ca3af', // labels / timestamps
          body:     '#d1d8e4', // body text
          heading:  '#f0f2f8', // headings / primary text
          accent:   '#f59e0b', // warm amber accent (matches navbar)
          'accent-dim': '#92400e', // dim accent
        },
      },
      boxShadow: {
        'card-dark': '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
        'card-hover-dark': '0 8px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.07)',
        'widget-dark': '0 2px 8px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04)',
      },
    },
  },
  plugins: [],
};
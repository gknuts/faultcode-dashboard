/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'app':       '#000000',
        'panel':     '#2A2A2C',
        'row':       '#161618',
        'row-left':  '#0B0B0C',
        'control':   '#1C1C1E',
        'border-c':  '#3A3A3C',
        'grid-c':    '#1F1F22',
        'text-c':    '#FFFFFF',
        'muted':     '#A1A1AA',
        'accent':    '#6C4BF5',
        'abnormal':  '#F0436A',
        'normal-c':  '#2ECC71',
        'today-c':   '#4A4A4E',
        'hover-halo':'rgba(255,255,255,0.18)',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}

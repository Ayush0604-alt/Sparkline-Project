/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Orange Industrial theme — required by design brief.
        brand: {
          DEFAULT: '#F97316', // primary
          dark: '#EA580C',    // accent / hover states
          light: '#FB923C',   // secondary accent
          pale: '#FDBA74',    // tertiary accent / badges
          bg: '#FFF7ED',      // light orange background tint
        },
        status: {
          active: '#16A34A',  // green
          idle: '#D97706',    // amber
          fault: '#DC2626',   // red
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(234, 88, 12, 0.08), 0 1px 2px -1px rgba(234, 88, 12, 0.08)',
        'card-hover': '0 4px 12px -2px rgba(234, 88, 12, 0.15)',
      },
    },
  },
  plugins: [],
};

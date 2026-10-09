/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f2f8f1',
        paper: '#ffffff',
        line: '#dbe9dd',
        ink: {
          DEFAULT: '#0c2318',
          soft: '#3d5b4b',
          mute: '#54705f',
        },
        forest: {
          50: '#eef8f0',
          100: '#d6efdc',
          200: '#aee1c0',
          300: '#7fcda2',
          400: '#4fb483',
          500: '#2f9e6b',
          600: '#1f8057',
          700: '#186647',
          800: '#15513b',
          900: '#103d2e',
          950: '#07211a',
        },
        ember: {
          200: '#ffe3b0',
          300: '#ffcd7d',
          400: '#ffb648',
          500: '#f79726',
          600: '#dd7611',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'ui-rounded', 'system-ui', 'sans-serif'],
        display: ['"Baloo 2"', 'Nunito', 'ui-rounded', 'sans-serif'],
      },
      borderRadius: {
        card: '22px',
        pill: '999px',
        cell: '7px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(9, 45, 30, 0.04), 0 12px 28px -18px rgba(9, 45, 30, 0.22)',
        lift: '0 2px 4px rgba(9, 45, 30, 0.05), 0 24px 44px -24px rgba(9, 45, 30, 0.3)',
        ring: '0 0 0 3px rgba(47, 158, 107, 0.22)',
        glow: '0 0 22px -4px rgba(247, 151, 38, 0.55)',
      },
      transitionTimingFunction: {
        springy: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        glide: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.82)' },
          '60%': { transform: 'scale(1.06)' },
          '100%': { transform: 'scale(1)' },
        },
        rise: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        flicker: {
          '0%,100%': { transform: 'scale(1) rotate(-2deg)', opacity: '0.95' },
          '50%': { transform: 'scale(1.08) rotate(2deg)', opacity: '1' },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(-140px) rotate(320deg)', opacity: '0' },
        },
      },
      animation: {
        pop: 'pop 260ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        rise: 'rise 320ms cubic-bezier(0.22, 0.61, 0.36, 1) both',
        shimmer: 'shimmer 1.4s linear infinite',
        flicker: 'flicker 1.8s ease-in-out infinite',
        confetti: 'confetti 900ms cubic-bezier(0.22, 0.61, 0.36, 1) forwards',
      },
    },
  },
  plugins: [],
};

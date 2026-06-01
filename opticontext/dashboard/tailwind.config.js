/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base:     '#FAF8F4',
        raised:   '#F4F1EB',
        sunken:   '#EFECE4',
        'text-primary':    '#1A1A18',
        'text-secondary':  '#4A4A45',
        'text-muted':      '#8A8A82',
        'text-inverse':    '#FAF8F4',
        accent: {
          DEFAULT: '#1A6B4A',
          hover:   '#155C3E',
          subtle:  '#E8F4EE',
          text:    '#1A6B4A',
        },
        border: {
          DEFAULT: '#E2DED5',
          strong:  '#C8C4BB',
          accent:  '#A8D4BC',
        },
        status: {
          success: '#1A6B4A',
          warning: '#B45309',
          error:   '#B91C1C',
          neutral: '#6B7280',
        },
        code: {
          surface: '#1C1C1A',
          text:    '#E8E4DC',
          accent:  '#5EC99A',
          muted:   '#8A9BA8',
          string:  '#D4A76A',
        },
      },
      fontFamily: {
        display: ['Zodiak', 'Georgia', 'serif'],
        body:    ['Switzer', 'Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1.4' }],
        xs:    ['0.75rem',  { lineHeight: '1.4' }],
        sm:    ['0.875rem', { lineHeight: '1.5' }],
        base:  ['1rem',     { lineHeight: '1.6' }],
        lg:    ['1.125rem', { lineHeight: '1.5' }],
        xl:    ['1.375rem', { lineHeight: '1.4' }],
        '2xl': ['1.75rem',  { lineHeight: '1.3' }],
        '3xl': ['2.25rem',  { lineHeight: '1.2' }],
        '4xl': ['3rem',     { lineHeight: '1.1' }],
        '5xl': ['4rem',     { lineHeight: '1.0' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      maxWidth: {
        content: '1120px',
        'content-narrow': '780px',
      },
      borderRadius: {
        none: '0',
        sm:   '4px',
        md:   '8px',
        lg:   '12px',
        xl:   '16px',
        full: '9999px',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'fade-rise': {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%':      { transform: 'translateX(-4px)' },
          '75%':      { transform: 'translateX(4px)' },
        },
      },
      animation: {
        'fade-rise': 'fade-rise 200ms cubic-bezier(0.4, 0, 0.2, 1) both',
        'fade-in':   'fade-in 200ms ease both',
        'shake':     'shake 300ms ease',
      },
    },
  },
  plugins: [],
};

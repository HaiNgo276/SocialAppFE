/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      xs: '512px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      xxl: '1440px',
      '3xl': '1600px'
    },
    fontSize: {
      /** Heading */
      h0: ['6rem', '7rem'],
      h1: ['3.5rem', '4.5rem'],
      h2: ['3rem', '3.5rem'],
      h3: ['2.5rem', '3rem'],
      h4: ['2rem', '2.5rem'],
      h5: ['1.5rem', '2rem'],
      /** body */
      xs: ['0.75rem', '1rem'],
      sm: ['0.875rem', '1.25rem'],
      base: ['1rem', '1.5rem'],
      md: ['1.125rem', '1.75rem'],
      lg: ['1.25rem', '1.75rem'],
      xl: ['1.5rem', '2.25rem'],
      '2xl': ['1.625rem', '2.5rem'],
      '4xl': ['2rem', '3rem']
    },
    extend: {
      minHeight: {
        content: 'calc(100vh - 66px)'
      },
      spacing: {
        '100': '100px'
      },
      colors: {
        error: '#FB324A',
        background: {
          1: '#FFFFFF',
          tick: '#D3ECEE',
          card: '#F6F5F8',
          row: '#F7FAFB'
        },
        text: {
          primary: '#0D5B63',
          2: '#7C7C7C',
          3: '#0079F4'
        },
        neutral: {
          1: '#282D57',
          2: '#3D4585',
          7: '#DCDEEF',
          9: '#FFFFFF'
        }
      }
    },
    boxShadow: {
      header: '0px 1px 40px 0px rgba(152, 159, 186, 0.10)',
      popup: '0px 1px 15px 1px rgba(9, 14, 24, 0.10)'
    }
  },
  plugins: [],
  darkMode: 'selector'
}

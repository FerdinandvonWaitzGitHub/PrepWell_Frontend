/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand colors (pink/red variants)
        primary: {
          50: '#FFE7E7',
          100: '#FFD7D7',
          200: '#FFCECE',
          300: '#FFC3C3',
          400: '#FFC4C4',
          600: '#E85A5A',
        },
        // Extended gray scale - Figma-aligned
        gray: {
          50: '#F5F5F5',   // Secondary BG (Figma)
          100: '#EFEFEF',
          200: '#E5E5E5',  // Border (Figma)
          300: '#D4D4D4',
          400: '#A3A3A3',  // Muted Text (Figma) - was #9CA3AF
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A',
        },
        // Neutral scale for text/backgrounds - Figma-aligned
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',  // Secondary BG (Figma)
          200: '#E5E5E5',  // Border (Figma)
          300: '#D4D4D4',
          400: '#A3A3A3',  // Muted Text/Description (Figma)
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        // Blue variants
        blue: {
          50: '#DBEAFE',
          100: '#EBEAFF',
          900: '#1E3A8A',
        },
        // Green for success states
        green: {
          100: '#DCFCE7',
          600: '#16A34A',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
      fontWeight: {
        extralight: '200',  // Figma H1 titles
        light: '300',       // Figma inactive nav
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      fontSize: {
        // Figma-aligned sizes
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],  // Figma H1
        '3xl': ['30px', { lineHeight: '36px' }],
      },
      spacing: {
        '0.5': '2px',
        '1.25': '5px',
        '2.25': '9px',
        '2.5': '10px',    // Figma task padding
        '2.75': '11px',
        '3.75': '15px',
        '4.25': '17px',
        '4.5': '18px',
        '6.25': '25px',   // Figma container padding
        '7.5': '30px',
        '12.5': '50px',
        '27': '108px',
        '41.25': '165px',
        '50': '200px',
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '8px',      // Figma card radius
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}

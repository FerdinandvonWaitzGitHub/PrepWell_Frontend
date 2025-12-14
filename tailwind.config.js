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
        },
        // Extended gray scale
        gray: {
          50: '#F5F5F5',
          100: '#EFEFEF',
          200: '#E5E5E5',
          400: '#9CA3AF',
          500: '#737373',
          600: '#777777',
          900: '#171717',
          950: '#0A0A0A',
        },
        // Blue variants
        blue: {
          50: '#DBEAFE',
          100: '#EBEAFF',
          900: '#1E3A8A',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
      },
      spacing: {
        '0.5': '2px',
        '1.25': '5px',
        '2.25': '9px',
        '2.75': '11px',
        '3.75': '15px',
        '4.25': '17px',
        '4.5': '18px',
        '7.5': '30px',
        '12.5': '50px',
        '27': '108px',
        '41.25': '165px',
        '50': '200px',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}

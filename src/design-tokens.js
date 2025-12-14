/**
 * Design Tokens extracted from Figma
 * File: PrepWell WebApp
 * Last Modified: 2025-12-11
 */

export const designTokens = {
  colors: {
    // Primary Colors
    white: '#FFFFFF',
    black: '#000000',

    // Grays
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

    // Red/Pink variants (appears to be primary brand color)
    primary: {
      50: '#FFE7E7',
      100: '#FFD7D7',
      200: '#FFCECE',
      300: '#FFC3C3',
      400: '#FFC4C4',
    },

    // Blue variants
    blue: {
      50: '#DBEAFE',
      100: '#EBEAFF',
      900: '#1E3A8A',
    },
  },

  fonts: {
    family: {
      sans: ['DM Sans', 'sans-serif'],
    },
    weight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
    },
    size: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
    },
  },

  spacing: {
    0.5: '2px',
    1: '4px',
    1.25: '5px',
    2: '8px',
    2.25: '9px',
    2.5: '10px',
    2.75: '11px',
    3: '12px',
    3.75: '15px',
    4: '16px',
    4.25: '17px',
    4.5: '18px',
    5: '20px',
    7.5: '30px',
    12.5: '50px',
    27: '108px',
    41.25: '165px',
    50: '200px',
  },

  shadows: {
    xs: 'shadow-xs', // From Figma text styles
  },
};

export default designTokens;

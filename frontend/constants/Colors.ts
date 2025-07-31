// constants/Colors.ts
/**
 * Sistema de colores combinado
 */

const tintColorLight = '#8D6E63';  // Color café unificado
const tintColorDark = '#D2691E';

// Sistema original de tu compañero (actualizado con colores café)
export const Colors = {
  light: {
    text: '#11181C',
    background: '#F5F5F5',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    border: '#E4E7EB',
    textSecondary: '#687076',
    card: '#F8F9FA'
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    border: '#2D3235',
    textSecondary: '#9BA1A6',
    card: '#1E2021'
  },
  
  // Sistema nuevo para Cafe Cerca
  primary: '#8D6E63',
  secondary: '#D2691E',
  background: '#F5F5F5',
  white: '#FFFFFF',
  black: '#000000',
  
  gray: {
    100: '#F5F5F5',
    200: '#E0E0E0',
    300: '#BDBDBD',
    400: '#9E9E9E',
    500: '#757575',
    600: '#616161',
    700: '#424242',
    800: '#212121',
    900: '#000000',
  },
  
  text: {
    primary: '#333333',
    secondary: '#666666',
    light: '#999999',
  },
  
  error: '#F44336',
  success: '#4CAF50',
  warning: '#FF9800',
  info: '#2196F3',
};
import Constants from 'expo-constants';

// Función para obtener la URL de la API dinámicamente
const getApiUrl = () => {
  if (__DEV__) {
    // En desarrollo, obtener la IP dinámica del manifest de Expo
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      // hostUri tiene el formato "192.168.x.x:19000"
      const devServerIp = hostUri.split(':')[0];
      // Usar el puerto del backend (3000)
      return `http://${devServerIp}:3000/api`;
    }
    console.warn('No se pudo obtener la IP del servidor de desarrollo. Usando localhost.');
  }
  
  // Fallback a localhost o URL de producción
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
};

// Configuración de la API y endpoints
export const API_CONFIG = {
  // URL base de la API que se actualiza dinámicamente
  BASE_URL: getApiUrl(),
  
  // Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
    },
    VISITAS: '/visitas',
    CAFES: '/cafes',
    ESTADISTICAS: '/estadisticas',
  }
};

// Otras configuraciones globales pueden ir aquí 
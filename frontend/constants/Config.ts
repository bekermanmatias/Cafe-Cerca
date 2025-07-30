import Constants from 'expo-constants';

// Obtiene la URL del servidor del manifest de Expo o usa un valor por defecto
const getApiUrl = () => {
  if (__DEV__) {
    // En desarrollo, obtener la IP dinámica del manifest de Expo
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      // hostUri tiene el formato "192.168.x.x:19000"
      const devServerIp = hostUri.split(':')[0];
      return `http://${devServerIp}:3000/api`;
    }
    console.warn('No se pudo obtener la IP del servidor de desarrollo. Usando localhost.');
    return 'http://localhost:3000/api';
  }
  
  // En producción, usa tu servidor real
  return 'https://tu-servidor-produccion.com/api';
};

// Exportar la URL base de la API
export const API_URL = getApiUrl();

// Configuración de endpoints de la API
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_URL}/auth/login`,
    REGISTER: `${API_URL}/auth/register`,
    UPDATE_PROFILE_IMAGE: `${API_URL}/auth/profile-image`,
  },
  CAFES: `${API_URL}/cafes`,
  VISITAS: `${API_URL}/visitas`,
  ESTADISTICAS: `${API_URL}/estadisticas`,
  COMENTARIOS: {
    GET_BY_VISITA: (visitaId: number) => `${API_URL}/visita/${visitaId}/comentarios`,
    CREATE: (visitaId: number) => `${API_URL}/visita/${visitaId}/comentarios`,
    UPDATE: (comentarioId: number) => `${API_URL}/comentarios/${comentarioId}`,
    DELETE: (comentarioId: number) => `${API_URL}/comentarios/${comentarioId}`,
  },
  LIKES: {
    TOGGLE: (visitaId: number) => `${API_URL}/likes/toggle/${visitaId}`,
    GET_STATUS: (visitaId: number) => `${API_URL}/likes/status/${visitaId}`,
    GET_LIKED_VISITAS: `${API_URL}/likes`
  },
  SAVED_CAFES: {
    TOGGLE: (cafeId: number) => `${API_URL}/saved-cafes/toggle/${cafeId}`,
    GET_STATUS: (cafeId: number) => `${API_URL}/saved-cafes/status/${cafeId}`,
    GET_ALL: `${API_URL}/saved-cafes`
  }
};

// Para mantener compatibilidad con el código existente
export const API_CONFIG = {
  BASE_URL: API_URL,
  ENDPOINTS: API_ENDPOINTS
};

// Otras configuraciones globales pueden ir aquí 
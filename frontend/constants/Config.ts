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
  VISITAS: {
    BASE: `${API_URL}/visitas`,
    UPDATE: (visitaId: number) => `${API_URL}/visitas/${visitaId}`,
  },
  ESTADISTICAS: `${API_URL}/estadisticas`,
  COMENTARIOS: {
    GET_BY_VISITA: (visitaId: number) => `${API_URL}/comentarios/visita/${visitaId}`,
    CREATE: (visitaId: number) => `${API_URL}/comentarios/visita/${visitaId}`,
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
  },
  AMIGOS: {
    ENVIAR_SOLICITUD: `${API_URL}/amigos/enviar`,
    RESPONDER_SOLICITUD: (solicitudId: number) => `${API_URL}/amigos/responder/${solicitudId}`,
    CANCELAR_SOLICITUD: (solicitudId: number) => `${API_URL}/amigos/solicitud/${solicitudId}`,
    ELIMINAR_AMIGO: `${API_URL}/amigos/eliminar`,
    GET_LISTA: `${API_URL}/amigos/lista`,
    GET_SOLICITUDES_RECIBIDAS: `${API_URL}/amigos/solicitudes/recibidas`,
    GET_SOLICITUDES_ENVIADAS: `${API_URL}/amigos/solicitudes/enviadas`
  },
  VISITAS_COMPARTIDAS: {
    CREATE: `${API_URL}/visitas/compartida`,
    RESPONDER_INVITACION: (visitaId: number) => `${API_URL}/visita-participantes/${visitaId}/respuesta`,
    GET_INVITACIONES_PENDIENTES: `${API_URL}/visita-participantes/invitaciones-pendientes`,
    GET_MIS_VISITAS_COMPARTIDAS: `${API_URL}/visitas/compartidas`,
    GET_VISITA_COMPARTIDA: (visitaId: number) => `${API_URL}/visitas/${visitaId}`
  },
  RESENAS: {
    CREATE: `${API_URL}/resenas`,
    GET_BY_VISITA: (visitaId: number) => `${API_URL}/resenas/visita/${visitaId}`,
    UPDATE: (resenaId: number) => `${API_URL}/resenas/${resenaId}`,
    DELETE: (resenaId: number) => `${API_URL}/resenas/${resenaId}`,
  },
  USERS: {
    GET_PROFILE: `${API_URL}/users/profile`,
    UPDATE_PROFILE: `${API_URL}/users/profile`,
    SEARCH: `${API_URL}/users/search`
  }
};

// Para mantener compatibilidad con el código existente
export const API_CONFIG = {
  BASE_URL: API_URL,
  ENDPOINTS: API_ENDPOINTS
};

// Otras configuraciones globales pueden ir aquí 
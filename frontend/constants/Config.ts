import Constants from 'expo-constants';

// Función para obtener la IP del backend
const getBackendUrl = () => {
  if (__DEV__) {
    // En desarrollo, intentamos usar la IP del manifest de Expo
    const manifestUrl = Constants.manifest2?.extra?.expoClient?.hostUri;
    if (manifestUrl) {
      // El hostUri tiene el formato "ip:puerto", tomamos solo la IP
      const ip = manifestUrl.split(':')[0];
      return `http://${ip}:4000`; // Puerto por defecto del backend
    }
    return 'http://localhost:4000'; // Fallback a localhost con puerto 4000
  }
  return 'https://cafe-cerca.com'; // URL de producción
};

export const API_URL = getBackendUrl(); 
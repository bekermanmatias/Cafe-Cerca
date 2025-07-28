import Constants from 'expo-constants';

// Obtiene la URL del servidor del manifest de Expo o usa un valor por defecto
const getApiUrl = () => {
  if (__DEV__) {
    // En desarrollo, obtener la IP dinámica del manifest de Expo
    const hostUri = Constants.expoConfig?.hostUri || '';
    // hostUri tiene el formato "192.168.x.x:19000"
    const devServerIp = hostUri.split(':')[0];
    
    if (!devServerIp) {
      console.warn('No se pudo obtener la IP del servidor de desarrollo. Usando localhost.');
      return 'http://localhost:3000/api';
    }

    // Para debug
    const apiUrl = `http://${devServerIp}:3000/api`;
    console.log('API URL configurada:', apiUrl);
    return apiUrl;
  }
  
  // En producción, usa tu servidor real
  return 'https://tu-servidor-produccion.com/api';
};

export const API_URL = getApiUrl();

// Otras configuraciones globales pueden ir aquí 
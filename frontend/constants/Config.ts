import Constants from 'expo-constants';

// Obtiene la URL del servidor del manifest de Expo o usa un valor por defecto
const getApiUrl = () => {
  if (__DEV__) {
    // En desarrollo, intenta usar la URL del manifest de Expo
    const manifestServer = Constants.expoConfig?.hostUri
      ? Constants.expoConfig.hostUri.split(':').slice(0, -1).join(':')
      : null;
    
    // Si no hay URL en el manifest, usa localhost
    return manifestServer
      ? `http://${manifestServer}:3000/api`
      : 'http://localhost:3000/api';
  }
  
  // En producción, usa tu servidor real
  return 'https://tu-servidor-produccion.com/api';
};

export const API_URL = getApiUrl();

// Otras configuraciones globales pueden ir aquí 
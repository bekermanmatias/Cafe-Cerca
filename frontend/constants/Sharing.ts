import { Share, Platform } from 'react-native';
import Constants from 'expo-constants';

// URL base para desarrollo y producción
const BASE_URL = __DEV__
  ? 'http://192.168.0.11:8081'
  : 'https://cafe-cerca.com';

const createShortUrl = async (longUrl: string) => {
  try {
    const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
    if (!response.ok) throw new Error('Error creating short URL');
    return await response.text();
  } catch (error) {
    console.error('Error creating short URL:', error);
    return longUrl; // Fallback a la URL original si hay error
  }
};

export const shareVisit = async (visitId: number | string) => {
  try {
    // Asegurarnos de que el ID sea un string limpio sin caracteres especiales
    const cleanId = String(visitId).replace(/[^0-9]/g, '');
    
    // Crear la URL completa
    const longUrl = `${BASE_URL}/visit-details?visitId=${cleanId}`;
    
    // Obtener la URL corta
    const shortUrl = await createShortUrl(longUrl);
    
    // Crear el mensaje con la URL corta
    const messageLines = [
      '¡Mira esta visita en Café Cerca! 👀☕️',
      '',
      shortUrl,
      '',
      '¡Toca el enlace para ver los detalles!'
    ];

    const message = messageLines.join('\n');

    const result = await Share.share({
      message,
      url: shortUrl,
      title: '¡Comparte esta visita!'
    }, {
      dialogTitle: '¡Comparte esta visita!',
      tintColor: '#8D6E63',
      subject: '¡Mira esta visita en Café Cerca!'
    });

    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        console.log('Shared with activity type:', result.activityType);
      } else {
        console.log('Shared');
      }
    } else if (result.action === Share.dismissedAction) {
      console.log('Share dismissed');
    }
  } catch (error) {
    console.error('Error sharing:', error);
  }
}; 
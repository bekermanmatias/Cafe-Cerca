import { Share, Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_URL } from './Config';

// URL base para desarrollo y producción
const BASE_URL = API_URL;

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

export const shareDiary = async (userId: number | string = 1) => {
  try {
    // Asegurarnos de que el ID sea un string limpio sin caracteres especiales
    const cleanId = String(userId).replace(/[^0-9]/g, '');
    
    // Crear la URL completa
    const longUrl = `${BASE_URL}/diary?userId=${cleanId}`;
    
    // Obtener la URL corta
    const shortUrl = await createShortUrl(longUrl);
    
    // Crear el mensaje con la URL corta
    const messageLines = [
      '¡Mira mi diario de café en Café Cerca! ☕️📖',
      '',
      '¡Descubre todas las cafeterías que he visitado y mis experiencias!',
      '',
      shortUrl,
      '',
      '¡Toca el enlace para ver mi diario completo!'
    ];

    const message = messageLines.join('\n');

    const result = await Share.share({
      message,
      url: shortUrl,
      title: '¡Comparte tu diario de café!'
    }, {
      dialogTitle: '¡Comparte tu diario!',
      tintColor: '#8D6E63',
      subject: '¡Mira mi diario de café en Café Cerca!'
    });

    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        console.log('Shared diary with activity type:', result.activityType);
      } else {
        console.log('Shared diary');
      }
    } else if (result.action === Share.dismissedAction) {
      console.log('Share diary dismissed');
    }
  } catch (error) {
    console.error('Error sharing diary:', error);
  }
}; 
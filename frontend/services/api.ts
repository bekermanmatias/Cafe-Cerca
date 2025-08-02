// services/api.ts
import { API_URL, API_ENDPOINTS } from '../constants/Config';
import { storage, StorageKeys } from '../utils/storage';

interface User {
  id: number;
  email: string;
  name: string;
  profileImage?: string;
}

// Función para limpiar la sesión cuando se detecte un token inválido
const clearInvalidSession = async () => {
  console.log('🔐 Limpiando sesión inválida...');
  await storage.removeItem(StorageKeys.TOKEN);
  await storage.removeItem(StorageKeys.USER);
};

// Función para limpiar automáticamente token corrupto
const cleanCorruptedToken = async () => {
  const token = await storage.getItem(StorageKeys.TOKEN);
  if (token === '[object Object]' || (token && token.includes('"id"'))) {
    console.log('🔐 Token corrupto detectado, limpiando...');
    console.log('🔐 Token corrupto:', token);
    await storage.removeItem(StorageKeys.TOKEN);
    await storage.removeItem(StorageKeys.USER);
    return true;
  }
  return false;
};

// Función para limpiar manualmente la sesión (para casos de emergencia)
export const clearSession = async () => {
  console.log('🔐 Limpiando sesión manualmente...');
  await storage.removeItem(StorageKeys.TOKEN);
  await storage.removeItem(StorageKeys.USER);
};



// Función para regenerar el token si está corrupto
export const regenerateToken = async () => {
  console.log('🔐 Regenerando token...');
  const currentToken = await storage.getItem(StorageKeys.TOKEN);
  
  if (currentToken) {
    if (typeof currentToken === 'object') {
      console.log('🔐 Token detectado como objeto, convirtiendo a string...');
      const tokenString = JSON.stringify(currentToken);
      await storage.setItem(StorageKeys.TOKEN, tokenString);
      console.log('✅ Token regenerado como string');
      return tokenString;
    } else if (typeof currentToken === 'string') {
      // Verificar que no sea [object Object]
      if (currentToken === '[object Object]') {
        console.log('❌ Token es [object Object], limpiando...');
        await storage.removeItem(StorageKeys.TOKEN);
        return null;
      }
      console.log('✅ Token ya es string válido');
      return currentToken;
    }
  }
  
  console.log('❌ No se encontró token para regenerar');
  return null;
};

// Función para probar conectividad específica del endpoint de imagen
export const testProfileImageEndpoint = async () => {
  try {
    console.log('🔍 Probando endpoint de imagen de perfil...');
    const token = await storage.getItem(StorageKeys.TOKEN);
    
    if (!token) {
      console.log('❌ No hay token disponible');
      return false;
    }
    
    const tokenString = typeof token === 'string' ? token : JSON.stringify(token);
    const url = API_ENDPOINTS.AUTH.UPDATE_PROFILE_IMAGE;
    
    console.log('🔍 Probando URL:', url);
    
    const response = await fetch(url, {
      method: 'OPTIONS', // Usar OPTIONS para probar conectividad sin enviar datos
      headers: {
        'Authorization': `Bearer ${tokenString}`,
      },
    });
    
    console.log('🔍 Response status:', response.status);
    console.log('🔍 Response ok:', response.ok);
    
    return response.ok;
  } catch (error) {
    console.error('❌ Error probando endpoint de imagen:', error);
    return false;
  }
};

// Función para probar la conectividad con el backend
export const testBackendConnection = async () => {
  try {
    console.log('🔍 Probando conexión con backend en:', API_URL);
    
    // Probar múltiples URLs posibles
    const possibleUrls = [
      `${API_URL.replace('/api', '')}/health`,
      `${API_URL}/health`,
      'http://localhost:3000/health',
      'http://192.168.1.100:3000/health', // IP común en redes locales
      'http://10.0.2.2:3000/health', // Para emulador Android
    ];
    
    for (const url of possibleUrls) {
      try {
        console.log('🔍 Probando URL:', url);
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          console.log('✅ Backend conectado exitosamente en:', url);
          return true;
        }
      } catch (urlError) {
        const errorMessage = urlError instanceof Error ? urlError.message : 'Error desconocido';
        console.log('❌ Error probando URL:', url, errorMessage);
        continue;
      }
    }
    
    console.log('❌ No se pudo conectar con ninguna URL del backend');
    return false;
  } catch (error) {
    console.error('❌ Error general conectando con backend:', error);
    return false;
  }
};

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Friend {
  id: number;
  name: string;
  profileImage: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface RegisterResponse {
  token: string;
  user: User;
}

interface ProfileImageResponse {
  message: string;
  profileImage: string;
}

interface LikeResponse {
  liked: boolean;
  message: string;
  likesCount: number;
}

interface LikeStatusResponse {
  liked: boolean;
  likesCount: number;
}

interface SaveResponse {
  saved: boolean;
  message: string;
}

interface SaveStatusResponse {
  saved: boolean;
}

interface LikedVisitasResponse {
  message: string;
  totalVisitas: number;
  visitas: any[];
  sugerencia?: string;
}

interface SavedCafesResponse {
  message: string;
  totalCafes: number;
  cafes: any[];
  sugerencia?: string;
}

interface ComentarioResponse {
  message: string;
  comentario: {
    id: number;
    contenido: string;
    createdAt: string;
    usuario: {
      id: number;
      name: string;
      profileImage: string;
    };
  };
}

interface VisitaCompartidaRequest {
  cafeteriaId: number;
  comentario: string;
  calificacion: number;
  amigosIds: number[];
  maxParticipantes?: number;
}

interface VisitaCompartidaResponse {
  message: string;
  visita: {
    id: number;
    esCompartida: boolean;
    maxParticipantes: number;
    participantes: Array<{
      id: number;
      usuario: {
        id: number;
        name: string;
        profileImage: string;
      };
      rol: string;
      estado: string;
    }>;
  };
}

class ApiService {
  // Función para verificar si el servidor está funcionando
  async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL.replace('/api', '')}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      // Verificar si el servidor está funcionando
      const serverHealth = await this.checkServerHealth();
      if (!serverHealth) {
        throw new Error('El servidor backend no está disponible. Verifica que esté corriendo en el puerto 3000.');
      }

      const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error('Error en la respuesta del servidor');
      }

      if (!response.ok) {
        throw new Error(data.error || `Error al registrarse: ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
      }
      throw error;
    }
  }

  async updateProfileImage(imageUri: string): Promise<ProfileImageResponse> {
  // Limpiar token corrupto automáticamente
  const wasCleaned = await cleanCorruptedToken();
  if (wasCleaned) {
    throw new Error('Token corrupto detectado. Por favor, inicia sesión nuevamente.');
  }

  let token = await storage.getItem(StorageKeys.TOKEN);
  console.log('🔐 Token obtenido del storage:', typeof token, token);

  if (!token) {
    throw new Error('No se encontró el token de autenticación');
  }

  // Si el token es un objeto, intentar regenerarlo
  if (typeof token === 'object') {
    console.log('🔐 Token detectado como objeto, regenerando...');
    token = await regenerateToken();
    if (!token) {
      throw new Error('No se pudo regenerar el token');
    }
  }

  // Asegurar que el token sea una cadena
  const tokenString = typeof token === 'string' ? token : JSON.stringify(token);
  console.log('🔐 Token final a enviar:', typeof tokenString, tokenString.substring(0, 50) + '...');

  // Verificar que el token no sea [object Object]
  if (tokenString === '[object Object]') {
    console.log('❌ Token es [object Object], limpiando sesión...');
    await clearInvalidSession();
    throw new Error('Token corrupto. Por favor, inicia sesión nuevamente.');
  }

    const formData = new FormData();
    formData.append('profileImage', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);

    try {
      console.log('🔍 Enviando request a:', API_ENDPOINTS.AUTH.UPDATE_PROFILE_IMAGE);
      console.log('🔍 Método:', 'PUT');
      console.log('🔍 FormData creado con imagen:', imageUri);
      
      const response = await fetch(API_ENDPOINTS.AUTH.UPDATE_PROFILE_IMAGE, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokenString}`,
          // No establecer Content-Type manualmente para FormData
          // El navegador lo establece automáticamente con el boundary correcto
        },
        body: formData,
      });
      
      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', response.headers);

      const data = await response.json();

      if (!response.ok) {
        // Si el error es 401 (token inválido), limpiar el token
        if (response.status === 401) {
          await clearInvalidSession();
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        throw new Error(data.error || 'Error al actualizar la imagen de perfil');
      }

      // Si la actualización fue exitosa, solo retornar los datos
      console.log('✅ Imagen actualizada exitosamente');
      return data;
    } catch (error) {
      console.error('❌ Error en updateProfileImage:', error);
      
      // Si hay un error de red o token malformado, limpiar el token
      if (error instanceof Error) {
        if (error.message.includes('jwt malformed') || error.message.includes('Token inválido')) {
          await clearInvalidSession();
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        if (error.message.includes('Sesión expirada')) {
          throw error; // Re-lanzar errores de sesión expirada
        }
      }
      throw error;
    }
  }

  async toggleLike(visitaId: number, token: string): Promise<LikeResponse> {
    console.log('toggleLike - URL:', `${API_URL}/likes/toggle/${visitaId}`);
    return this.makeAuthenticatedRequest(
      `/likes/toggle/${visitaId}`,
      token,
      { method: 'POST' }
    );
  }

  async getLikeStatus(visitaId: number, token: string): Promise<LikeStatusResponse> {
    console.log('getLikeStatus - URL:', `${API_URL}/likes/status/${visitaId}`);
    return this.makeAuthenticatedRequest(
      `/likes/status/${visitaId}`,
      token,
      { method: 'GET' }
    );
  }

  async getLikedVisitas(token: string): Promise<LikedVisitasResponse> {
    return this.makeAuthenticatedRequest(
      '/likes',
      token,
      { method: 'GET' }
    );
  }

  async toggleSavedCafe(cafeId: number, token: string): Promise<SaveResponse> {
    return this.makeAuthenticatedRequest(
      `/saved-cafes/toggle/${cafeId}`,
      token,
      { method: 'POST' }
    );
  }

  async getSavedStatus(cafeId: number, token: string): Promise<SaveStatusResponse> {
    return this.makeAuthenticatedRequest(
      `/saved-cafes/status/${cafeId}`,
      token,
      { method: 'GET' }
    );
  }

  async getSavedCafes(token: string): Promise<SavedCafesResponse> {
    return this.makeAuthenticatedRequest(
      '/saved-cafes',
      token,
      { method: 'GET' }
    );
  }

  async makeAuthenticatedRequest(
  endpoint: string,
  token: string,
  options: RequestInit = {}
) {
  // Limpiar token corrupto automáticamente
  const wasCleaned = await cleanCorruptedToken();
  if (wasCleaned) {
    throw new Error('Token corrupto detectado. Por favor, inicia sesión nuevamente.');
  }

  const url = `${API_URL}${endpoint}`;
  console.log('makeAuthenticatedRequest - URL:', url);
  console.log('makeAuthenticatedRequest - Method:', options.method || 'GET');
  console.log('🔐 Token recibido en makeAuthenticatedRequest:', typeof token, token ? token.substring(0, 50) + '...' : 'null');

  // Verificar que el token no sea [object Object]
  if (token === '[object Object]') {
    console.log('❌ Token es [object Object], limpiando sesión...');
    await clearInvalidSession();
    throw new Error('Token corrupto. Por favor, inicia sesión nuevamente.');
  }

  // Asegurar que el token sea una cadena
  const tokenString = typeof token === 'string' ? token : JSON.stringify(token);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenString}`,
        ...(options.headers || {}),
      },
    });

    console.log('makeAuthenticatedRequest - Response status:', response.status);

    const data = await response.json();
    console.log('makeAuthenticatedRequest - Response data:', data);

    if (!response.ok) {
      // Si el error es 401 (token inválido), limpiar el token
      if (response.status === 401) {
        await clearInvalidSession();
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }
      throw new Error(data.error || 'Error en la solicitud autenticada');
    }

    return data;
  } catch (error) {
    // Si hay un error de red o token malformado, limpiar el token
    if (error instanceof Error && error.message.includes('jwt malformed')) {
      await clearInvalidSession();
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }
    throw error;
    }
}

async getComentarios(visitaId: number): Promise<any> {
    const token = await storage.getItem(StorageKeys.TOKEN);
    if (!token) throw new Error('No se encontró el token de autenticación');

    return this.makeAuthenticatedRequest(
      `/comentarios/visita/${visitaId}`,
      token,
      { method: 'GET' }
    );
  }

  async createComentario(visitaId: number, contenido: string): Promise<ComentarioResponse> {
    const token = await storage.getItem(StorageKeys.TOKEN);
    if (!token) throw new Error('No se encontró el token de autenticación');

    return this.makeAuthenticatedRequest(
      `/comentarios/visita/${visitaId}`,
      token,
      {
        method: 'POST',
        body: JSON.stringify({ contenido })
      }
    );
  }

  async updateComentario(comentarioId: number, contenido: string): Promise<ComentarioResponse> {
    const token = await storage.getItem(StorageKeys.TOKEN);
    if (!token) throw new Error('No se encontró el token de autenticación');

    return this.makeAuthenticatedRequest(
      `/comentarios/${comentarioId}`,
      token,
      {
        method: 'PUT',
        body: JSON.stringify({ contenido })
      }
    );
  }

  async deleteComentario(comentarioId: number): Promise<{ message: string }> {
    const token = await storage.getItem(StorageKeys.TOKEN);
    if (!token) throw new Error('No se encontró el token de autenticación');

    return this.makeAuthenticatedRequest(
      `/comentarios/${comentarioId}`,
      token,
      { method: 'DELETE' }
    );
  }

  // Funciones para visitas compartidas
  async crearVisitaCompartida(formData: FormData): Promise<VisitaCompartidaResponse> {
    const token = await storage.getItem(StorageKeys.TOKEN);
    if (!token) throw new Error('No se encontró el token de autenticación');

    // Asegurar que esCompartida está en true
    formData.set('esCompartida', 'true');

    try {
      const response = await fetch(`${API_URL}/visitas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // No establecer Content-Type para FormData, el navegador lo hace automáticamente
        },
        body: formData,
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error('Error en la respuesta del servidor');
      }

      if (!response.ok) {
        throw new Error(data.error || data.mensaje || `Error al crear la visita compartida: ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
      }
      throw error;
    }
  }

  // Funciones para reseñas
  async crearResena(visitaId: number, calificacion: number, comentario: string): Promise<any> {
    const token = await storage.getItem(StorageKeys.TOKEN);
    if (!token) throw new Error('No se encontró el token de autenticación');

    return this.makeAuthenticatedRequest(
      '/resenas',
      token,
      {
        method: 'POST',
        body: JSON.stringify({
          visitaId,
          calificacion,
          comentario
        })
      }
    );
  }

  async obtenerResenas(visitaId: number): Promise<any> {
    const token = await storage.getItem(StorageKeys.TOKEN);
    if (!token) throw new Error('No se encontró el token de autenticación');

    return this.makeAuthenticatedRequest(
      `/resenas/visita/${visitaId}`,
      token,
      { method: 'GET' }
    );
  }

  async actualizarResena(resenaId: number, calificacion: number, comentario: string): Promise<any> {
    const token = await storage.getItem(StorageKeys.TOKEN);
    if (!token) throw new Error('No se encontró el token de autenticación');

    return this.makeAuthenticatedRequest(
      `/resenas/${resenaId}`,
      token,
      {
        method: 'PUT',
        body: JSON.stringify({
          calificacion,
          comentario
        })
      }
    );
  }

  async eliminarResena(resenaId: number): Promise<any> {
    const token = await storage.getItem(StorageKeys.TOKEN);
    if (!token) throw new Error('No se encontró el token de autenticación');

    return this.makeAuthenticatedRequest(
      `/resenas/${resenaId}`,
      token,
      { method: 'DELETE' }
    );
  }

  // Aceptar invitación con reseña
  async aceptarInvitacionConResena(visitaId: number, comentario: string, calificacion: number): Promise<any> {
    const token = await storage.getItem(StorageKeys.TOKEN);
    if (!token) throw new Error('No se encontró el token de autenticación');

    return this.makeAuthenticatedRequest(
      `/visita-participantes/${visitaId}/aceptar-con-resena`,
      token,
      {
        method: 'POST',
        body: JSON.stringify({
          comentario,
          calificacion
        })
      }
    );
  }

  async obtenerListaAmigos(): Promise<Friend[]> {
    const token = await storage.getItem(StorageKeys.TOKEN);
    if (!token) throw new Error('No se encontró el token de autenticación');

    return this.makeAuthenticatedRequest(
      '/amigos/lista',
      token,
      { method: 'GET' }
    );
  }
}

export const apiService = new ApiService();

// Función para recuperar datos del usuario desde el backend
export const fetchUserData = async (): Promise<User | null> => {
  try {
    const token = await storage.getItem(StorageKeys.TOKEN);
    if (!token) {
      console.log('❌ No hay token para recuperar datos del usuario');
      return null;
    }

    const response = await apiService.makeAuthenticatedRequest('/auth/me', token);
    console.log('✅ Datos del usuario recuperados:', response);
    return response.user;
  } catch (error) {
    console.error('❌ Error recuperando datos del usuario:', error);
    return null;
  }
};

// services/api.ts
import { API_URL, API_ENDPOINTS } from '../constants/Config';
import { storage, StorageKeys } from '../utils/storage';

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
      console.error('Servidor no disponible:', error);
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
      console.error('Error en login:', error);
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
        console.error('Error parseando JSON:', jsonError);
        throw new Error('Error en la respuesta del servidor');
      }

      if (!response.ok) {
        throw new Error(data.error || `Error al registrarse: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error en register:', error);
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
      }
      throw error;
    }
  }

  async updateProfileImage(imageUri: string): Promise<ProfileImageResponse> {
    const token = await storage.getItem(StorageKeys.TOKEN);
    if (!token) {
      throw new Error('No se encontró el token de autenticación');
    }

    const formData = new FormData();
    formData.append('profileImage', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    } as any);

    const response = await fetch(API_ENDPOINTS.AUTH.UPDATE_PROFILE_IMAGE, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al actualizar la imagen de perfil');
    }

    return data;
  }

  async toggleLike(visitaId: number, token: string): Promise<LikeResponse> {
    return this.makeAuthenticatedRequest(
      `/likes/toggle/${visitaId}`,
      token,
      { method: 'POST' }
    );
  }

  async getLikeStatus(visitaId: number, token: string): Promise<LikeStatusResponse> {
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
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error en la solicitud autenticada');
    }

    return data;
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
        console.error('Error parseando JSON de respuesta:', jsonError);
        throw new Error('Error en la respuesta del servidor');
      }

      if (!response.ok) {
        throw new Error(data.error || data.mensaje || `Error al crear la visita compartida: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error en crearVisitaCompartida:', error);
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

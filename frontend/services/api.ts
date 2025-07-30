// services/api.ts - Servicio para llamadas a la API
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

interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

interface RegisterResponse {
  id: number;
  email: string;
  name: string;
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

class ApiService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    console.log('Intentando login con URL:', API_ENDPOINTS.AUTH.LOGIN);
    
    const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error en el inicio de sesión');
    }

    return data;
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    console.log('Intentando registro con URL:', API_ENDPOINTS.AUTH.REGISTER);
    console.log('Datos de registro:', JSON.stringify(userData, null, 2));
    
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('Respuesta del servidor:', response.status);
      
      const data = await response.json();
      console.log('Datos de respuesta:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Error en el registro');
      }

      return data;
    } catch (error) {
      console.error('Error detallado:', error);
      throw error;
    }
  }

  async updateProfileImage(imageUri: string): Promise<ProfileImageResponse> {
    console.log('Actualizando imagen de perfil...');
    
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

  async makeAuthenticatedRequest(endpoint: string, token: string, options: RequestInit = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    return response.json();
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
}

export const apiService = new ApiService();
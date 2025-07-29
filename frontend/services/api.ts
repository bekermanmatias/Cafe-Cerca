// services/api.ts - Servicio para llamadas a la API
import { API_URL, API_ENDPOINTS } from '../constants/Config';

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

  async updateProfileImage(imageUri: string, token: string): Promise<ProfileImageResponse> {
    console.log('Actualizando imagen de perfil...');
    
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
      `/visitas/${visitaId}/like`,
      token,
      { method: 'POST' }
    );
  }

  async getLikeStatus(visitaId: number, token: string): Promise<LikeStatusResponse> {
    return this.makeAuthenticatedRequest(
      `/visitas/${visitaId}/like`,
      token,
      { method: 'GET' }
    );
  }

  async getLikedVisitas(token: string): Promise<any[]> {
    return this.makeAuthenticatedRequest(
      '/likes',
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
}

export const apiService = new ApiService();
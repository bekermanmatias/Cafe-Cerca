// services/api.ts - Servicio para llamadas a la API
import { API_CONFIG } from '../constants/Config';

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

class ApiService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    console.log('Intentando login con URL:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`);
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`, {
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
    console.log('Intentando registro con URL:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REGISTER}`);
    console.log('Datos de registro:', JSON.stringify(userData, null, 2));
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REGISTER}`, {
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

  async makeAuthenticatedRequest(endpoint: string, token: string, options: RequestInit = {}) {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
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
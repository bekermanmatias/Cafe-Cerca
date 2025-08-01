import { useState, useCallback, useEffect } from 'react';
import { API_URL } from '../constants/Config';
import { useAuth } from '../context/AuthContext';

interface Imagen {
  imageUrl: string;
  orden: number;
}

interface Cafeteria {
  id: number;
  name: string;
  address: string;
  rating: number;
  imageUrl: string | null;
}

interface Usuario {
  id: number;
  name: string;
  profileImage: string | null;
}

interface Resena {
  id: number;
  calificacion: number;
  comentario: string;
  fecha: string;
  usuario: Usuario;
}

interface Participante extends Usuario {
  estado: 'pendiente' | 'aceptada' | 'rechazada';
  rol: 'creador' | 'participante';
  fechaRespuesta?: string;
  resena?: Resena;
}

interface Visita {
  id: number;
  fecha: string;
  estado: 'activa' | 'completada' | 'cancelada';
  esCompartida: boolean;
  imagenes: Imagen[];
  cafeteria: Cafeteria;
  creador?: {
    id: number;
    name: string;
    profileImage: string | null;
    resena?: Resena;
  };
  participantes?: Participante[];
  likesCount?: number;
  usuarioId?: number;
  cafeteriaId?: number;
  usuario?: Usuario;
  comentario?: string;
  calificacion?: number;
  isLiked?: boolean;
}

interface DiarioResponse {
  mensaje: string;
  totalVisitas: number;
  visitas: Visita[];
}

export const useDiary = () => {
  const { user, token } = useAuth();
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDiario = useCallback(async () => {
    if (!user || !token) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/visitas/usuario/${user.id}`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener visitas');
      }

      const data: DiarioResponse = await response.json();
      setVisitas(data.visitas || []);
    } catch (error) {
      console.error('Error fetching diario:', error);
      setError('No se pudo cargar el diario');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, token]);

  const refreshDiary = useCallback(() => {
    setRefreshing(true);
    fetchDiario();
  }, [fetchDiario]);

  const updateVisitLike = useCallback((visitId: number, liked: boolean) => {
    setVisitas(prevVisitas =>
      prevVisitas.map(visita =>
        visita.id === visitId ? { ...visita, isLiked: liked } : visita
      )
    );
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    if (user && token) {
      fetchDiario();
    }
  }, [fetchDiario]);

  return {
    visitas,
    isLoading,
    refreshing,
    error,
    refreshDiary,
    updateVisitLike,
  };
}; 
import { StyleSheet, ScrollView, Alert, TouchableOpacity, Text, View, RefreshControl, ActivityIndicator } from 'react-native';
import { VisitCard } from '../../components/VisitCard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import Constants from 'expo-constants';
import { shareVisit, shareDiary } from '../../constants/Sharing';
import { AntDesign, Feather } from '@expo/vector-icons';
import { API_URL } from '../../constants/Config';
import { useAuth } from '../../context/AuthContext';
import EmptyDiary from '../../assets/icons/empty-diary.svg';

interface Imagen {
  imageUrl: string;
  orden: number;
}

interface Tag {
  id: number;
  nombre: string;
  icono: string;
}

interface Cafeteria {
  id: number;
  name: string;
  address: string;
  rating: number;
  imageUrl: string | null;
  tags: Tag[];
  openingHours: string;
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

export default function DiaryScreen() {
  const router = useRouter();
  const { refresh } = useLocalSearchParams();
  const { user, token, isLoading: authLoading } = useAuth();

  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Redirigir a login si no hay usuario después de la carga del contexto
  useEffect(() => {
    if (!authLoading && !user) {
      Alert.alert('Error', 'Debes iniciar sesión para ver tu diario');
      router.replace('/(auth)/signin');
    }
  }, [authLoading, user, router]);

  const fetchDiario = useCallback(async () => {
    if (!user || !token) return;

    try {
      setIsLoading(true);

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
      if (!isLoading) {
        Alert.alert(
          'Error de conexión',
          'No se pudo actualizar el diario. ¿Deseas intentar de nuevo?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Reintentar', onPress: () => fetchDiario() },
          ]
        );
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user, token, isLoading]);

  // Ejecutar fetch al montar y cuando cambian user, token o refresh
  useEffect(() => {
    if (user && token) {
      fetchDiario();
    }
  }, [user, token, refresh, fetchDiario]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDiario();
  }, [fetchDiario]);

  const handleLikeChange = (visitId: number, liked: boolean) => {
    setVisitas(prevVisitas =>
      prevVisitas.map(visita =>
        visita.id === visitId ? { ...visita, isLiked: liked } : visita
      )
    );
  };

  const handleShare = (visitId: number) => {
    shareVisit(visitId);
  };

  const handleDetails = (visit: Visita) => {
    router.push({
      pathname: '/visit-details',
      params: {
        visitId: visit.id.toString(),
      },
    });
  };

  const handleAddVisit = () => {
    router.push({
      pathname: '/add-visit',
    });
  };

  const handleShareDiary = async () => {
    try {
      if (!user?.id) {
        Alert.alert('Error', 'Debes iniciar sesión para compartir tu diario');
        return;
      }
      await shareDiary(user.id);
    } catch (error) {
      console.error('Error sharing diary:', error);
      Alert.alert(
        'Error',
        'No se pudo compartir el diario. Por favor, intenta de nuevo.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleStats = () => {
    router.push('/stats');
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <EmptyDiary width={200} height={200} style={styles.emptyImage} fill="#E0E0E0" />
      <Text style={styles.emptyTitle}>¡Tu diario está vacío!</Text>
      <Text style={styles.emptyText}>Aquí podrás ver todas tus visitas a cafeterías.</Text>
      <Text style={styles.emptySubtext}>
        Comienza explorando cafeterías cercanas y comparte tus experiencias.
      </Text>
      <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/(tabs)/explore')}>
        <Feather name="coffee" size={20} color="#FFF" />
        <Text style={styles.exploreButtonText}>Explorar cafeterías</Text>
      </TouchableOpacity>
    </View>
  );

  if (authLoading || !user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#8D6E63" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Mi Diario</Text>
          <TouchableOpacity style={styles.sortButton}>
            <Text style={styles.sortButtonText}>Recientes</Text>
            <AntDesign name="down" size={12} color="#8D6E63" style={styles.sortIcon} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={handleStats}>
            <AntDesign name="barschart" size={24} color="#8D6E63" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleShareDiary}>
            <AntDesign name="sharealt" size={24} color="#8D6E63" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={visitas.length === 0 ? styles.scrollViewEmpty : undefined}
        nestedScrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8D6E63']}
            tintColor="#8D6E63"
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando visitas...</Text>
          </View>
        ) : visitas.length === 0 ? (
          <EmptyState />
        ) : (
          visitas.map((visit) => (
            <VisitCard
              key={visit.id}
              visit={visit}
              onLikeChange={(liked) => handleLikeChange(visit.id, liked)}
              onShare={() => handleShare(visit.id)}
              onDetails={() => handleDetails(visit)}
            />
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fabButton} onPress={handleAddVisit}>
        <Text style={styles.fabText}>Agregar visita</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#8D6E63',
    marginRight: 4,
  },
  sortIcon: {
    marginTop: 2,
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#8D6E63',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8D6E63',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8D6E63',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollViewEmpty: {
    flexGrow: 1,
  },
});

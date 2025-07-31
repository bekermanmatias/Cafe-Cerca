import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AntDesign, Feather } from '@expo/vector-icons';
import { API_URL } from '../constants/Config';
import { useAuth } from '../context/AuthContext';

interface CafeteriaFavorita {
  cafeteria: {
    name: string;
    address: string;
    imageUrl: string;
    rating: number;
  };
  cantidadVisitas: number;
}

interface ProgresoMensual {
  mes: string;
  cantidadVisitas: number;
}

interface Estadisticas {
  totalVisitas: number;
  cafeteriasUnicas: number;
  promedioCalificaciones: string;
  distribucionCalificaciones: Record<string, number>;
  cafeteriasFavoritas: CafeteriaFavorita[];
  progresoMensual: ProgresoMensual[];
  visitasIndividuales: number;
  visitasCompartidasCreador: number;
  visitasComoInvitado: number;
}

const EmptyStats = ({ onExplore }: { onExplore: () => void }) => (
  <View style={styles.emptyContainer}>
    <Feather name="coffee" size={64} color="#E0E0E0" style={styles.emptyIcon} />
    <Text style={styles.emptyTitle}>¡Aún no tienes estadísticas!</Text>
    <Text style={styles.emptyText}>
      Comienza visitando cafeterías y compartiendo tus experiencias para ver tus estadísticas aquí.
    </Text>
    <TouchableOpacity style={styles.exploreButton} onPress={onExplore}>
      <Text style={styles.exploreButtonText}>Explorar cafeterías</Text>
    </TouchableOpacity>
  </View>
);

export default function StatsScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [stats, setStats] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && token) {
      fetchStats();
    }
  }, [user, token]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/estadisticas/usuarios/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 404) {
          // Si no hay estadísticas, establecemos un objeto vacío con valores por defecto
          setStats({
            totalVisitas: 0,
            cafeteriasUnicas: 0,
            promedioCalificaciones: "0.0",
            distribucionCalificaciones: {},
            cafeteriasFavoritas: [],
            progresoMensual: [],
            visitasIndividuales: 0,
            visitasCompartidasCreador: 0,
            visitasComoInvitado: 0
          });
        } else {
          throw new Error(data.error || 'Error al obtener estadísticas');
        }
      } else {
        setStats(data);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('No se pudieron cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !token) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Debes iniciar sesión para ver tus estadísticas</Text>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => router.push('/(auth)/signin')}
        >
          <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8D6E63" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchStats}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!stats || (stats.totalVisitas === 0 && stats.cafeteriasUnicas === 0)) {
    return <EmptyStats onExplore={() => router.push('/(tabs)/explore')} />;
  }

  const maxVisitas = Math.max(...stats.progresoMensual.map(mes => mes.cantidadVisitas), 1);

  return (
    <ScrollView style={styles.container}>
      {/* Métricas principales */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricCard}>
          <Text style={styles.metricNumber}>{stats.cafeteriasUnicas}</Text>
          <Text style={styles.metricLabel}>Cafeterías{'\n'}Visitadas</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricNumber}>{stats.totalVisitas}</Text>
          <Text style={styles.metricLabel}>Visitas{'\n'}Totales</Text>
        </View>
      </View>

      {/* Progreso Mensual */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <AntDesign name="linechart" size={18} color="#8D6E63" style={{ marginRight: 8 }} />
          Progreso Mensual
        </Text>
        {stats.progresoMensual.length > 0 ? (
          stats.progresoMensual.map((mes, index) => (
            <View key={index} style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Text style={styles.monthLabel}>{mes.mes}</Text>
                <Text style={styles.visitCount}>{mes.cantidadVisitas} visitas</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${(mes.cantidadVisitas / maxVisitas) * 100}%` }
                  ]} 
                />
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyMessage}>
            Aún no tienes visitas registradas este mes
          </Text>
        )}
      </View>

      {/* Cafeterías Favoritas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <AntDesign name="Trophy" size={18} color="#8D6E63" style={{ marginRight: 8 }} />
          Cafeterías Favoritas
        </Text>
        {stats.cafeteriasFavoritas.length > 0 ? (
          stats.cafeteriasFavoritas.map((item, index) => (
            <View key={index} style={styles.cafeItem}>
              <View style={styles.cafeRank}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
              </View>
              <Image
                source={{ uri: item.cafeteria.imageUrl }}
                style={styles.cafeImage}
              />
              <View style={styles.cafeInfo}>
                <Text style={styles.cafeName}>{item.cafeteria.name}</Text>
                <Text style={styles.cafeAddress} numberOfLines={1}>
                  {item.cafeteria.address}
                </Text>
                <View style={styles.ratingContainer}>
                  <Text style={styles.visitCount}>
                    {item.cantidadVisitas} visitas
                  </Text>
                  <View style={styles.rating}>
                    <AntDesign name="star" size={16} color="#FFD700" />
                    <Text style={styles.ratingText}>
                      {item.cafeteria.rating.toFixed(1)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyMessage}>
            Visita más cafeterías para ver tus favoritas aquí
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  metricNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8D6E63',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    padding: 16,
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cafeItem: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cafeRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8D6E63',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cafeImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  cafeInfo: {
    flex: 1,
  },
  cafeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  cafeAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  visitCount: {
    width: 70,
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  progressItem: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  progressBarContainer: {
    width: '100%',
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8D6E63',
    borderRadius: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFF',
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8D6E63',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  exploreButton: {
    backgroundColor: '#8D6E63',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: '#8D6E63',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#8D6E63',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 24,
    fontStyle: 'italic',
  },
}); 
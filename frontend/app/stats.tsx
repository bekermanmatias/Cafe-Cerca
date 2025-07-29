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
import { AntDesign } from '@expo/vector-icons';
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
}

export default function StatsScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [stats, setStats] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Estado de autenticación:', { user, token });
    if (user && token) {
      fetchStats();
    }
  }, [user, token]);

  const fetchStats = async () => {
    try {
      console.log('Haciendo fetch de estadísticas para usuario:', user?.id);
      const response = await fetch(`${API_URL}/estadisticas/usuarios/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error respuesta:', errorData);
        throw new Error('Error al obtener estadísticas');
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !token) {
    console.log('No hay usuario o token:', { user, token });
    return (
      <View style={styles.errorContainer}>
        <Text>Debes iniciar sesión para ver tus estadísticas</Text>
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

  if (!stats) {
    return (
      <View style={styles.errorContainer}>
        <Text>No se pudieron cargar las estadísticas</Text>
      </View>
    );
  }

  const maxVisitas = stats?.progresoMensual.reduce((max, mes) => 
    Math.max(max, mes.cantidadVisitas), 0) || 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Estadísticas</Text>
        <View style={{ width: 24 }} />
      </View>

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
        {stats.progresoMensual.map((mes, index) => (
          <View key={index} style={styles.progressItem}>
            <View style={styles.progressHeader}>
              <Text style={styles.monthLabel}>{mes.mes}</Text>
              <Text style={styles.visitCount}>{mes.cantidadVisitas} visitas</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${(mes.cantidadVisitas / maxVisitas) * 100}%`,
                  }
                ]} 
              />
            </View>
          </View>
        ))}
      </View>

      {/* Cafeterías Favoritas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <AntDesign name="Trophy" size={18} color="#8D6E63" style={{ marginRight: 8 }} />
          Cafeterías Favoritas
        </Text>
        {stats.cafeteriasFavoritas.map((item, index) => (
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
        ))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
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
}); 
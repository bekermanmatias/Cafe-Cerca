import { StyleSheet, ScrollView, Alert, TouchableOpacity, Text, View, RefreshControl } from 'react-native';
import { VisitCard } from '../../components/VisitCard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import Constants from 'expo-constants';
import { shareVisit, shareDiary } from '../../constants/Sharing';
import { AntDesign } from '@expo/vector-icons';
import { API_URL } from '../../constants/Config';

interface Imagen {
  imageUrl: string;
  orden: number;
}

interface Cafeteria {
  id: number;
  name: string;
  address: string;
  imageUrl: string | null;
  rating: number;
  tags: string[];
  openingHours: string;
}

interface Visita {
  id: number;
  usuarioId: number;
  cafeteriaId: number;
  comentario: string;
  calificacion: number;
  fecha: string;
  imagenes: Imagen[];
  cafeteria: Cafeteria;
}

interface DiarioResponse {
  mensaje: string;
  totalVisitas: number;
  visitas: Visita[];
}

export default function DiaryScreen() {
  const router = useRouter();
  const { refresh } = useLocalSearchParams();
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDiario = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching from:', `${API_URL}/visitas/usuario/1`); // Debug log
      const response = await fetch(`${API_URL}/visitas/usuario/1`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: DiarioResponse = await response.json();
      console.log('Response data:', data); // Debug log
      setVisitas(data.visitas);
    } catch (error) {
      console.error('Error fetching diario:', error);
      Alert.alert(
        'Error',
        'No se pudo cargar el diario. Por favor, verifica tu conexión a internet.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDiario();
  }, [refresh]); // Se actualizará cuando cambie el parámetro refresh

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDiario();
  }, []);

  const handleLike = () => {
    console.log('Like pressed');
  };

  const handleShare = (visitId: number) => {
    shareVisit(visitId);
  };

  const handleDetails = (visit: Visita) => {
    router.push({
      pathname: '/visit-details',
      params: {
        visitId: visit.id.toString()
      }
    });
  };

  const handleAddVisit = () => {
    router.push({
      pathname: '/add-visit'
    });
  };

  const handleShareDiary = async () => {
    try {
      // Por ahora hardcodeamos el userId a 1
      await shareDiary(1);
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
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={handleStats}
          >
            <AntDesign name="barschart" size={24} color="#8D6E63" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={handleShareDiary}
          >
            <AntDesign name="sharealt" size={24} color="#8D6E63" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
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
        {visitas.map((visit) => (
          <VisitCard
            key={visit.id}
            visit={visit}
            onLike={handleLike}
            onShare={() => handleShare(visit.id)}
            onDetails={() => handleDetails(visit)}
          />
        ))}
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.fabButton}
        onPress={handleAddVisit}
      >
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
}); 
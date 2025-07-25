import { StyleSheet, ScrollView, Alert, TouchableOpacity, Text, View, RefreshControl } from 'react-native';
import { VisitCard } from '../../components/VisitCard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import Constants from 'expo-constants';

interface Imagen {
  imageUrl: string;
  orden: number;
}

interface Visita {
  id: number;
  usuarioId: number;
  cafeteriaId: number;
  comentario: string;
  calificacion: number;
  fecha: string;
  imagenes: Imagen[];
}

interface DiarioResponse {
  mensaje: string;
  totalVisitas: number;
  visitas: Visita[];
}

// En desarrollo, usa la IP de tu máquina local. En producción, usa tu servidor real.
const API_URL = __DEV__ 
  ? 'http://192.168.0.11:3000/api' // Cambia esta IP por la de tu computadora
  : 'https://tu-servidor-produccion.com/api';

export default function DiaryScreen() {
  const router = useRouter();
  const { refresh } = useLocalSearchParams();
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDiario = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching from:', `${API_URL}/usuarios/1/diario`); // Debug log
      const response = await fetch(`${API_URL}/usuarios/1/diario`, {
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

  const handleShare = () => {
    console.log('Share pressed');
  };

  const handleDetails = (visit: Visita) => {
    router.push({
      pathname: '/visit-details',
      params: {
        place: `Cafetería ${visit.cafeteriaId}`,
        description: visit.comentario.replace(/"/g, ''),
        rating: visit.calificacion,
        date: new Date(visit.fecha).toLocaleDateString(),
        images: JSON.stringify(visit.imagenes.map(img => img.imageUrl)),
        participants: JSON.stringify([])
      }
    });
  };

  const handleAddVisit = () => {
    router.push({
      pathname: '/add-visit'
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        nestedScrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8D6E63']} // Color del spinner en Android
            tintColor="#8D6E63"  // Color del spinner en iOS
          />
        }
      >
        {visitas.map((visit) => (
          <VisitCard
            key={visit.id}
            place={`Cafetería ${visit.cafeteriaId}`}
            description={visit.comentario.replace(/"/g, '')}
            rating={visit.calificacion}
            date={new Date(visit.fecha).toLocaleDateString()}
            images={visit.imagenes.map(img => ({ uri: img.imageUrl }))}
            participants={[]}
            onLike={handleLike}
            onShare={handleShare}
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
  fabButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#8D6E63', // Color café
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 5, // Sombra en Android
    shadowColor: '#000', // Sombra en iOS
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
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import SearchBar from '../../components/SearchBar';
import FilterChips from '../../components/FilterChips';
import TagChip from '../../components/TagChip';
import { API_URL } from '../../constants/Config';
import * as Location from 'expo-location';

interface Tag {
  id: number;
  nombre: string;
  icono: string;
}

interface Cafe {
  id: number;
  name: string;
  address: string;
  rating: number;
  imageUrl: string | null;
  tags: Tag[];
  openingHours: string;
  lat?: number;
  lng?: number;
  distance?: number;
}

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Tag[]>([]); // Etiquetas del backend
  const [selectedFilters, setSelectedFilters] = useState<number[]>([]);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await fetch(`${API_URL}/etiquetas`);
        if (!res.ok) throw new Error('No se pudieron cargar las etiquetas');
        const data = await res.json();
        setFilters(data);
      } catch (error) {
        console.error('Error cargando filtros:', error);
      } finally {
        setLoadingFilters(false);
      }
    };

    fetchFilters();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Permiso de ubicación denegado');
          fetchCafes(); // Cargar sin ubicación
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const coords = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };
        setUserLocation(coords);
        fetchCafes(coords.lat, coords.lng);
      } catch (error) {
        console.error('Error obteniendo ubicación:', error);
        fetchCafes();
      }
    };

    fetchData();
  }, []);

  const handleCafePress = (id: number) => {
    router.push(`../cafe/${id}`);
  };

  const fetchCafes = async (lat?: number, lng?: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/cafes`);
      if (!response.ok) throw new Error('Error al obtener las cafeterías');

      const data = await response.json();

      let orderedCafes = data;

      if (lat && lng) {
        orderedCafes = data
          .map((cafe: Cafe) => {
            const distance = cafe.lat && cafe.lng ? getDistance(lat, lng, cafe.lat, cafe.lng) : Infinity;
            return { ...cafe, distance };
          })
          .sort((a: Cafe, b: Cafe) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
      }

      setCafes(orderedCafes);
    } catch (error) {
      console.error('Error al obtener cafeterías:', error);
      setError('No se pudieron cargar las cafeterías');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    const fetchData = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Permiso de ubicación denegado');
          fetchCafes(); // Cargar sin ubicación
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const coords = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };
        setUserLocation(coords);
        fetchCafes(coords.lat, coords.lng);
      } catch (error) {
        console.error('Error obteniendo ubicación:', error);
        fetchCafes();
      }
    };
    fetchData();
  }, []);

  // Si siguen cargando los filtros, mostramos loading
  if (loadingFilters) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8D6E63" />
        <Text style={styles.loadingText}>Cargando filtros...</Text>
      </View>
    );
  }

 const filteredCafes = cafes.filter(cafe =>
  cafe.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
  selectedFilters.every(selectedId =>
    Array.isArray(cafe.tags) && cafe.tags.some(tag => tag.id === selectedId)
  )
);
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8D6E63" />
        <Text style={styles.loadingText}>Cargando cafeterías...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#8D6E63']}
          tintColor="#8D6E63"
        />
      }
    >
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="¿Qué te apetece hoy?"
      />
      <FilterChips
        items={filters}
        selected={selectedFilters}
        onSelect={setSelectedFilters}
      />

      {filteredCafes.map((cafe, index) => (
        <TouchableOpacity
          key={cafe.id || index}
          onPress={() => handleCafePress(cafe.id)}
          activeOpacity={0.8}
        >
          <View style={styles.card}>
            <View style={styles.imageWrapper}>
              {cafe.imageUrl ? (
                <Image
                  source={{ uri: cafe.imageUrl }}
                  style={styles.image}
                />
              ) : (
                <View style={[styles.image, styles.placeholderImage]}>
                  <Text style={styles.placeholderText}>{cafe.name[0].toUpperCase()}</Text>
                </View>
              )}
              {cafe.openingHours && (
                <TagChip
                  label={cafe.openingHours}
                  style={styles.horarioChip}
                  textStyle={{ fontWeight: '500' }}
                />
              )}
            </View>
            <View style={styles.textContainer}>
              <View style={styles.row}>
                <Text style={styles.name}>{cafe.name}</Text>
                <Text style={styles.puntaje}>{cafe.rating} ★</Text>
              </View>
              <Text style={styles.location}>{cafe.address}</Text>
              {cafe.distance !== undefined && cafe.distance !== Infinity && (
                <Text style={styles.distanceText}>
                  A {cafe.distance.toFixed(1)} km de ti
                </Text>
              )}
              <View style={styles.tagsContainer}>
                {cafe.tags?.map((tag, idx) => (
                  <TagChip
                    key={tag.id}
                    label={`${tag.icono} ${tag.nombre}`}
                  />
                ))}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;

  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 11,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  puntaje: {
    fontSize: 14,
    color: '#96664F',
  },
  image: {
    width: '100%',
    height: 160,
  },
  placeholderImage: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    color: '#8D6E63',
    fontWeight: 'bold',
  },
  textContainer: {
    padding: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8D6E63',
  },
  location: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  distanceText: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  imageWrapper: {
    position: 'relative',
  },
  horarioChip: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: '#DBEDC2',
    borderColor: '#DBEDC2',
  },
});

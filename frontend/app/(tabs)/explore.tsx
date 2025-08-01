import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import SearchBar from '../../components/SearchBar';
import FilterChips from '../../components/FilterChips';
import TagChip from '../../components/TagChip';
import { API_URL } from '../../constants/Config';
import * as Location from 'expo-location';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

// Types
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

interface AppState {
  cafes: Cafe[];
  filters: Tag[];
  userLocation: { lat: number; lng: number } | null;
  searchQuery: string;
  selectedFilters: number[];
}

interface LoadingState {
  cafes: boolean;
  filters: boolean;
  refreshing: boolean;
}

// Constants
const ICON_MAP: { [key: string]: string } = {
  'shield': 'shield-alt',
  'volume-x': 'volume-mute',
  'utensils': 'utensils',
  'coffee': 'coffee',
  'wifi': 'wifi',
};

const FALLBACK_ICON = 'tag';
const EARTH_RADIUS_KM = 6371;
const MAX_VISIBLE_TAGS = 3;

// Utility functions
const toRad = (value: number): number => (value * Math.PI) / 180;

const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

const getValidIconName = (iconName: string): string => 
  ICON_MAP[iconName] || FALLBACK_ICON;

// Components
const SafeIcon = React.memo(({ iconName }: { iconName: string }) => (
  <FontAwesome5 
    name={getValidIconName(iconName)} 
    size={14} 
    color="#8D6E63" 
    style={styles.tagIcon} 
  />
));

const CafeImage = React.memo(({ cafe }: { cafe: Cafe }) => {
  if (cafe.imageUrl) {
    return (
      <Image
        source={{ uri: cafe.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={[styles.image, styles.placeholderImage]}>
      <Text style={styles.placeholderText}>
        {cafe.name[0]?.toUpperCase() || 'C'}
      </Text>
    </View>
  );
});

const CafeTags = React.memo(({ tags }: { tags: Tag[] }) => {
  if (!tags?.length) return null;

  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
  const remainingCount = tags.length - MAX_VISIBLE_TAGS;

  return (
    <View style={styles.tagsWrapper}>
      {visibleTags.map((tag) => (
        <View key={tag.id} style={styles.tagItem}>
          <SafeIcon iconName={tag.icono} />
          <Text style={styles.tagText} numberOfLines={1}>
            {tag.nombre}
          </Text>
        </View>
      ))}
      {remainingCount > 0 && (
        <View style={styles.tagItem}>
          <Text style={styles.tagText}>+{remainingCount}</Text>
        </View>
      )}
    </View>
  );
});

const CafeCard = React.memo(({ 
  cafe, 
  onPress 
}: { 
  cafe: Cafe; 
  onPress: (id: number) => void;
}) => {
  const handlePress = useCallback(() => onPress(cafe.id), [cafe.id, onPress]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={styles.card}
    >
      <View style={styles.imageWrapper}>
        <CafeImage cafe={cafe} />
        {cafe.openingHours && (
          <TagChip
            label={cafe.openingHours}
            style={styles.horarioChip}
            textStyle={styles.horarioText}
          />
        )}
      </View>
      
      <View style={styles.textContainer}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{cafe.name}</Text>
          <Text style={styles.puntaje}>{cafe.rating.toFixed(1)} ★</Text>
        </View>
        
        <Text style={styles.location} numberOfLines={1}>
          {cafe.address}
        </Text>
        
        {cafe.distance !== undefined && isFinite(cafe.distance) && (
          <Text style={styles.distanceText}>
            A {cafe.distance.toFixed(1)} km de ti
          </Text>
        )}
        
        <CafeTags tags={cafe.tags} />
      </View>
    </TouchableOpacity>
  );
});

const LoadingView = ({ text }: { text: string }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#8D6E63" />
    <Text style={styles.loadingText}>{text}</Text>
  </View>
);

const ErrorView = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>{message}</Text>
    <TouchableOpacity 
      style={styles.retryButton} 
      onPress={onRetry}
      activeOpacity={0.7}
    >
      <Text style={styles.retryButtonText}>Intentar de nuevo</Text>
    </TouchableOpacity>
  </View>
);

const EmptyView = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>
      No se encontraron cafeterías que coincidan con tu búsqueda
    </Text>
  </View>
);

// Custom hooks
const useUserLocation = () => {
  const getUserLocation = useCallback(async (): Promise<{ lat: number; lng: number } | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permiso de ubicación denegado');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      return {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      return null;
    }
  }, []);

  return { getUserLocation };
};

const useApiData = () => {
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchFilters = useCallback(async (): Promise<Tag[]> => {
    const response = await fetch(`${API_URL}/etiquetas`, {
      signal: abortControllerRef.current?.signal,
    });
    
    if (!response.ok) {
      throw new Error('No se pudieron cargar las etiquetas');
    }
    
    return response.json();
  }, []);

  const fetchCafes = useCallback(async (): Promise<Cafe[]> => {
    const response = await fetch(`${API_URL}/cafes`, {
      signal: abortControllerRef.current?.signal,
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener las cafeterías');
    }

    const data = await response.json();
    return data.map((cafe: any) => ({
      ...cafe,
      tags: cafe.etiquetas || [],
    }));
  }, []);

  const cancelRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
  }, []);

  return { fetchFilters, fetchCafes, cancelRequests };
};

// Main component
export default function ExploreScreen() {
  const router = useRouter();
  const { getUserLocation } = useUserLocation();
  const { fetchFilters, fetchCafes, cancelRequests } = useApiData();

  // State
  const [appState, setAppState] = useState<AppState>({
    cafes: [],
    filters: [],
    userLocation: null,
    searchQuery: '',
    selectedFilters: [],
  });

  const [loadingState, setLoadingState] = useState<LoadingState>({
    cafes: true,
    filters: true,
    refreshing: false,
  });

  const [error, setError] = useState<string | null>(null);

  // Memoized values
  const filteredCafes = useMemo(() => {
    const { cafes, searchQuery, selectedFilters } = appState;
    
    return cafes.filter(cafe => {
      const matchesSearch = searchQuery.length === 0 || 
        cafe.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilters = selectedFilters.length === 0 || 
        selectedFilters.every(selectedId =>
          cafe.tags?.some(tag => tag.id === selectedId)
        );
      
      return matchesSearch && matchesFilters;
    });
  }, [appState.cafes, appState.searchQuery, appState.selectedFilters]);

  const sortedCafes = useMemo(() => {
    return [...filteredCafes].sort((a, b) => {
      const distanceA = a.distance ?? Infinity;
      const distanceB = b.distance ?? Infinity;
      return distanceA - distanceB;
    });
  }, [filteredCafes]);

  // Event handlers
  const handleCafePress = useCallback((id: number) => {
    router.push(`../cafe/${id}`);
  }, [router]);

  const handleSearchChange = useCallback((text: string) => {
    setAppState(prev => ({ ...prev, searchQuery: text }));
  }, []);

  const handleFiltersChange = useCallback((filters: number[]) => {
    setAppState(prev => ({ ...prev, selectedFilters: filters }));
  }, []);

  // Data fetching functions
  const loadFilters = useCallback(async () => {
    try {
      setLoadingState(prev => ({ ...prev, filters: true }));
      const filters = await fetchFilters();
      setAppState(prev => ({ ...prev, filters }));
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error cargando filtros:', error);
      }
    } finally {
      setLoadingState(prev => ({ ...prev, filters: false }));
    }
  }, [fetchFilters]);

  const loadCafes = useCallback(async (userLat?: number, userLng?: number) => {
    try {
      setLoadingState(prev => ({ ...prev, cafes: true }));
      setError(null);
      
      const cafes = await fetchCafes();

      // Calculate distances and sort if location is available
      let processedCafes = cafes;
      if (userLat !== undefined && userLng !== undefined) {
        processedCafes = cafes.map(cafe => {
          const distance = cafe.lat && cafe.lng 
            ? getDistance(userLat, userLng, cafe.lat, cafe.lng) 
            : Infinity;
          return { ...cafe, distance };
        });
      }

      setAppState(prev => ({ 
        ...prev, 
        cafes: processedCafes,
        userLocation: userLat && userLng ? { lat: userLat, lng: userLng } : prev.userLocation
      }));
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error al obtener cafeterías:', error);
        setError('No se pudieron cargar las cafeterías');
      }
    } finally {
      setLoadingState(prev => ({ 
        ...prev, 
        cafes: false, 
        refreshing: false 
      }));
    }
  }, [fetchCafes]);

  const onRefresh = useCallback(async () => {
    setLoadingState(prev => ({ ...prev, refreshing: true }));
    
    const location = await getUserLocation();
    await loadCafes(location?.lat, location?.lng);
  }, [getUserLocation, loadCafes]);

  const handleRetry = useCallback(() => {
    loadCafes();
  }, [loadCafes]);

  // Effects
  useEffect(() => {
    loadFilters();
    
    return () => {
      cancelRequests();
    };
  }, [loadFilters, cancelRequests]);

  useEffect(() => {
    const initializeData = async () => {
      const location = await getUserLocation();
      await loadCafes(location?.lat, location?.lng);
    };
    
    initializeData();
  }, [getUserLocation, loadCafes]);

  // Render loading states
  if (loadingState.filters) {
    return <LoadingView text="Cargando filtros..." />;
  }

  if (loadingState.cafes && !loadingState.refreshing) {
    return <LoadingView text="Cargando cafeterías..." />;
  }

  if (error && !loadingState.refreshing) {
    return <ErrorView message={error} onRetry={handleRetry} />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loadingState.refreshing}
          onRefresh={onRefresh}
          colors={['#8D6E63']}
          tintColor="#8D6E63"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <SearchBar
        value={appState.searchQuery}
        onChangeText={handleSearchChange}
        placeholder="¿Qué te apetece hoy?"
      />
      
      <FilterChips
        items={appState.filters}
        selected={appState.selectedFilters}
        onSelect={handleFiltersChange}
      />

      {sortedCafes.length === 0 && !loadingState.cafes ? (
        <EmptyView />
      ) : (
        sortedCafes.map((cafe) => (
          <CafeCard
            key={cafe.id}
            cafe={cafe}
            onPress={handleCafePress}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
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
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#8D6E63',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
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
    fontWeight: '600',
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
    flex: 1,
    marginRight: 8,
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
  imageWrapper: {
    position: 'relative',
  },
  horarioChip: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#DBEDC2',
    borderColor: '#DBEDC2',
  },
  horarioText: {
    fontWeight: '500',
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#E8D5B7',
    marginBottom: 4,
  },
  tagIcon: {
    marginRight: 4,
  },
  tagText: {
    fontSize: 14,
    color: '#6B4423',
    fontWeight: '600',
  },
});
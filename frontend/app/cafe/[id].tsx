// app/cafe/[id].tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Platform,
  Linking,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import TagChip from '../../components/TagChip';
import DireccionIcon from '../../assets/icons/direccion.svg';
import HorarioIcon from '../../assets/icons/horario.svg';
import { API_URL } from '../../constants/Config';
import { VisitCard } from '../../components/VisitCard';
import { useAuth } from '../../context/AuthContext';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

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
  imageUrl: string;
  etiquetas: Tag[];
  openingHours: string;
  lat?: number;
  lng?: number;
}

type CafeResponse = {
  cafe: Cafe;
  visitas: {
    items: any[];
    total: number;
    totalPages: number;
    currentPage: number;
    hasMore: boolean;
  };
};

// Componente para iconos seguros
const SafeIcon = React.memo(({ iconName }: { iconName: string }) => {
  // Mapeo de iconos problemáticos a iconos válidos
  const iconMap: { [key: string]: string } = {
    'shield': 'shield-alt',
    'volume-x': 'volume-mute',
    'utensils': 'utensils',
    'coffee': 'coffee',
    'wifi': 'wifi',
    // Agrega más mapeos según necesites
  };

  const validIconName = iconMap[iconName] || 'tag'; // 'tag' como fallback

  try {
    return (
      <FontAwesome5 
        name={validIconName} 
        size={14} 
        color="#8D6E63" 
        style={styles.tagIcon} 
      />
    );
  } catch (error) {
    // Si el icono falla, mostramos un icono genérico
    return (
      <FontAwesome5 
        name="tag" 
        size={14} 
        color="#8D6E63" 
        style={styles.tagIcon} 
      />
    );
  }
});

export default function CafeDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();

  // Estados agrupados por funcionalidad
  const [cafeData, setCafeData] = useState<{
    cafe: Cafe | null;
    visitas: any[];
    isSaved: boolean;
  }>({
    cafe: null,
    visitas: [],
    isSaved: false,
  });

  const [loadingStates, setLoadingStates] = useState({
    initial: true,
    more: false,
    refreshing: false,
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    hasMore: false,
    totalItems: 0,
  });

  // Memoización de valores computados
  const displayedTags = useMemo(() => 
    cafeData.cafe?.etiquetas || [], // Mostrar TODAS las etiquetas
    [cafeData.cafe?.etiquetas]
  );

  const mapUrl = useMemo(() => {
    if (!cafeData.cafe) return null;
    
    const { cafe } = cafeData;
    if (cafe.lat && cafe.lng) {
      const label = encodeURIComponent(cafe.name || 'Cafetería');
      return Platform.select({
        ios: `maps:0,0?q=${label}@${cafe.lat},${cafe.lng}`,
        android: `geo:0,0?q=${cafe.lat},${cafe.lng}(${label})`,
      });
    }
    
    const address = encodeURIComponent(cafe.address);
    return `https://www.google.com/maps/search/?api=1&query=${address}`;
  }, [cafeData.cafe]);

  // Función optimizada para fetch
  const fetchCafe = useCallback(async (page = 1) => {
    try {
      const isFirstLoad = page === 1;
      
      setLoadingStates(prev => ({
        ...prev,
        initial: isFirstLoad,
        more: !isFirstLoad,
        refreshing: false,
      }));

      const res = await fetch(`${API_URL}/cafes/${id}?page=${page}&limit=3`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data: CafeResponse = await res.json();
      
      setCafeData(prev => ({
        ...prev,
        cafe: data.cafe,
        visitas: isFirstLoad ? data.visitas.items : [...prev.visitas, ...data.visitas.items],
      }));
      
      setPagination({
        currentPage: data.visitas.currentPage,
        hasMore: data.visitas.hasMore,
        totalItems: data.visitas.total,
      });
      
      // Debug logging
      console.log('Cafe fetch response:', {
        currentPage: data.visitas.currentPage,
        hasMore: data.visitas.hasMore,
        totalItems: data.visitas.total,
        itemsReceived: data.visitas.items.length,
        totalPages: data.visitas.totalPages
      });
      
    } catch (error) {
      console.error('Error fetching cafe:', error);
    } finally {
      setLoadingStates({
        initial: false,
        more: false,
        refreshing: false,
      });
    }
  }, [id]);

  // Función para verificar estado guardado
  const checkSavedStatus = useCallback(async () => {
    if (!token || !cafeData.cafe?.id) return;
    
    try {
      const response = await apiService.getSavedStatus(cafeData.cafe.id, token);
      setCafeData(prev => ({ ...prev, isSaved: response.saved }));
    } catch (error) {
      console.error('Error al obtener estado de guardado:', error);
    }
  }, [token, cafeData.cafe?.id]);

  // Handlers optimizados
  const handleSave = useCallback(async () => {
    if (!token || !cafeData.cafe?.id) return;
    
    try {
      const response = await apiService.toggleSavedCafe(cafeData.cafe.id, token);
      setCafeData(prev => ({ ...prev, isSaved: response.saved }));
    } catch (error) {
      console.error('Error al guardar cafetería:', error);
    }
  }, [token, cafeData.cafe?.id]);

  const handleLoadMore = useCallback(() => {
    if (!loadingStates.more && pagination.hasMore && visitas && visitas.length > 0) {
      fetchCafe(pagination.currentPage + 1);
    }
  }, [loadingStates.more, pagination.hasMore, pagination.currentPage, fetchCafe, visitas]);

  const onRefresh = useCallback(() => {
    setLoadingStates(prev => ({ ...prev, refreshing: true }));
    setPagination({ currentPage: 1, hasMore: false });
    fetchCafe(1);
  }, [fetchCafe]);

  const onIrDireccionIconPress = useCallback(() => {
    if (!mapUrl) return;
    
    Linking.openURL(mapUrl).catch(err =>
      console.error('Error abriendo mapa:', err)
    );
  }, [mapUrl]);

  const handleVisitar = useCallback(() => {
    if (!cafeData.cafe) return;
    
    router.push({
      pathname: '/add-visit',
      params: {
        preselectedCafeId: cafeData.cafe.id,
        preselectedCafeName: cafeData.cafe.name
      }
    });
  }, [router, cafeData.cafe]);

  const handleLikeChange = useCallback((visitId: number, liked: boolean, likesCount: number) => {
    setCafeData(prev => ({
      ...prev,
      visitas: prev.visitas.map(visita => 
        visita.id === visitId 
          ? { ...visita, isLiked: liked, likesCount }
          : visita
      )
    }));
  }, []);

  const handleShare = useCallback((visitId: number) => {
    // Implementar lógica de compartir
  }, []);

  const handleDetails = useCallback((visit: any) => {
    router.push({
      pathname: '/visit-details',
      params: {
        visitId: visit.id.toString()
      }
    });
  }, [router]);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  // Effects
  useEffect(() => {
    fetchCafe();
  }, [fetchCafe]);

  useEffect(() => {
    checkSavedStatus();
  }, [checkSavedStatus]);

  // Renders condicionales
  if (loadingStates.initial) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7D3C98" />
        <Text>Cargando cafetería...</Text>
      </View>
    );
  }

  if (!cafeData.cafe) {
    return (
      <View style={styles.center}>
        <Text>No se encontró la cafetería 😢</Text>
      </View>
    );
  }

  const { cafe, visitas = [], isSaved } = cafeData;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loadingStates.refreshing}
          onRefresh={onRefresh}
          colors={['#8D6E63']}
          tintColor="#8D6E63"
        />
      }
    >
      {/* Header Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: cafe.imageUrl }} style={styles.image} />
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Info Container */}
      <View style={styles.infoContainer}>
        {/* Title and Save Button */}
        <View style={styles.titleRow}>
          <Text style={styles.name}>{cafe.name}</Text>
          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSave}
            activeOpacity={0.7}
          >
            <Text style={styles.saveButtonText}>
              {isSaved ? 'Guardada' : 'Guardar'}
            </Text>
            <MaterialIcons 
              name={isSaved ? "bookmark" : "bookmark-outline"} 
              size={20} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>

        {/* Tags */}
        <View style={styles.tagsWrapper}>
          {displayedTags.map((tag) => (
            <View key={tag.id} style={styles.tagItem}>
              <SafeIcon iconName={tag.icono} />
              <Text style={styles.tagText} numberOfLines={1}>
                {tag.nombre}
              </Text>
            </View>
          ))}
        </View>

        {/* Address */}
        <View style={styles.row}>
          <View style={styles.iconBox}>
            <DireccionIcon width={20} height={20} style={styles.iconSvg} />
          </View>
          <Text
            style={[styles.infoText, { flex: 1 }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {cafe.address}
          </Text>
          <TouchableOpacity 
            style={styles.irButton} 
            onPress={onIrDireccionIconPress}
            activeOpacity={0.7}
          >
            <Text style={styles.irButtonText}>Ir</Text>
            <MaterialIcons name="directions" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Opening Hours */}
        <View style={styles.row}>
          <View style={styles.iconBox}>
            <HorarioIcon width={20} height={20} style={styles.iconSvg} />
          </View>
          <Text style={styles.infoText}>{cafe.openingHours}</Text>
        </View>

        {/* Reviews Header */}
        <View style={styles.reviewsHeader}>
          <View style={styles.ratingContainer}>
            <Text style={styles.reviewsTitle}>Reseñas</Text>
            <View style={styles.ratingDisplay}>
              <Text style={styles.ratingValue}>{cafe.rating.toFixed(1)}</Text>
              <Ionicons name="star" size={20} color="#FFD700" />
            </View>
          </View>
          <TouchableOpacity 
            style={styles.visitarButton} 
            onPress={handleVisitar} 
            activeOpacity={0.7}
          >
            <Text style={styles.visitarText}>Visitar</Text>
            <MaterialIcons name="edit" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Visit Cards */}
      {visitas && visitas.map((visita) => (
        <VisitCard
          key={visita.id}
          visit={visita}
          onLikeChange={(liked) => handleLikeChange(visita.id, liked, visita.likesCount)}
          onShare={() => handleShare(visita.id)}
          onDetails={() => handleDetails(visita)}
        />
      ))}

      {/* Load More Button */}
      {pagination.hasMore && visitas && visitas.length > 0 && visitas.length < pagination.totalItems && !loadingStates.more && (
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={handleLoadMore}
          disabled={loadingStates.more}
        >
          <Text style={styles.loadMoreText}>Ver más reseñas</Text>
        </TouchableOpacity>
      )}

      {/* Loading indicator when loading more */}
      {loadingStates.more && (
        <View style={styles.loadMoreButton}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 16,
    backgroundColor: '#FFF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 220,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    backgroundColor: '#8D6E63',
    padding: 8,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  infoContainer: {
    paddingHorizontal: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8D6E63',
    flex: 1,
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
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
    marginRight: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#6B4423',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#34495E',
  },
  iconSvg: {
    width: 20,
    height: 20,
  },
  iconBox: {
    backgroundColor: '#F5E9DC',
    padding: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
    width: '100%',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8D6E63',
  },
  ratingValue: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 20,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  visitarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8D6E63',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  visitarText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadMoreButton: {
    backgroundColor: '#8D6E63',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  loadMoreText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8D6E63',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  irButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8D6E63',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  irButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
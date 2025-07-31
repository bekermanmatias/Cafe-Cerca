// app/cafe/[id].tsx
import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import TagChip from '../../components/TagChip';
import DireccionIcon from '../../assets/icons/direccion.svg';
import HorarioIcon from '../../assets/icons/horario.svg';
import IrDireccionIcon from '../../assets/icons/irdireccion.svg';
import Lapiz from '../../assets/icons/lapiz.svg';
import { API_URL } from '../../constants/Config';
import { VisitCard } from '../../components/VisitCard';
import { useAuth } from '../../context/AuthContext';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';

type Cafe = {
  id: number;
  name: string;
  address: string;
  imageUrl: string;
  tags: string[];
  rating: number;
  openingHours: string;
  lat: number;
  lng: number;
};

type Usuario = {
  id: number;
  name: string;
  profileImage: string | null;
};

type Reseña = {
  id: number;
  usuarioId: number;
  comentario: string;
  calificacion: number;
  fecha: string;
  visitaImagenes: Array<{
    imageUrl: string;
    orden: number;
  }>;
  usuario: Usuario;
  likesCount: number;
};

type CafeResponse = {
  cafe: Cafe;
  visitas: {
    items: any[]; // Usando any[] para compatibilidad con la estructura de VisitCard
    total: number;
    totalPages: number;
    currentPage: number;
    hasMore: boolean;
  };
};

export default function CafeDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [visitas, setVisitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { token } = useAuth();

  const fetchCafe = async (page = 1) => {
    try {
      const isFirstLoad = page === 1;
      if (isFirstLoad) setLoading(true);
      else setLoadingMore(true);

      const res = await fetch(`${API_URL}/cafes/${id}?page=${page}&limit=3`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data: CafeResponse = await res.json();
      
      if (isFirstLoad) {
        setCafe(data.cafe);
        setVisitas(data.visitas.items);
      } else {
        setVisitas(prev => [...prev, ...data.visitas.items]);
      }
      
      setHasMore(data.visitas.hasMore);
      setCurrentPage(data.visitas.currentPage);
    } catch (error) {
      console.error('Error al traer la cafetería:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchCafe();
  }, [id]);

  useEffect(() => {
    if (token && cafe?.id) {
      checkSavedStatus();
    }
  }, [cafe?.id, token]);

  const checkSavedStatus = async () => {
    if (!token || !cafe?.id) return;
    try {
      const response = await apiService.getSavedStatus(cafe.id, token);
      setIsSaved(response.saved);
    } catch (error) {
      console.error('Error al obtener estado de guardado:', error);
    }
  };

  const handleSave = async () => {
    if (!token || !cafe?.id) return;
    try {
      const response = await apiService.toggleSavedCafe(cafe.id, token);
      setIsSaved(response.saved);
    } catch (error) {
      console.error('Error al guardar cafetería:', error);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchCafe(currentPage + 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7D3C98" />
        <Text>Cargando cafetería...</Text>
      </View>
    );
  }

  if (!cafe) {
    return (
      <View style={styles.center}>
        <Text>No se encontró la cafetería 😢</Text>
      </View>
    );
  }

  const displayedTags = cafe.tags.slice(0, 4);

  const onGuardarPress = () => {

  };

const onIrDireccionIconPress = () => {
  if (!cafe) return;

  const lat = (cafe as any).lat;  // temporal, idealmente tipar bien Café
  const lng = (cafe as any).lng;

  if (lat && lng) {
    const label = encodeURIComponent(cafe.name || 'Cafetería');
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
    });

    if (url) {
      Linking.openURL(url).catch(err =>
        console.error('Error abriendo Google Maps:', err)
      );
    }
  } else {
    // fallback: dirección textual
    const address = encodeURIComponent(cafe.address);
    const url = `https://www.google.com/maps/search/?api=1&query=${address}`;

    Linking.openURL(url).catch(err =>
      console.error('Error abriendo Google Maps con dirección:', err)
    );
  }
};

  const handleVisitar = () => {
    router.push({
      pathname: '/add-visit',
      params: {
        preselectedCafeId: cafe?.id,
        preselectedCafeName: cafe?.name
      }
    });
  };

  const handleLike = () => {

  };

  const handleShare = (visitId: number) => {

  };

  const handleDetails = (visit: any) => {
    router.push({
      pathname: '/visit-details',
      params: {
        visitId: visit.id.toString()
      }
    });
  };

  const handleLikeChange = (visitId: number, liked: boolean, likesCount: number) => {
    // Actualizar el estado local de las visitas cuando cambia un like
    setVisitas(prevVisitas => 
      prevVisitas.map(visita => 
        visita.id === visitId 
          ? { ...visita, isLiked: liked, likesCount }
          : visita
      )
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: cafe.imageUrl }} style={styles.image} />
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{cafe.name}</Text>

          <View style={styles.iconsRight}>
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
        </View>

        <View style={styles.tagsWrapper}>
          {displayedTags.map((tag, index) => (
            <TagChip key={index} label={`${tag}`} />
          ))}
        </View>

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

        <View style={styles.row}>
          <View style={styles.iconBox}>
            <HorarioIcon width={20} height={20} style={styles.iconSvg} />
          </View>
          <Text style={styles.infoText}>{cafe.openingHours}</Text>
        </View>

        {/* Reseñas header */}
        <View style={styles.reviewsHeader}>
          <View style={styles.ratingContainer}>
            <Text style={styles.reviewsTitle}>Reseñas</Text>
            <View style={styles.ratingDisplay}>
              <Text style={styles.ratingValue}>{cafe.rating.toFixed(1)}</Text>
              <Ionicons name="star" size={20} color="#FFD700" />
            </View>
          </View>
          <TouchableOpacity style={styles.visitarButton} onPress={handleVisitar} activeOpacity={0.7}>
            <Text style={styles.visitarText}>Visitar</Text>
            <MaterialIcons name="edit" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de visitas - fuera del infoContainer para ancho completo */}
      {visitas.map((visita) => (
        <VisitCard
          key={visita.id}
          visit={visita}
          onLikeChange={(liked) => handleLikeChange(visita.id, liked, visita.likesCount)}
          onShare={() => handleShare(visita.id)}
          onDetails={() => handleDetails(visita)}
        />
      ))}

      {/* Botón Ver más */}
      {hasMore && (
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={handleLoadMore}
          disabled={loadingMore}
        >
          {loadingMore ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.loadMoreText}>Ver más reseñas</Text>
          )}
        </TouchableOpacity>
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
  },
  backButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    paddingHorizontal: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8D6E63',
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
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
  iconsRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
  starIcon: {
    fontSize: 18,
    marginLeft: 6,
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

  reviewsList: {
    width: '100%',
    marginTop: 16,
    gap: 16,
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

  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  }
});

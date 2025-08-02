import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions, FlatList, ViewToken } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatRelativeDate } from '../utils/dateUtils';

const windowWidth = Dimensions.get('window').width;

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

export interface VisitCardProps {
  visit: {
    id: number;
    fecha: string;
    estado: 'activa' | 'completada' | 'cancelada';
    esCompartida: boolean;
    imagenes: Array<{
      imageUrl: string;
      orden: number;
    }>;
    cafeteria: {
      name: string;
      address: string;
      imageUrl: string | null;
      rating: number;
    } | null;
    creador?: {
      id: number;
      name: string;
      profileImage: string | null;
      resena?: Resena;
    };
    participantes?: Participante[];
    likesCount?: number;
    // Compatibilidad con estructura antigua
    usuario?: Usuario;
    comentario?: string;
    calificacion?: number;
  };
  onShare?: () => void;
  onDetails?: () => void;
  onLikeChange?: (liked: boolean) => void;
}

interface RenderImageProps {
  item: any;
  index: number;
}

interface ViewableItemsChanged {
  viewableItems: ViewToken[];
  changed: ViewToken[];
}

const VisitCardComponent = ({
  visit,
  onShare,
  onDetails,
  onLikeChange,
}: VisitCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState(visit.likesCount || 0);
  const flatListRef = useRef<FlatList>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      checkLikeStatus();
    }
  }, [visit.id, token]);

  useEffect(() => {
    // Actualizar el contador local cuando cambia en las props
    setLocalLikesCount(visit.likesCount || 0);
  }, [visit.likesCount]);

  const checkLikeStatus = useCallback(async () => {
    if (!token) return;
    try {
      const response = await apiService.getLikeStatus(visit.id, token);
      setIsLiked(response.liked);
      setLocalLikesCount(response.likesCount);
    } catch (error) {
      console.error('Error al obtener estado del like:', error);
    }
  }, [visit.id, token]);

  const handleLike = useCallback(async () => {
    if (!token) return;
    try {
      const response = await apiService.toggleLike(visit.id, token);
      setIsLiked(response.liked);
      setLocalLikesCount(response.likesCount);
      if (onLikeChange) {
        onLikeChange(response.liked);
      }
    } catch (error) {
      console.error('Error al procesar el like:', error);
    }
  }, [visit.id, token, onLikeChange]);

  const renderImage = useCallback(({ item: imageUrl }: RenderImageProps) => (
    <View style={styles.imageWrapper}>
      <Image
        source={{ uri: imageUrl.imageUrl }}
        style={styles.image}
      />
    </View>
  ), []);

  const handleViewableItemsChanged = useRef(({ viewableItems }: ViewableItemsChanged) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentImageIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  // Memoizar cálculos costosos
  const { creador, participantes, promedioCalificaciones, cafeteriaName } = useMemo(() => {
    const creador = visit.creador || visit.usuario;
    const participantes = visit.participantes || [];
    
    // Calcular promedio de calificaciones entre todos los integrantes
    const calcularPromedioCalificaciones = () => {
      const calificaciones = [];
      
      // Agregar calificación del creador si existe
      if (visit.creador?.resena?.calificacion) {
        calificaciones.push(visit.creador.resena.calificacion);
      } else if (visit.calificacion) {
        calificaciones.push(visit.calificacion);
      }
      
      // Agregar calificaciones de participantes aceptados
      participantes.forEach(p => {
        if (p.estado === 'aceptada' && p.resena?.calificacion) {
          calificaciones.push(p.resena.calificacion);
        }
      });
      
      if (calificaciones.length === 0) return null;
      
      const promedio = calificaciones.reduce((sum, cal) => sum + cal, 0) / calificaciones.length;
      return Math.round(promedio * 10) / 10; // Redondear a 1 decimal
    };
    
    const promedioCalificaciones = calcularPromedioCalificaciones();
    const cafeteriaName = visit.cafeteria?.name || 'Cafetería no disponible';
    
    return { creador, participantes, promedioCalificaciones, cafeteriaName };
  }, [visit]);

  // URL de la imagen de perfil por defecto
  const defaultProfileImage = 'https://res.cloudinary.com/cafe-cerca/image/upload/v1/defaults/default-profile.png';

  // Memoizar la función para renderizar participantes
  const renderParticipants = useCallback(() => {
    const allParticipants = [];
    
    // Agregar el creador
    if (creador) {
      allParticipants.push({
        id: creador.id,
        name: creador.name,
        profileImage: creador.profileImage,
        isCreator: true
      });
    }
    
    // Agregar participantes aceptados
    participantes.forEach(p => {
      if (p.estado === 'aceptada') {
        allParticipants.push({
          id: p.id,
          name: p.name,
          profileImage: p.profileImage,
          isCreator: false
        });
      }
    });

    return (
      <View style={styles.participantsContainer}>
        <View style={styles.participantsPhotos}>
          {allParticipants.slice(0, 3).map((participant, index) => (
            <Image
              key={participant.id}
              source={{ 
                uri: participant.profileImage || defaultProfileImage
              }}
              style={[
                styles.participantPhoto,
                index > 0 && { marginLeft: -10 } // Efecto de superposición
              ]}
            />
          ))}
          {allParticipants.length > 3 && (
            <View style={[styles.participantPhoto, styles.moreParticipants, { marginLeft: -10 }]}>
              <Text style={styles.moreParticipantsText}>+{allParticipants.length - 3}</Text>
            </View>
          )}
        </View>
        <View style={styles.participantsNames}>
          <Text style={styles.participantNames} numberOfLines={1}>
            {allParticipants.length > 2 
              ? `${allParticipants.slice(0, 2).map(p => p.name).join(', ')} y ${allParticipants.length - 2} más`
              : allParticipants.map(p => p.name).join(', ')
            }
          </Text>
        </View>
      </View>
    );
  }, [creador, participantes]);

  // Memoizar los puntos de paginación
  const paginationDots = useMemo(() => 
    visit.imagenes.map((_, index) => (
      <View
        key={index}
        style={[
          styles.dot,
          { backgroundColor: index === currentImageIndex ? '#fff' : 'rgba(255, 255, 255, 0.5)' }
        ]}
      />
    )), [visit.imagenes, currentImageIndex]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.place}>{cafeteriaName}</Text>
          <Text style={styles.date}>
            {formatRelativeDate(visit.fecha)}
          </Text>
        </View>
        {/* Burbuja flotante con puntuación arriba a la derecha */}
        {promedioCalificaciones && (
          <View style={styles.ratingBubble}>
            <Text style={styles.ratingBubbleText}>{promedioCalificaciones} ★</Text>
          </View>
        )}
      </View>
      <View style={styles.imageSection}>
        <FlatList
          ref={flatListRef}
          data={visit.imagenes}
          renderItem={renderImage}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          snapToInterval={windowWidth - 32}
          decelerationRate="fast"
          snapToAlignment="center"
          keyExtractor={(_, index) => index.toString()}
          style={styles.imageList}
        />
        <View style={styles.paginationDots}>
          {paginationDots}
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.actions}>
          <View style={styles.leftActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <View style={styles.likeContainer}>
                <Ionicons 
                  name={isLiked ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isLiked ? "#FF4B4B" : "#666"} 
                />
                {localLikesCount > 0 && (
                  <Text style={[
                    styles.likesCount,
                    isLiked && styles.likesCountActive
                  ]}>
                    {localLikesCount}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={onShare}>
              <Ionicons name="share-social-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.actionButton} onPress={onDetails}>
            <Ionicons name="book-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        {/* Fotos de participantes debajo de los botones */}
        {renderParticipants()}
      </View>
    </View>
  );
};

// Memoizar el componente para evitar re-renders innecesarios
export const VisitCard = React.memo(VisitCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flex: 1,
  },
  place: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  imageSection: {
    height: 400,
    position: 'relative',
  },
  imageList: {
    flex: 1,
  },
  imageWrapper: {
    width: windowWidth - 32,
    height: 400,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  ratingBubble: {
    position: 'absolute',
    top: '50%',
    right: 16,
    backgroundColor: '#D7CCC8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -3 }], // Mitad de la altura aproximada del contenedor
  },
  ratingBubbleText: {
    color: '#5D4037',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  footer: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 0,
    paddingRight: 8,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 6,
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likesCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  likesCountActive: {
    color: '#FF4B4B',
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  participantsPhotos: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsNames: {
    flex: 1,
  },
  participantPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: 'white',
    backgroundColor: '#E0E0E0',
  },
  participantNames: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  moreParticipants: {
    backgroundColor: '#8D6E63',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreParticipantsText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
}); 
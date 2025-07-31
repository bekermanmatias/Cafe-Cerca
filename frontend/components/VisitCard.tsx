import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions, FlatList, ViewToken } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef, useEffect } from 'react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';

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

export const VisitCard = ({
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

  const checkLikeStatus = async () => {
    if (!token) return;
    try {
      const response = await apiService.getLikeStatus(visit.id, token);
      setIsLiked(response.liked);
      setLocalLikesCount(response.likesCount);
    } catch (error) {
      console.error('Error al obtener estado del like:', error);
    }
  };

  const handleLike = async () => {
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
  };

  const renderImage = ({ item: imageUrl }: RenderImageProps) => (
    <View style={styles.imageWrapper}>
      <Image
        source={{ uri: imageUrl.imageUrl }}
        style={styles.image}
      />
    </View>
  );

  const handleViewableItemsChanged = useRef(({ viewableItems }: ViewableItemsChanged) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentImageIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  // Obtener datos del creador y participantes (nueva estructura vs antigua)
  const creador = visit.creador || visit.usuario;
  const participantes = visit.participantes || [];
  const calificacion = visit.creador?.resena?.calificacion || visit.calificacion;
  const comentario = visit.creador?.resena?.comentario || visit.comentario;
  
  // Obtener el nombre de la cafetería de forma segura
  const cafeteriaName = visit.cafeteria?.name || 'Cafetería no disponible';
  
  // URL de la imagen de perfil por defecto
  const defaultProfileImage = 'https://res.cloudinary.com/cafe-cerca/image/upload/v1/defaults/default-profile.png';

  // Función para renderizar fotos de participantes
  const renderParticipants = () => {
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
    );
  };

  // Función para renderizar nombres de participantes
  const renderParticipantNames = () => {
    const names = [];
    
    if (creador) {
      names.push(creador.name);
    }
    
    participantes.forEach(p => {
      if (p.estado === 'aceptada') {
        names.push(p.name);
      }
    });

    if (names.length === 0) return null;

    const displayNames = names.length > 2 
      ? `${names.slice(0, 2).join(', ')} y ${names.length - 2} más`
      : names.join(', ');

    return (
      <Text style={styles.participantNames} numberOfLines={1}>
        {displayNames}
      </Text>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.place}>{cafeteriaName}</Text>
          <Text style={styles.date}>{new Date(visit.fecha).toLocaleDateString()}</Text>
          {renderParticipantNames()}
        </View>
        <View style={styles.headerRight}>
          {renderParticipants()}
        </View>
      </View>
      <View style={styles.imageSection}>
        <View style={styles.ratingBubble}>
          <Text style={styles.rating}>{calificacion} ★</Text>
        </View>
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
          {visit.imagenes.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                { backgroundColor: index === currentImageIndex ? '#fff' : 'rgba(255, 255, 255, 0.5)' }
              ]}
            />
          ))}
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
        <Text style={styles.description}>{comentario}</Text>
      </View>
    </View>
  );
};

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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: 'white',
    backgroundColor: '#E0E0E0',
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
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  rating: {
    fontSize: 16,
    color: '#000',
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
    gap: 6,
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
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
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
  participantNames: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
  },
  moreParticipants: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreParticipantsText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
}); 
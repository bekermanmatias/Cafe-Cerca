import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator,
  Platform,
  Alert,
  type MeasureOnSuccessCallback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { shareVisit } from '../constants/Sharing';
import { API_URL } from '../constants/Config';
import ComentariosList from '../components/ComentariosList';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const windowWidth = Dimensions.get('window').width;

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

interface VisitaDetalle {
  id: number;
  fecha: string;
  estado: 'activa' | 'completada' | 'cancelada';
  esCompartida: boolean;
  imagenes: Imagen[];
  cafeteria: Cafeteria;
  creador: Participante & { resena: Resena };
  participantes: Participante[];
  likesCount: number;
}

interface ApiResponse {
  mensaje: string;
  visita: VisitaDetalle;
}

export default function VisitDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visitData, setVisitData] = useState<VisitaDetalle | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isLiked, setIsLiked] = useState(false);
  const optionsButtonRef = useRef<View>(null);
  const { token } = useAuth();

  useEffect(() => {
    fetchVisitDetails();
  }, [params.visitId, params.refresh]);

  useEffect(() => {
    if (token && visitData?.id) {
      checkLikeStatus();
    }
  }, [visitData?.id, token]);

  const fetchVisitDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const visitId = String(params.visitId).replace(/[^0-9]/g, '');
      if (!visitId) {
        throw new Error('ID de visita no válido');
      }

      const fullUrl = `${API_URL}/visitas/${visitId}`;

      const response = await fetch(fullUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error del servidor:', errorData);
        throw new Error(errorData.mensaje || 'Error al obtener los detalles de la visita');
      }

      const data: ApiResponse = await response.json();
      

      
      // Validar datos críticos
      if (!data.visita) {
        throw new Error('No se recibieron datos de la visita');
      }
      
      if (!data.visita.creador) {
        console.error('❌ Datos de visita incompletos:', data.visita);
        throw new Error('No se encontró el creador de la visita');
      }

      if (!data.visita.creador.resena) {
        console.error('❌ Datos del creador incompletos:', data.visita.creador);
        throw new Error('No se encontró la reseña del creador');
      }



      setVisitData(data.visita);

      // Si tenemos token, verificar el estado del like
      if (token) {
        checkLikeStatus();
      }
    } catch (error: any) {
      console.error('❌ Error:', error);
      setError(error.message || 'Error al cargar los detalles de la visita');
    } finally {
      setIsLoading(false);
    }
  };

  const checkLikeStatus = async () => {
    if (!token || !visitData?.id) return;
    try {
      const response = await apiService.getLikeStatus(visitData.id, token);
      setIsLiked(response.liked);
      // Actualizar el contador de likes en el estado de la visita
      setVisitData(prevData => {
        if (!prevData) return null;
        return {
          ...prevData,
          likesCount: response.likesCount
        };
      });
    } catch (error) {
      console.error('Error al obtener estado del like:', error);
    }
  };

  const handleLike = async () => {
    if (!token || !visitData?.id) return;
    try {
      const response = await apiService.toggleLike(visitData.id, token);
      setIsLiked(response.liked);
      // Actualizar el contador de likes en el estado local
      setVisitData(prevData => {
        if (!prevData) return null;
        return {
          ...prevData,
          likesCount: response.likesCount
        };
      });
    } catch (error) {
      console.error('Error al procesar el like:', error);
    }
  };

  const handleShare = () => {
    if (visitData) {
      shareVisit(visitData.id);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Eliminar visita",
      "¿Estás seguro que deseas eliminar esta visita?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/visitas/${visitData?.id}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                router.back();
              } else {
                Alert.alert("Error", "No se pudo eliminar la visita");
              }
            } catch (error) {
              Alert.alert("Error", "Ocurrió un error al eliminar la visita");
            }
          }
        }
      ]
    );
  };

  const handleEdit = () => {
    // Implementar navegación a la pantalla de edición
    router.push({
      pathname: "/edit-visit" as any, // Temporal hasta que se cree la ruta
      params: { visitId: visitData?.id }
    });
  };

  const handleShowOptions = () => {
    if (!optionsButtonRef.current) return;

    const measureCallback: MeasureOnSuccessCallback = (x, y, width, height, pageX, pageY) => {
      const screenWidth = Dimensions.get('window').width;
      // Ajustamos la posición para que esté más cerca del botón
      const menuX = screenWidth - 170; // 140px del menú + 30px de margen
      const menuY = pageY - 35; // Subimos el menú para que esté más cerca del botón
      setMenuPosition({ x: menuX, y: menuY });
      setShowOptions(!showOptions);
    };

    optionsButtonRef.current.measure(measureCallback);
  };

  // URL de la imagen de perfil por defecto
  const defaultProfileImage = 'https://res.cloudinary.com/cafe-cerca/image/upload/v1/defaults/default-profile.png';

  // Calcular promedio de calificaciones entre todos los integrantes
  const calcularPromedioCalificaciones = () => {
    if (!visitData) return null;
    
    const calificaciones = [];
    
    // Agregar calificación del creador si existe
    if (visitData.creador?.resena?.calificacion) {
      calificaciones.push(visitData.creador.resena.calificacion);
    }
    
    // Agregar calificaciones de participantes aceptados
    visitData.participantes.forEach(p => {
      if (p.estado === 'aceptada' && p.resena?.calificacion) {
        calificaciones.push(p.resena.calificacion);
      }
    });
    
    if (calificaciones.length === 0) return null;
    
    const promedio = calificaciones.reduce((sum, cal) => sum + cal, 0) / calificaciones.length;
    return Math.round(promedio * 10) / 10; // Redondear a 1 decimal
  };
  
  const promedioCalificaciones = calcularPromedioCalificaciones();

  const renderContent = () => {
    if (!visitData) return null;

    return (
      <>
        {/* Información de la visita en la parte superior */}
        <View style={styles.visitInfoHeader}>
          <View style={styles.visitInfoLeft}>
            <Text style={styles.cafeteriaName}>{visitData.cafeteria.name}</Text>
            <Text style={styles.visitDate}>
              {new Date(visitData.fecha).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
          {promedioCalificaciones && (
            <View style={styles.headerRatingBubble}>
              <Text style={styles.headerRatingBubbleText}>{promedioCalificaciones} ★</Text>
            </View>
          )}
        </View>

                 <View style={styles.mainImageContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imageScrollContainer}
          >
            {visitData.imagenes.map((imagen, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image 
                  source={{ uri: imagen.imageUrl }} 
                  style={styles.mainImage}
                />
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.actionButtons}>
          <View style={styles.leftActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <View style={styles.likeContainer}>
                <Ionicons 
                  name={isLiked ? "heart" : "heart-outline"} 
                  size={28} 
                  color={isLiked ? "#FF4B4B" : "#000"} 
                />
                {visitData.likesCount > 0 && (
                  <Text style={[
                    styles.likesCount,
                    isLiked && styles.likesCountActive
                  ]}>
                    {visitData.likesCount}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={28} color="#000" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.rightActions}>
            <TouchableOpacity 
              ref={optionsButtonRef}
              style={styles.actionButton}
              onPress={handleShowOptions}
            >
              <Ionicons name="ellipsis-vertical" size={28} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Reseña del creador */}
        <View style={styles.reviewContainer}>
          <View style={styles.authorSection}>
            <Image
              source={{ 
                uri: visitData.creador.profileImage || defaultProfileImage
              }}
              style={styles.authorPhoto}
            />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{visitData.creador.name}</Text>
              <View style={styles.starsContainer}>
                {[...Array(5)].map((_, i) => (
                  <Ionicons
                    key={i}
                    name={i < visitData.creador.resena.calificacion ? "star" : "star-outline"}
                    size={20}
                    color="#FFD700"
                  />
                ))}
              </View>
            </View>
          </View>
          <Text style={styles.reviewText}>{visitData.creador.resena.comentario}</Text>
        </View>

        {/* Reseñas de participantes */}
        {visitData.participantes.map((participante, index) => (
          <View key={participante.id} style={styles.reviewContainer}>
            <View style={styles.authorSection}>
              <Image
                source={{ 
                  uri: participante.profileImage || defaultProfileImage
                }}
                style={styles.authorPhoto}
              />
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{participante.name}</Text>
                {participante.resena ? (
                  <View style={styles.starsContainer}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < participante.resena!.calificacion ? "star" : "star-outline"}
                        size={20}
                        color="#FFD700"
                      />
                    ))}
                  </View>
                ) : (
                  <Text style={styles.pendingReview}>
                    {participante.estado === 'pendiente' ? 'Invitación pendiente' : 'Sin reseña'}
                  </Text>
                )}
              </View>
            </View>
            {participante.resena && (
              <Text style={styles.reviewText}>{participante.resena.comentario}</Text>
            )}
          </View>
        ))}
      </>
    );
  };

  // Mostrar un indicador de carga mientras se obtienen los datos
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8D6E63" />
        <Text style={styles.loadingText}>Cargando detalles de la visita...</Text>
      </View>
    );
  }

  // Mostrar mensaje de error si algo salió mal
  if (error || !visitData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          onPress={() => {
            setError(null);
            fetchVisitDetails(); // Intentar cargar de nuevo
          }} 
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Intentar de nuevo</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.errorButton}
        >
          <Text style={styles.errorButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: ''
        }}
      />

      <ComentariosList 
        visitaId={visitData.id}
        ListHeaderComponent={renderContent}
      />

      {showOptions && (
        <>
          <TouchableOpacity 
            style={styles.overlay} 
            activeOpacity={0} 
            onPress={() => setShowOptions(false)} 
          />
          <View style={[styles.optionsMenu, { top: menuPosition.y, left: menuPosition.x }]}>
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={() => {
                setShowOptions(false);
                handleEdit();
              }}
            >
              <Ionicons name="create-outline" size={24} color="#000" />
              <Text style={styles.optionText}>Modificar visita</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.optionItem, styles.deleteOption]}
              onPress={() => {
                setShowOptions(false);
                handleDelete();
              }}
            >
              <Ionicons name="trash-outline" size={24} color="#FF4444" />
              <Text style={styles.deleteOptionText}>Eliminar visita</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pendingReview: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  reviewText: {
    fontSize: 16,
    color: '#333',
    marginTop: 8,
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#8D6E63',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContent: {
    backgroundColor: '#fff',
  },
  comentariosListContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },

  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  participantPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    borderWidth: 2,
    borderColor: 'white',
  },
  moreParticipants: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -10,
  },
  moreParticipantsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  mainImageContainer: {
    width: '100%',
    height: 450,
    position: 'relative',
  },
  imageScrollContainer: {
    paddingHorizontal: 0,
  },
  imageWrapper: {
    marginRight: 0,
    overflow: 'hidden',
  },
  mainImage: {
    width: windowWidth,
    height: 450,
  },
  ratingBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 16,
  },
  rightActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
  },
  optionsMenu: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    minWidth: 140,
    zIndex: 9999,
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
    }),
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  deleteOption: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 4,
  },
  deleteOptionText: {
    fontSize: 14,
    color: '#FF4444',
    fontWeight: '500',
  },
  reviewContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  commentInputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  publishButton: {
    backgroundColor: '#8D6E63',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  retryButton: {
    backgroundColor: '#8D6E63',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  comentariosContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  comentariosTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  flatList: {
    flex: 1,
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likesCount: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
    minWidth: 20, // Para evitar saltos cuando cambia el número
  },
  likesCountActive: {
    color: '#FF4B4B',
  },
  ratingBubble: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#D7CCC8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBubbleText: {
    color: '#5D4037',
    fontSize: 16,
    fontWeight: 'bold',
  },
  visitInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  visitInfoLeft: {
    flex: 1,
  },
  cafeteriaName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  visitDate: {
    fontSize: 14,
    color: '#666',
  },
  headerRatingBubble: {
    backgroundColor: '#D7CCC8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRatingBubbleText: {
    color: '#5D4037',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
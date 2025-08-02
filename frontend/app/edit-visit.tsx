import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { AntDesign } from '@expo/vector-icons';
import ImageEditor from '../components/ImageEditor';
import LoadingSpinner from '../components/LoadingSpinner';
import { API_URL, API_ENDPOINTS } from '../constants/Config';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const STANDARD_SIZE = 1080;
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
  tags: Tag[];  // ahora es array de objetos Tag
  openingHours: string;
}

interface Imagen {
  imageUrl: string;
  orden: number;
}

interface Friend {
  id: number;
  name: string;
  profileImage: string;
}

interface VisitaDetalle {
  id: number;
  usuarioId: number;
  cafeteriaId: number;
  fecha: string;
  esCompartida: boolean;
  maxParticipantes: number;
  estado: string;
  imagenes: Imagen[];
  cafeteria: Cafe;
  participantes: any[];
  resenas: any[];
  creador?: {
    id: number;
    name: string;
    profileImage?: string;
    resena?: {
      id: number;
      calificacion: number;
      comentario: string;
      fecha: string;
    };
  };
}

export default function EditVisitScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [originalVisit, setOriginalVisit] = useState<VisitaDetalle | null>(null);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [showCafeSelector, setShowCafeSelector] = useState(false);
  const [isLoadingCafes, setIsLoadingCafes] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<any[]>([]);
  const [showFriendsSelector, setShowFriendsSelector] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const { user, token } = useAuth();

  // Primero cargamos las cafeterías y amigos
  useEffect(() => {
    fetchCafes();
    fetchFriends();
  }, []);

  // Después de cargar las cafeterías, cargamos los detalles de la visita
  useEffect(() => {
    if (cafes.length > 0) {
      fetchVisitDetails();
    }
  }, [cafes, params.visitId]);

  // Recargar datos cuando cambien los parámetros (cuando regrese de selección de amigos)
  useEffect(() => {
    if (cafes.length > 0 && params.visitId) {
      fetchVisitDetails();
    }
  }, [cafes, params.visitId, params.refresh]);

  const fetchCafes = async () => {
    try {
      setIsLoadingCafes(true);
      const response = await fetch(`${API_URL}/cafes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Error al obtener las cafeterías');
      }
      const data = await response.json();
      // Ordenar cafeterías alfabéticamente por nombre
      const sortedCafes = data.sort((a: Cafe, b: Cafe) => 
        a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
      );
      setCafes(sortedCafes);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las cafeterías');
    } finally {
      setIsLoadingCafes(false);
    }
  };

  const fetchVisitDetails = async () => {
    try {
      setIsLoading(true);
      const visitId = String(params.visitId).replace(/[^0-9]/g, '');
      const response = await fetch(`${API_URL}/visitas/${visitId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener los detalles de la visita');
      }

      const data = await response.json();
      console.log('🔍 DEBUG - Datos recibidos del backend:', JSON.stringify(data.visita, null, 2));
      setOriginalVisit(data.visita);
      
      // Buscar la reseña del creador en la nueva estructura
      const resenaCreador = data.visita.creador?.resena;
      console.log('🔍 DEBUG - Reseña del creador:', resenaCreador);
      
      if (resenaCreador) {
        console.log('✅ Estableciendo rating y comentario:', {
          rating: resenaCreador.calificacion,
          comment: resenaCreador.comentario
        });
        setRating(resenaCreador.calificacion);
        setComment(resenaCreador.comentario);
      } else {
        console.log('❌ No se encontró reseña del creador');
        setRating(0);
        setComment('');
      }
      
      setImages(data.visita.imagenes?.map((img: Imagen) => img.imageUrl) || []);
      setSelectedCafe(data.visita.cafeteria);
      
      // Precargar los amigos seleccionados (participantes)
      if (data.visita.participantes && data.visita.participantes.length > 0) {
        console.log('🔍 DEBUG - Participantes encontrados:', data.visita.participantes);
        setSelectedFriends(data.visita.participantes);
      } else {
        console.log('❌ No se encontraron participantes');
        setSelectedFriends([]);
      }
    } catch (error) {
      console.error('Error al cargar detalles de la visita:', error);
      Alert.alert('Error', 'No se pudieron cargar los detalles de la visita');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCafeItem = ({ item }: { item: Cafe }) => (
    <TouchableOpacity 
      style={styles.cafeItem}
      onPress={() => {
        setSelectedCafe(item);
        setShowCafeSelector(false);
      }}
    >
      <View style={styles.cafeItemContent}>
        <View style={styles.cafeInfo}>
          <Text style={styles.cafeName}>{item.name}</Text>
          <Text style={styles.cafeAddress}>{item.address}</Text>
          <View style={styles.cafeRating}>
            {[...Array(5)].map((_, i) => (
              <AntDesign
                key={i}
                name={i < Math.round(item.rating) ? "star" : "staro"}
                size={16}
                color="#FFD700"
              />
            ))}
          </View>
        </View>
        {item.imageUrl && (
          <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.cafeImage}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFriendItem = ({ item }: { item: Friend }) => {
    const isSelected = selectedFriends.some(friend => friend.id === item.id);
    
    return (
      <TouchableOpacity 
        style={[styles.friendItem, isSelected && styles.friendItemSelected]}
        onPress={() => {
          if (isSelected) {
            setSelectedFriends(selectedFriends.filter(friend => friend.id !== item.id));
          } else {
            if (selectedFriends.length < 9) { // Máximo 10 participantes (incluyendo el creador)
              setSelectedFriends([...selectedFriends, item]);
            } else {
              Alert.alert('Límite alcanzado', 'Puedes invitar hasta 9 amigos (máximo 10 participantes en total)');
            }
          }
        }}
      >
        <View style={styles.friendItemContent}>
          <Image 
            source={{ uri: item.profileImage || 'https://via.placeholder.com/50' }} 
            style={styles.friendAvatar}
          />
          <View style={styles.friendInfo}>
            <Text style={styles.friendName}>{item.name}</Text>
          </View>
          {isSelected && (
            <AntDesign name="checkcircle" size={24} color="#4CAF50" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const processImage = async (uri: string) => {
    try {
      const result = await manipulateAsync(
        uri,
        [{ resize: { width: STANDARD_SIZE, height: STANDARD_SIZE } }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      return result.uri;
    } catch (error) {
      console.error('Error procesando imagen:', error);
      return null;
    }
  };

  const handleSelectImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Se necesitan permisos para acceder a la galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        if (images.length >= 5) {
          Alert.alert('Error', 'Puedes seleccionar hasta 5 imágenes en total');
          return;
        }

        const processedUri = await processImage(result.assets[0].uri);
        if (processedUri) {
          setImages([...images, processedUri]);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar la imagen');
    }
  };

  const handleSaveEditedImage = (editedUri: string) => {
    setImages([...images, editedUri]);
    setEditingImage(null);
  };

  const handleUpdate = async () => {
    if (!selectedCafe) {
      Alert.alert('Error', 'Por favor selecciona una cafetería');
      return;
    }

    if (rating === 0) {
      Alert.alert('Error', 'Por favor selecciona una calificación');
      return;
    }

    if (comment.trim().length === 0) {
      Alert.alert('Error', 'Por favor agrega un comentario');
      return;
    }

    setIsUpdating(true);

    try {
      console.log('🔍 DEBUG - Iniciando actualización de visita');
      console.log('🔍 DEBUG - Token disponible:', !!token);
      
      if (!token) {
        Alert.alert('Error', 'No hay token de autenticación disponible');
        return;
      }
      
      const formData = new FormData();
      
      formData.append('cafeteriaId', selectedCafe.id.toString());
      formData.append('calificacion', rating.toString());
      formData.append('comentario', comment);
      
      // Determinar si es compartida basado en si hay amigos seleccionados
      const esCompartida = selectedFriends.length > 0;
      formData.append('esCompartida', esCompartida.toString());
      formData.append('maxParticipantes', '10');
      
      console.log('🔍 DEBUG - Datos básicos:', {
        cafeteriaId: selectedCafe.id,
        calificacion: rating,
        comentario: comment,
        esCompartida: esCompartida,
        maxParticipantes: 10
      });
      
      // Agregar los amigos seleccionados
      if (selectedFriends.length > 0) {
        // Enviar como participantes para compatibilidad con el backend
        const participantesIds = selectedFriends.map(friend => friend.id);
        formData.append('participantes', JSON.stringify(participantesIds));
        console.log('🔍 DEBUG - Participantes seleccionados:', participantesIds);
      } else {
        // Si no hay amigos seleccionados, enviar array vacío
        formData.append('participantes', JSON.stringify([]));
        console.log('🔍 DEBUG - No hay participantes seleccionados');
      }

      // Agregar las URLs de las imágenes existentes
      const existingImages = images.filter(uri => uri.startsWith('http'));
      formData.append('imagenesExistentes', JSON.stringify(existingImages));

      // Agregar las nuevas imágenes
      const newImages = images.filter(uri => !uri.startsWith('http'));
      for (let i = 0; i < newImages.length; i++) {
        const uri = newImages[i];
        const filename = uri.split('/').pop() || `image-${i}.jpg`;
        
        formData.append('imagenes', {
          uri: uri,
          type: 'image/jpeg',
          name: filename,
        } as any);
      }

      console.log('🔍 DEBUG - Enviando request a:', API_ENDPOINTS.VISITAS.UPDATE(originalVisit?.id || 0));
      const response = await fetch(API_ENDPOINTS.VISITAS.UPDATE(originalVisit?.id || 0), {
        method: 'PUT',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('🔍 DEBUG - Status de respuesta:', response.status);
      const responseData = await response.json();
      console.log('🔍 DEBUG - Datos de respuesta:', responseData);

      if (!response.ok) {
        console.error('❌ DEBUG - Error en respuesta:', responseData);
        throw new Error(responseData.mensaje || 'Error al actualizar la visita');
      }

      Alert.alert('Éxito', 'Visita actualizada correctamente', [
        { 
          text: 'OK', 
          onPress: () => {
            // Regresar a la pantalla anterior
            router.back();
          }
        }
      ]);
    } catch (error) {
      console.error('Error al actualizar:', error);
      Alert.alert('Error', 'No se pudo actualizar la visita. Por favor, intenta de nuevo.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const fetchFriends = async () => {
    try {
      setIsLoadingFriends(true);
      const friendsData = await apiService.obtenerListaAmigos();
      setFriends(friendsData);
    } catch (error) {
      console.error('Error al cargar amigos:', error);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const handleAddFriends = () => {
    setShowFriendsSelector(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8D6E63" />
        <Text style={styles.loadingText}>Cargando datos de la visita...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#8D6E63" />
            <Text style={styles.loadingText}>Guardando cambios...</Text>
          </View>
        )}


        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amigos</Text>
            <TouchableOpacity 
              style={styles.friendsButton}
              onPress={() => setShowFriendsSelector(true)}
            >
              <Text style={styles.friendsButtonText}>
                {selectedFriends.length > 0 
                  ? `${selectedFriends.length} amigo${selectedFriends.length > 1 ? 's' : ''} seleccionado${selectedFriends.length > 1 ? 's' : ''}`
                  : 'Agregar amigos a la visita'
                }
              </Text>
              <AntDesign name="right" size={20} color="#8D6E63" />
            </TouchableOpacity>
            {selectedFriends.length > 0 && (
              <View style={styles.selectedFriendsContainer}>
                {selectedFriends.map((friend) => (
                  <View key={friend.id} style={styles.selectedFriendChip}>
                    <Image 
                      source={{ uri: friend.profileImage || 'https://via.placeholder.com/30' }} 
                      style={styles.selectedFriendAvatar}
                    />
                    <Text style={styles.selectedFriendName}>{friend.name}</Text>
                    <TouchableOpacity
                      onPress={() => setSelectedFriends(selectedFriends.filter(f => f.id !== friend.id))}
                      style={styles.removeFriendButton}
                    >
                      <AntDesign name="close" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cafetería</Text>
            <TouchableOpacity 
              style={styles.cafeSelector}
              onPress={() => setShowCafeSelector(true)}
            >
              <Text style={styles.cafeSelectorText}>
                {selectedCafe ? selectedCafe.name : 'Seleccionar cafetería'}
              </Text>
              <AntDesign name="down" size={20} color="#8D6E63" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Puntuación</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                >
                  <AntDesign
                    name={star <= rating ? "star" : "staro"}
                    size={30}
                    color={star <= rating ? "#FFD700" : "#8D6E63"}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <TextInput
              style={styles.commentInput}
              placeholder="Comenta tu experiencia..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
              value={comment}
              onChangeText={setComment}
            />
          </View>

          <View style={styles.imagesGrid}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImage}
                  onPress={() => setImages(images.filter((_, i) => i !== index))}
                >
                  <AntDesign name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={handleSelectImages}
              >
                <AntDesign name="plus" size={30} color="#8D6E63" />
                <Text style={styles.addImageText}>Agregar imágenes</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.publishButton, isLoading && styles.disabledButton]}
            onPress={handleUpdate}
            disabled={isLoading}
          >
            <Text style={styles.publishButtonText}>
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Text>
          </TouchableOpacity>

          {editingImage && (
            <ImageEditor
              uri={editingImage}
              visible={true}
              onSave={handleSaveEditedImage}
              onCancel={() => setEditingImage(null)}
            />
          )}

          <Modal
            visible={showFriendsSelector}
            animationType="slide"
            transparent={true}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Seleccionar Amigos</Text>
                  <TouchableOpacity 
                    onPress={() => setShowFriendsSelector(false)}
                    style={styles.closeButton}
                  >
                    <AntDesign name="close" size={24} color="#000" />
                  </TouchableOpacity>
                </View>

                {isLoadingFriends ? (
                  <ActivityIndicator size="large" color="#8D6E63" />
                ) : friends.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No tienes amigos agregados</Text>
                    <Text style={styles.emptyStateSubtext}>Agrega amigos desde la pestaña de Amigos para poder invitarlos a visitas compartidas</Text>
                  </View>
                ) : (
                  <FlatList
                    data={friends}
                    renderItem={renderFriendItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.friendsList}
                  />
                )}
              </View>
            </View>
          </Modal>
        </View>

        <Modal
          visible={showCafeSelector}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Seleccionar Cafetería</Text>
                <TouchableOpacity 
                  onPress={() => setShowCafeSelector(false)}
                  style={styles.closeButton}
                >
                  <AntDesign name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              {isLoadingCafes ? (
                <ActivityIndicator size="large" color="#8D6E63" />
              ) : (
                <FlatList
                  data={cafes}
                  renderItem={renderCafeItem}
                  keyExtractor={item => item.id.toString()}
                  contentContainerStyle={styles.cafeList}
                />
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
      
      <LoadingSpinner 
        visible={isUpdating} 
        message="Actualizando visita..."
      />
    </>
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
    backgroundColor: '#FFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    padding: 16,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  friendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  friendsButtonText: {
    color: '#8D6E63',
    fontSize: 16,
  },
  cafeteriaText: {
    fontSize: 16,
    color: '#333',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  commentInput: {
    height: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 8,
  },
  imageContainer: {
    width: '31%',
    aspectRatio: 1,
    marginBottom: 8,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImage: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#8D6E63',
    borderRadius: 12,
    padding: 4,
  },
  addImageButton: {
    width: '31%',
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: '#8D6E63',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    color: '#8D6E63',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  publishButton: {
    backgroundColor: '#8D6E63',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  publishButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  cafeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 8,
  },
  cafeSelectorText: {
    fontSize: 16,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  cafeList: {
    padding: 16,
  },
  cafeItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
  },
  cafeItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cafeInfo: {
    flex: 1,
    marginRight: 16,
  },
  cafeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cafeAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cafeRating: {
    flexDirection: 'row',
    gap: 2,
  },
  cafeImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  // Estilos para amigos
  selectedFriendsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  selectedFriendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectedFriendAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  selectedFriendName: {
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  removeFriendButton: {
    padding: 2,
  },
  friendItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 12,
  },
  friendItemSelected: {
    backgroundColor: '#F8F8F8',
  },
  friendItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  friendsList: {
    padding: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 
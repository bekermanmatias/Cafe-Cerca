import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Alert, Modal, FlatList, ActivityIndicator, BackHandler, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { AntDesign } from '@expo/vector-icons';
import ImageEditor from '../components/ImageEditor';
import { API_URL } from '../constants/Config';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const STANDARD_SIZE = 1080; // Tamaño estándar para las imágenes (1080x1080)

interface Cafe {
  id: number;
  name: string;
  address: string;
  rating: number;
  imageUrl: string | null;
  tags: string[];
  openingHours: string;
}

interface Friend {
  id: number;
  name: string;
  profileImage: string;
}

export default function AddVisitScreen() {
  const router = useRouter();
  const { preselectedCafeId, preselectedCafeName } = useLocalSearchParams();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [selectedCafe, setSelectedCafe] = useState<Cafe | null>(null);
  const [showCafeSelector, setShowCafeSelector] = useState(false);
  const [isLoadingCafes, setIsLoadingCafes] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [showFriendsSelector, setShowFriendsSelector] = useState(false);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    fetchCafes();
    fetchFriends();

    // Si hay una cafetería preseleccionada, la buscamos y seleccionamos
    if (preselectedCafeId) {
      const cafeId = typeof preselectedCafeId === 'string' ? parseInt(preselectedCafeId) : preselectedCafeId;
      fetch(`${API_URL}/cafes/${cafeId}`)
        .then(res => res.json())
        .then(data => {
          // Ahora la cafetería viene en data.cafe
          setSelectedCafe(data.cafe);
        })
        .catch(error => {
          console.error('Error al cargar la cafetería preseleccionada:', error);
        });
    }

    if (Platform.OS !== 'web') {
      // Manejar el botón físico de retroceso en móviles
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (showCafeSelector) {
            setShowCafeSelector(false);
            return true;
          }
          handleBack();
          return true;
        }
      );
      return () => backHandler.remove();
    } else {
      // Manejar la navegación en web
      const handlePopState = (event: PopStateEvent) => {
        event.preventDefault();
        handleBack();
      };

      window.history.pushState(null, '', window.location.pathname);
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [preselectedCafeId, showCafeSelector]);

  useEffect(() => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para crear una visita');
      router.replace('/(auth)/signin');
    }
  }, [user]);

  const fetchCafes = async () => {
    try {
      setIsLoadingCafes(true);
      const response = await fetch(`${API_URL}/cafes`);
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

  const fetchFriends = async () => {
    try {
      setIsLoadingFriends(true);
      const friendsData = await apiService.obtenerListaAmigos();
      setFriends(friendsData);
    } catch (error) {
      console.error('Error al cargar amigos:', error);
      // No mostrar alerta aquí para no interrumpir la experiencia del usuario
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const processImage = async (uri: string) => {
    try {
      // Procesar la imagen para asegurar que sea cuadrada y del tamaño correcto
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
      // Solicitar permisos primero
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Se necesitan permisos para acceder a la galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Habilita el editor nativo
        aspect: [1, 1], // Fuerza aspecto cuadrado
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

  const handlePublish = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Debes iniciar sesión para crear una visita');
      return;
    }

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

    try {
      const formData = new FormData();
      formData.append('cafeteriaId', selectedCafe.id.toString());
      formData.append('comentario', comment);
      formData.append('calificacion', rating.toString());

      // Agregar amigos seleccionados si hay alguno
      if (selectedFriends.length > 0) {
        formData.append('esCompartida', 'true');
        formData.append('maxParticipantes', '10');
        selectedFriends.forEach(friend => {
          formData.append('amigosIds', friend.id.toString());
        });
      }

      // Agregar imágenes si las hay
      if (images.length > 0) {
        images.forEach((uri, index) => {
          formData.append('imagenes', {
            uri,
            type: 'image/jpeg',
            name: `image-${index}.jpg`
          } as any);
        });
      }

      if (!token) {
        Alert.alert('Error', 'No se encontró el token de autenticación');
        return;
      }

      let response;
      let successMessage;

      // Si hay amigos seleccionados, crear visita compartida
      if (selectedFriends.length > 0) {

        


        try {
          response = await apiService.crearVisitaCompartida(formData);
          successMessage = `Visita compartida creada correctamente. Se han enviado invitaciones a ${selectedFriends.length} amigo${selectedFriends.length > 1 ? 's' : ''}.`;
        } catch (error) {
          console.error('Error específico al crear visita compartida:', error);
          if (error instanceof Error && error.message.includes('Error al crear la visita compartida')) {
            // Intentar obtener más detalles del error
            throw new Error(`Error al crear la visita compartida: ${error.message}`);
          }
          throw error;
        }
      } else {
        // Crear visita normal

        response = await fetch(`${API_URL}/visitas`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Error al publicar la visita: ${response.status}`);
        }
        successMessage = 'Visita publicada correctamente';
      }

      Alert.alert('Éxito', successMessage, [
        { 
          text: 'OK', 
          onPress: () => {
            router.back();
            router.setParams({ refresh: Date.now().toString() });
          }
        }
      ]);
    } catch (error) {
      console.error('Error publicando visita:', error);
      let errorMessage = 'No se pudo publicar la visita';
      
      if (error instanceof Error) {
        if (error.message.includes('Error al crear la visita compartida')) {
          errorMessage = error.message;
        } else if (error.message.includes('Network request failed')) {
          errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
        } else if (error.message.includes('401')) {
          errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Datos inválidos. Verifica la información ingresada.';
        }
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const handleBack = () => {
    // Verificar si hay cambios
    const hasChanges = rating > 0 || 
                      comment.trim().length > 0 || 
                      images.length > 0 || 
                      selectedCafe !== null ||
                      selectedFriends.length > 0;

    if (hasChanges) {
      if (Platform.OS === 'web') {
        // Para web, usamos confirm nativo del navegador
        const shouldExit = window.confirm('¿Estás seguro que deseas salir? Se perderán los cambios no guardados.');
        if (shouldExit) {
          router.back();
        } else {
          // Si el usuario cancela, empujamos un nuevo estado para mantener la navegación consistente
          window.history.pushState(null, '', window.location.pathname);
        }
      } else {
        // Para móviles, usamos Alert de React Native
        Alert.alert(
          'Confirmar',
          '¿Estás seguro que deseas salir? Se perderán los cambios no guardados.',
          [
            {
              text: 'Cancelar',
              style: 'cancel',
              onPress: () => {
                if (Platform.OS === 'web') {
                  window.history.pushState(null, '', window.location.pathname);
                }
              }
            },
            {
              text: 'Salir',
              style: 'destructive',
              onPress: () => router.back()
            }
          ],
          { cancelable: true }
        );
      }
    } else {
      router.back();
    }
    return true;
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

  return (
    <>
      <ScrollView style={styles.container}>
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
            <Text style={styles.sectionTitle}>Cafeteria</Text>
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
            style={styles.publishButton}
            onPress={handlePublish}
          >
            <Text style={styles.publishButtonText}>
              {selectedFriends.length > 0 ? 'Crear Visita Compartida' : 'Publicar'}
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
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },

  content: {
    flex: 1,
    paddingHorizontal: 16,
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
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  selectedFriendAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  selectedFriendName: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  removeFriendButton: {
    marginLeft: 6,
    padding: 2,
  },
  friendsList: {
    padding: 16,
  },
  friendItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
  },
  friendItemSelected: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  friendItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    backgroundColor: '#ccc',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
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
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { AntDesign } from '@expo/vector-icons';
import ImageEditor from '../components/ImageEditor';
import { API_URL } from '../constants/Config';

const STANDARD_SIZE = 1080;

interface Cafe {
  id: number;
  name: string;
  address: string;
  rating: number;
  imageUrl: string | null;
  tags: string[];
  openingHours: string;
}

interface Imagen {
  imageUrl: string;
  orden: number;
}

interface VisitaDetalle {
  id: number;
  usuarioId: number;
  cafeteriaId: number;
  comentario: string;
  calificacion: number;
  fecha: string;
  imagenes: Imagen[];
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

  useEffect(() => {
    fetchVisitDetails();
    fetchCafes();
  }, [params.visitId]);

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

  const fetchVisitDetails = async () => {
    try {
      setIsLoading(true);
      const visitId = String(params.visitId).replace(/[^0-9]/g, '');
      const response = await fetch(`${API_URL}/visitas/${visitId}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener los detalles de la visita');
      }

      const data = await response.json();
      setOriginalVisit(data.visita);
      setRating(data.visita.calificacion);
      setComment(data.visita.comentario);
      setImages(data.visita.imagenes.map((img: Imagen) => img.imageUrl));

      // Buscar y establecer la cafetería seleccionada
      const cafeteriaId = data.visita.cafeteriaId;
      const cafe = cafes.find(c => c.id === cafeteriaId);
      if (cafe) {
        setSelectedCafe(cafe);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los datos de la visita');
      router.back();
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

    try {
      const formData = new FormData();
      
      formData.append('usuarioId', originalVisit?.usuarioId.toString() || '1');
      formData.append('cafeteriaId', selectedCafe.id.toString());
      formData.append('comentario', comment);
      formData.append('calificacion', rating.toString());

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

      const response = await fetch(`${API_URL}/visitas/${originalVisit?.id}`, {
        method: 'PUT',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.mensaje || 'Error al actualizar la visita');
      }

      Alert.alert('Éxito', 'Visita actualizada correctamente', [
        { 
          text: 'OK', 
          onPress: () => {
            router.back();
            router.setParams({ refresh: Date.now().toString() });
          }
        }
      ]);
    } catch (error) {
      console.error('Error al actualizar:', error);
      Alert.alert('Error', 'No se pudo actualizar la visita. Por favor, intenta de nuevo.');
    }
  };

  const handleBack = () => {
    router.back();
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
    <ScrollView style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#8D6E63" />
          <Text style={styles.loadingText}>Guardando cambios...</Text>
        </View>
      )}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleBack}
          style={styles.backButton}
        >
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Visita</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amigos</Text>
          <TouchableOpacity style={styles.friendsButton}>
            <Text style={styles.friendsButtonText}>Agregar amigo a la visita</Text>
            <AntDesign name="right" size={20} color="#8D6E63" />
          </TouchableOpacity>
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
}); 
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { AntDesign } from '@expo/vector-icons';
import ImageEditor from '../components/ImageEditor';

const API_URL = __DEV__
  ? 'http://192.168.0.11:3000/api'
  : 'https://tu-servidor-produccion.com/api';

const STANDARD_SIZE = 1080; // Tamaño estándar para las imágenes (1080x1080)

export default function AddVisitScreen() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [editingImage, setEditingImage] = useState<string | null>(null);

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
      formData.append('usuarioId', '1');
      formData.append('cafeteriaId', '1');
      formData.append('comentario', comment);
      formData.append('calificacion', rating.toString());

      images.forEach((uri, index) => {
        formData.append('imagenes', {
          uri,
          type: 'image/jpeg',
          name: `image-${index}.jpg`
        } as any);
      });

      const response = await fetch(`${API_URL}/visitas`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        throw new Error('Error al publicar la visita');
      }

      Alert.alert('Éxito', 'Visita publicada correctamente', [
        { 
          text: 'OK', 
          onPress: () => {
            router.back();
            router.setParams({ refresh: Date.now().toString() });
          }
        }
      ]);
    } catch (error) {
      Alert.alert('Error', 'No se pudo publicar la visita');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <AntDesign name="arrowleft" size={24} color="#8D6E63" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva Visita</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Amigos</Text>
        <TouchableOpacity style={styles.friendsButton}>
          <Text style={styles.friendsButtonText}>Agregar amigo a la visita</Text>
          <AntDesign name="right" size={20} color="#8D6E63" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tienda de café</Text>
        <Text style={styles.cafeteriaText}>Cafetería 1</Text>
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
        <Text style={styles.publishButtonText}>Publicar</Text>
      </TouchableOpacity>

      {editingImage && (
        <ImageEditor
          uri={editingImage}
          visible={true}
          onSave={handleSaveEditedImage}
          onCancel={() => setEditingImage(null)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
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
}); 
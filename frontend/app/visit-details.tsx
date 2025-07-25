import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity, Dimensions, ImageSourcePropType, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';

const windowWidth = Dimensions.get('window').width;

const API_URL = __DEV__
  ? 'http://192.168.0.11:3000/api'
  : 'https://tu-servidor-produccion.com/api';

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

  useEffect(() => {
    fetchVisitDetails();
  }, []);

  const fetchVisitDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/visitas/${params.visitId}`);
      if (!response.ok) {
        throw new Error('Error al obtener los detalles de la visita');
      }
      const data: ApiResponse = await response.json();
      setVisitData(data.visita);
    } catch (error) {
      console.error('Error:', error);
      setError('No se pudo cargar la información de la visita');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8D6E63" />
      </View>
    );
  }

  if (error || !visitData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Error al cargar la visita'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorButton}>
          <Text style={styles.errorButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: ''
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{`Cafetería ${visitData.cafeteriaId}`}</Text>
            <Text style={styles.headerDate}>
              {new Date(visitData.fecha).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.participantsContainer}>
            {/* Mantener el diseño de participantes hardcodeado por ahora */}
            <View style={styles.participantPhoto} />
          </View>
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
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>{visitData.calificacion} ★</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="heart-outline" size={28} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-social-outline" size={28} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.mainReviewContainer}>
          <View style={styles.authorSection}>
            <View style={styles.authorPhoto} />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>Usuario {visitData.usuarioId}</Text>
              <View style={styles.starsContainer}>
                {[...Array(5)].map((_, i) => (
                  <Ionicons
                    key={i}
                    name={i < visitData.calificacion ? "star" : "star-outline"}
                    size={20}
                    color="#FFD700"
                  />
                ))}
              </View>
            </View>
          </View>
          <Text style={styles.mainReviewText}>{visitData.comentario}</Text>
        </View>

        {/* Mantener el resto de la UI hardcodeada por ahora */}
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Escribe tu comentario..."
            multiline
            maxLength={500}
          />
          <Text style={styles.charCount}>0/500</Text>
          <TouchableOpacity style={styles.publishButton}>
            <Text style={styles.publishButtonText}>Publicar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 70,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerDate: {
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
    backgroundColor: '#E0E0E0',
    borderWidth: 2,
    borderColor: 'white',
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
  actionButton: {
    padding: 4,
  },
  mainReviewContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  mainReviewText: {
    fontSize: 16,
    lineHeight: 24,
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
}); 
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons, Feather } from '@expo/vector-icons';

interface Cafe {
  id: number;
  name: string;
  address: string;
  imageUrl: string | null;
  rating: number;
  tags: string[];
  openingHours: string;
}

const EmptyState = ({ onExplore }: { onExplore: () => void }) => (
  <View style={styles.emptyContainer}>
    <Feather name="bookmark" size={64} color="#E0E0E0" style={styles.emptyIcon} />
    <Text style={styles.emptyTitle}>No tienes cafeterías guardadas</Text>
    <Text style={styles.emptyText}>
      Guarda tus cafeterías favoritas para acceder rápidamente a ellas y no perderte ninguna.
    </Text>
    <TouchableOpacity style={styles.exploreButton} onPress={onExplore}>
      <Feather name="coffee" size={20} color="#FFF" />
      <Text style={styles.exploreButtonText}>Explorar cafeterías</Text>
    </TouchableOpacity>
  </View>
);

export default function SavedCafesScreen() {
  const [savedCafes, setSavedCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadSavedCafes();
  }, [token]);

  const loadSavedCafes = async () => {
    if (!token) {
      setError('Debes iniciar sesión para ver tus cafeterías guardadas');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getSavedCafes(token);
      setSavedCafes(response.cafes || []);
    } catch (error) {
      console.error('Error al cargar cafeterías guardadas:', error);
      setError('No se pudieron cargar las cafeterías guardadas');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (cafeId: number) => {
    if (!token) return;
    try {
      await apiService.toggleSavedCafe(cafeId, token);
      setSavedCafes(prev => prev.filter(cafe => cafe.id !== cafeId));
    } catch (error) {
      console.error('Error al quitar de guardados:', error);
    }
  };

  const handleCafePress = (cafe: Cafe) => {
    router.push({
      pathname: '/cafe/[id]',
      params: { id: cafe.id.toString() }
    });
  };

  const renderCafeItem = ({ item: cafe }: { item: Cafe }) => (
    <TouchableOpacity 
      style={styles.cafeCard}
      onPress={() => handleCafePress(cafe)}
    >
      <Image
        source={{ 
          uri: cafe.imageUrl || 'https://via.placeholder.com/150'
        }}
        style={styles.cafeImage}
      />
      <View style={styles.cafeInfo}>
        <View style={styles.cafeHeader}>
          <Text style={styles.cafeName}>{cafe.name}</Text>
          <TouchableOpacity 
            onPress={() => handleUnsave(cafe.id)}
            style={styles.unsaveButton}
          >
            <MaterialIcons name="bookmark" size={24} color="#A76F4D" />
          </TouchableOpacity>
        </View>
        <Text style={styles.cafeAddress}>{cafe.address}</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>{cafe.rating} ★</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Cafeterías Guardadas',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#A76F4D',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A76F4D" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          {error.includes('iniciar sesión') ? (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(auth)/signin')}
            >
              <Text style={styles.actionButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={loadSavedCafes}
            >
              <Text style={styles.actionButtonText}>Reintentar</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : savedCafes.length === 0 ? (
        <EmptyState onExplore={() => router.push('/(tabs)/explore')} />
      ) : (
        <FlatList
          data={savedCafes}
          renderItem={renderCafeItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFF',
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8D6E63',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  exploreButton: {
    backgroundColor: '#8D6E63',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#8D6E63',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  cafeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
  },
  cafeImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  cafeInfo: {
    padding: 16,
  },
  cafeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cafeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  unsaveButton: {
    padding: 4,
  },
  cafeAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#A76F4D',
    fontWeight: '600',
  },
}); 
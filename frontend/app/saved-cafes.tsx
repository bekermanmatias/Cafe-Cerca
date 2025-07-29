import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

interface Cafe {
  id: number;
  name: string;
  address: string;
  imageUrl: string | null;
  rating: number;
  tags: string[];
  openingHours: string;
}

export default function SavedCafesScreen() {
  const [savedCafes, setSavedCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadSavedCafes();
  }, [token]);

  const loadSavedCafes = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const cafes = await apiService.getSavedCafes(token);
      setSavedCafes(cafes);
    } catch (error) {
      console.error('Error al cargar cafeterías guardadas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (cafeId: number) => {
    if (!token) return;
    try {
      await apiService.toggleSavedCafe(cafeId, token);
      // Actualizar la lista local
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
      ) : savedCafes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No tienes cafeterías guardadas
          </Text>
        </View>
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
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
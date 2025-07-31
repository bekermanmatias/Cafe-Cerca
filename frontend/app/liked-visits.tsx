import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { VisitCard } from '../components/VisitCard';
import { Stack, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

const EmptyState = ({ onExplore }: { onExplore: () => void }) => (
  <View style={styles.emptyContainer}>
    <Feather name="heart" size={64} color="#E0E0E0" style={styles.emptyIcon} />
    <Text style={styles.emptyTitle}>No tienes visitas favoritas</Text>
    <Text style={styles.emptyText}>
      Dale "Me gusta" a las visitas que más te interesen para guardarlas aquí y encontrarlas fácilmente.
    </Text>
    <TouchableOpacity style={styles.exploreButton} onPress={onExplore}>
      <Feather name="coffee" size={20} color="#FFF" />
      <Text style={styles.exploreButtonText}>Explorar visitas</Text>
    </TouchableOpacity>
  </View>
);

export default function LikedVisitsScreen() {
  const [likedVisits, setLikedVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadLikedVisits();
  }, [token]);

  const loadLikedVisits = async () => {
    if (!token) {
      setError('Debes iniciar sesión para ver tus visitas favoritas');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getLikedVisitas(token);
      setLikedVisits(response.visitas || []);
    } catch (error) {
      console.error('Error al cargar visitas con like:', error);
      setError('No se pudieron cargar las visitas favoritas');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeChange = async (visitId: number, liked: boolean) => {
    if (!liked) {
      setLikedVisits(prev => prev.filter(visit => visit.id !== visitId));
    }
  };

  const handleDetails = (visit: any) => {
    router.push({
      pathname: '/visit-details',
      params: { visitId: visit.id.toString() }
    });
  };

  const handleShare = (visitId: number) => {
    // Implementar compartir si es necesario

  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Mis Likes',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#8D6E63',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8D6E63" />
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
              onPress={loadLikedVisits}
            >
              <Text style={styles.actionButtonText}>Reintentar</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : likedVisits.length === 0 ? (
        <EmptyState onExplore={() => router.push('/(tabs)/diary')} />
      ) : (
        <FlatList
          data={likedVisits}
          renderItem={({ item }) => (
            <VisitCard
              visit={item}
              onLikeChange={(liked) => handleLikeChange(item.id, liked)}
              onDetails={() => handleDetails(item)}
              onShare={() => handleShare(item.id)}
            />
          )}
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
    paddingBottom: 20,
  },
}); 
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { VisitCard } from '../components/VisitCard';
import { Stack } from 'expo-router';

export default function LikedVisitsScreen() {
  const [likedVisits, setLikedVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    loadLikedVisits();
  }, [token]);

  const loadLikedVisits = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const visits = await apiService.getLikedVisitas(token);
      setLikedVisits(visits);
    } catch (error) {
      console.error('Error al cargar visitas con like:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeChange = async (visitId: number, liked: boolean) => {
    if (!liked) {
      // Si se quitó el like, eliminar la visita de la lista
      setLikedVisits(prev => prev.filter(visit => visit.id !== visitId));
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Mis Likes',
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
      ) : likedVisits.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Aún no has dado like a ninguna visita
          </Text>
        </View>
      ) : (
        <FlatList
          data={likedVisits}
          renderItem={({ item }) => (
            <VisitCard
              visit={item}
              onLikeChange={(liked) => handleLikeChange(item.id, liked)}
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
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
}); 
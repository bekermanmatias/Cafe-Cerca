// app/cafe/[id].tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

type Cafe = {
  id: number;
  name: string;
  address: string;
  imageUrl: string;
  tags: string[];
  rating: number;
  openingHours: string;
};

export default function CafeDetail() {
  const { id } = useLocalSearchParams(); // capturamos el id de la URL
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCafe = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/cafes/${id}`);
        const data = await res.json();
        setCafe(data);
      } catch (error) {
        console.error('Error al traer la cafetería:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCafe();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7D3C98" />
        <Text>Cargando cafetería...</Text>
      </View>
    );
  }

  if (!cafe) {
    return (
      <View style={styles.center}>
        <Text>No se encontró la cafetería 😢</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: cafe.imageUrl }} style={styles.image} />
      <Text style={styles.name}>{cafe.name}</Text>
      <Text style={styles.address}>📍 {cafe.address}</Text>
      <Text style={styles.rating}>⭐ {cafe.rating} / 5</Text>
      <Text style={styles.sectionTitle}>Etiquetas:</Text>
      <View style={styles.tagsContainer}>
        {cafe.tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>#{tag}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.sectionTitle}>Horario:</Text>
      <Text style={styles.openingHours}>{cafe.openingHours}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  address: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  rating: {
    fontSize: 18,
    color: '#f1c40f',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginTop: 12,
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'flex-start',
  },
  tag: {
    backgroundColor: '#D1C4E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#4A148C',
  },
  openingHours: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
});

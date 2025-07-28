// src/screens/CafeDetailScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

type Cafe = {
  id: number;
  name: string;
  imageUrl: string;
  tags: string[];
  address: string;
  schedule: string;
  latitude: number;
  longitude: number;
  reviews: { rating: number; comment: string; image?: string }[];
};

const CafeDetailScreen = ({ route }: any) => {
  const [cafe, setCafe] = useState<Cafe | null>(null);

  useEffect(() => {
    const fetchCafe = async () => {
      // Simulamos una llamada fetch
      const fetchedCafe = route.params.cafe; // O reemplazá por fetch a tu backend
      setCafe(fetchedCafe);
    };

    fetchCafe();
  }, []);

  if (!cafe) return <Text>Cargando...</Text>;

  const averageRating = cafe.reviews.length
    ? (cafe.reviews.reduce((sum, r) => sum + r.rating, 0) / cafe.reviews.length).toFixed(1)
    : 'Sin reseñas';

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: cafe.imageUrl }} style={styles.image} />

      <View style={styles.header}>
        <Text style={styles.name}>{cafe.name}</Text>
        <TouchableOpacity onPress={() => console.log('Guardar')}>
          <Ionicons name="bookmark-outline" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.tagsContainer}>
        {cafe.tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={20} color="#333" />
        <Text style={styles.infoText}>{cafe.address}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="time-outline" size={20} color="#333" />
        <Text style={styles.infoText}>{cafe.schedule}</Text>
      </View>

      <View style={styles.ratingRow}>
        <Ionicons name="star" size={20} color="gold" />
        <Text style={styles.ratingText}>{averageRating}</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={() => console.log('Cómo llegar')}>
          <MaterialIcons name="directions" size={20} color="white" />
          <Text style={styles.buttonText}>Cómo llegar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => console.log('Visitar')}>
          <MaterialIcons name="event" size={20} color="white" />
          <Text style={styles.buttonText}>Visitar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Reseñas</Text>
      {cafe.reviews.length === 0 && <Text style={styles.noReviews}>Todavía no hay reseñas.</Text>}

      <FlatList
        data={cafe.reviews}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            {item.image && <Image source={{ uri: item.image }} style={styles.reviewImage} />}
            <Text style={styles.reviewText}>{item.comment}</Text>
            <Text style={styles.reviewRating}>⭐ {item.rating}</Text>
          </View>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />
    </ScrollView>
  );
};

export default CafeDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 250,
  },
  header: {
    marginTop: 16,
    marginHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  tag: {
    backgroundColor: '#eee',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#444',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 4,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 16,
  },
  noReviews: {
    fontSize: 14,
    marginHorizontal: 16,
    marginVertical: 8,
    color: '#999',
  },
  reviewCard: {
    width: 220,
    marginTop: 8,
    marginRight: 16,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 12,
  },
  reviewImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 6,
  },
  reviewText: {
    fontSize: 14,
    marginBottom: 4,
  },
  reviewRating: {
    fontSize: 12,
    color: '#666',
  },
});

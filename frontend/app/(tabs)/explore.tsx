import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import FilterChips from '../../components/FilterChips';
import SearchBar from '../../components/SearchBar';
import TagChip from '../../components/TagChip';
import { filters } from '../../constants/Filters';

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/cafes') // Cambiar si usás dispositivo físico
      .then(response => response.json())
      .then(data => {
        setCafes(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error al obtener cafeterías:', error);
        setLoading(false);
      });
  }, []);

  const filteredCafes = cafes.filter(cafe =>
    cafe.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    selectedFilters.every(tag => cafe.tags?.includes(tag))
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Cargando cafeterías...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="¿Qué te apetece hoy?"
      />
      <FilterChips
        items={filters}
        selected={selectedFilters}
        onSelect={setSelectedFilters}
      />

      {filteredCafes.map((cafe, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.imageWrapper}>
            <Image source={{ uri: cafe.imageUrl }} style={styles.image} />
            <TagChip
              label={cafe.openingHours}
              style={styles.horarioChip}
              textStyle={{ fontWeight: '500' }}
            />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.row}>
              <Text style={styles.name}>{cafe.name}</Text>
              <Text style={styles.puntaje}>{cafe.rating}</Text>
            </View>
            <Text style={styles.location}>{cafe.address}</Text>
            <View style={styles.tagsContainer}>
              {cafe.tags?.map((tag: string, idx: number) => (
                <TagChip key={idx} label={tag} />
              ))}
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 11,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  puntaje: {
    fontSize: 14,
    color: '#96664F',
  },
  image: {
    width: '100%',
    height: 160,
  },
  textContainer: {
    padding: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  location: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  imageWrapper: {
    position: 'relative',
  },
  horarioChip: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: '#DBEDC2',
    borderColor: '#DBEDC2',
  },
});

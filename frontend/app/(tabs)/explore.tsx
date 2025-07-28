import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import FilterChips from '../../components/FilterChips';
import SearchBar from '../../components/SearchBar';
import TagChip from '../../components/TagChip';
import { filters } from '../../constants/Filters';
import { API_URL } from '../../constants/Config';

interface Cafe {
  id: number;
  name: string;
  address: string;
  rating: number;
  imageUrl: string | null;
  tags: string[];
  openingHours: string;
}

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCafes();
  }, []);

  // Dentro del componente
const router = useRouter();

const handleCafePress = (id: number) => {
  router.push(`../cafe/${id}`);
};
  const fetchCafes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/cafes`);
      
      if (!response.ok) {
        throw new Error('Error al obtener las cafeterías');
      }

      const data = await response.json();
      setCafes(data);
    } catch (error) {
      console.error('Error al obtener cafeterías:', error);
      setError('No se pudieron cargar las cafeterías');
    } finally {
      setLoading(false);
    }
  };

  const filteredCafes = cafes.filter(cafe =>
    cafe.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    selectedFilters.every(tag => cafe.tags?.includes(tag))
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8D6E63" />
        <Text style={styles.loadingText}>Cargando cafeterías...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
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
    <TouchableOpacity
      key={cafe.id || index}
      onPress={() => handleCafePress(cafe.id)}
      activeOpacity={0.8} // opcional para efecto visual
    >
      <View style={styles.card}>
        <View style={styles.imageWrapper}>
          {cafe.imageUrl ? (
            <Image 
              source={{ uri: cafe.imageUrl }} 
              style={styles.image}
            />
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>{cafe.name[0].toUpperCase()}</Text>
            </View>
          )}
          {cafe.openingHours && (
            <TagChip
              label={cafe.openingHours}
              style={styles.horarioChip}
              textStyle={{ fontWeight: '500' }}
            />
          )}
        </View>
        <View style={styles.textContainer}>
          <View style={styles.row}>
            <Text style={styles.name}>{cafe.name}</Text>
            <Text style={styles.puntaje}>{cafe.rating} ★</Text>
          </View>
          <Text style={styles.location}>{cafe.address}</Text>
          <View style={styles.tagsContainer}>
            {cafe.tags?.map((tag: string, idx: number) => (
              <TagChip key={idx} label={tag} />
            ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  noResultsContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
  placeholderImage: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    color: '#8D6E63',
    fontWeight: 'bold',
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

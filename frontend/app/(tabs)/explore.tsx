import React, { useState } from 'react';
import { Text, View } from 'react-native';
import SearchBar from '../../components/SearchBar';

export default function ExploreScreen() {

  const [searchQuery, setSearchQuery] = useState('');
    // Simulación de cafeterías (sin backend)
  const cafes = ['Café Martínez', 'Starbucks', 'Havanna', 'Café Tortoni'];
  const filteredCafes = cafes.filter(cafe =>
    cafe.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <View style={{ padding: 16 }}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="¿Que te apetece hoy?"
      />

      {filteredCafes.map((cafe, index) => (
        <Text key={index} style={{ marginVertical: 8, fontSize: 18 }}>
          {cafe}
        </Text>
      ))}
    </View>
  );
}


import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions, Platform, Linking, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { API_URL } from '../../constants/Config';

interface Cafe {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

export default function MapScreen() {
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCafes = async () => {
      try {
        const response = await fetch(`${API_URL}/cafes`);
        if (!response.ok) throw new Error('Error al obtener las cafeterías');
        const data = await response.json();
        setCafes(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCafes();
  }, []);

  const openMapsApp = (lat: number, lng: number) => {
    const scheme = Platform.select({
      ios: 'maps:0,0?q=',
      android: 'geo:0,0?q=',
    });
    const latLng = `${lat},${lng}`;
    const label = 'Cafetería';
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });

    if (url) {
      Linking.openURL(url).catch(err => {
        console.error('Error abriendo la app de mapas', err);
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8D6E63" />
        <Text style={{ marginTop: 10, color: '#666' }}>Cargando mapa...</Text>
      </View>
    );
  }

  if (error || cafes.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: '#666', textAlign: 'center' }}>
          {error || 'No se encontraron cafeterías.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: cafes[0].lat,
          longitude: cafes[0].lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {cafes.map(cafe => (
          <Marker
            key={cafe.id}
            coordinate={{ latitude: cafe.lat, longitude: cafe.lng }}
            title={cafe.name}
            description="Toca para abrir la app de mapas"
            onCalloutPress={() => openMapsApp(cafe.lat, cafe.lng)}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
});

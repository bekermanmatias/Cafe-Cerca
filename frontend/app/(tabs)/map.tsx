import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Dimensions, Platform, Linking, ActivityIndicator, Text, Alert, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
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
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Pedir permisos
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso denegado', 'No se pudo obtener tu ubicación');
          return;
        }

        // Obtener ubicación del usuario
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        // Obtener cafeterías
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

    fetchData();
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

  const goToUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000 // duración en ms
      );
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

  const initialRegion = userLocation
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: cafes.length > 0 ? cafes[0].lat : -34.6037,
        longitude: cafes.length > 0 ? cafes[0].lng : -58.3816,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  return (
    <View style={styles.container}>
      <MapView 
        ref={mapRef}
        style={styles.map} 
        initialRegion={initialRegion}
        showsUserLocation
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

      {/* Botón para volver a la ubicación del usuario */}
      <TouchableOpacity style={styles.button} onPress={goToUserLocation}>
        <Text style={styles.buttonText}>📍 Mi ubicación</Text>
      </TouchableOpacity>
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
  button: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#333',
    fontWeight: 'bold',
  },
});
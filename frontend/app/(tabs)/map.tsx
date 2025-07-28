import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Linking, Platform, Button } from 'react-native';

const cafes = [
  { id: 1, name: 'Café Central', lat: -34.6037, lng: -58.3816 },

];

export default function MapScreen() {
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
    flex: 1,              // Muy importante para que el View tome todo el espacio disponible
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});

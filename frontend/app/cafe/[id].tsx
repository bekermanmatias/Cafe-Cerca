// app/cafe/[id].tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import TagChip from '../../components/TagChip';
import DireccionIcon from '../../assets/icons/direccion.svg';
import HorarioIcon from '../../assets/icons/horario.svg';
import GuardarIcon from '../../assets/icons/guardar.svg';
import IrDireccionIcon from '../../assets/icons/irdireccion.svg';
import Lapiz from '../../assets/icons/lapiz.svg';
import { API_URL } from '../../constants/Config';

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
  const { id } = useLocalSearchParams();
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCafe = async () => {
      try {
        const res = await fetch(`${API_URL}/cafes/${id}`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
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

  const displayedTags = cafe.tags.slice(0, 4);

  const onGuardarPress = () => {
    console.log('Guardar pressed');
  };

  const onIrDireccionIconPress = () => {
    console.log('Icono Ir Dirección pressed');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: cafe.imageUrl }} style={styles.image} />

        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{cafe.name}</Text>

          <View style={styles.iconsRight}>
            <Pressable onPress={onGuardarPress} hitSlop={8}>
              <GuardarIcon width={24} height={24} style={styles.iconSvg} />
            </Pressable>
          </View>
        </View>

        <View style={styles.tagsWrapper}>
          {displayedTags.map((tag, index) => (
            <TagChip key={index} label={`${tag}`} />
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.iconBox}>
            <DireccionIcon width={20} height={20} style={styles.iconSvg} />
          </View>

          <Text
            style={[styles.infoText, { flex: 1 }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {cafe.address}
          </Text>

          <Pressable onPress={onIrDireccionIconPress} hitSlop={8} style={{ marginLeft: 8 }}>
            <IrDireccionIcon width={24} height={24} style={styles.iconSvg} />
          </Pressable>
        </View>

        <View style={styles.row}>
          <View style={styles.iconBox}>
            <HorarioIcon width={20} height={20} style={styles.iconSvg} />
          </View>
          <Text style={styles.infoText}>{cafe.openingHours}</Text>
        </View>

        {/* Reseñas */}
<View style={styles.reviewsHeader}>
  <View style={styles.ratingContainer}>
    <Text style={styles.reviewsTitle}>
      Reseñas <Text style={styles.ratingValue}>{cafe.rating}/5</Text>
    </Text>
    <Text style={styles.starIcon}>⭐️</Text>
  </View>
  <Pressable style={styles.visitarButton} onPress={() => console.log('Visitar pressed')} hitSlop={8}>
    <Text style={styles.visitarText}>Visitar</Text>
    <Lapiz width={20} height={20} style={styles.visitarIcon} />
  </Pressable>
</View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 16,
    backgroundColor: '#FFF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 220,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    backgroundColor: '#8B4513',
    padding: 8,
    borderRadius: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    paddingHorizontal: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#34495E',
  },
  iconSvg: {
    width: 20,
    height: 20,
  },
  iconBox: {
    backgroundColor: '#F5E9DC',
    padding: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  iconsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
    width: '100%',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  ratingValue: {
    color: '#000',
    fontWeight: 'normal',
  },
  starIcon: {
    fontSize: 18,
    marginLeft: 6,
  },
  visitarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B4513',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  visitarText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  visitarIcon: {
    marginLeft: 6,
    width: 20,
    height: 20,
  },
});

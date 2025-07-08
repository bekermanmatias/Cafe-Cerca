import { StyleSheet, ScrollView } from 'react-native';
import { VisitCard } from '../../components/VisitCard';
import { useRouter } from 'expo-router';

const mockVisits = [
  {
    date: '26-06-2025',
    place: 'Café Artesano',
    description: 'Probando el mejor flat white de la ciudad ☕️ La espuma perfecta y el arte latte increíble 🎨',
    rating: 4.8,
    images: [
      require('../../assets/mock-images/cafe1.png'),
      require('../../assets/mock-images/cafe13.png'),
    ],
    participants: [
      require('../../assets/mock-images/foto1.png'),
      require('../../assets/mock-images/foto2.png'),
    ],
  },
  {
    date: '25-06-2025',
    place: 'La Bicicleta',
    description: '¡Desayuno de campeones! 🚴‍♂️ Café de Colombia recién tostado y pan de masa madre 🍞',
    rating: 4.7,
    images: [
      require('../../assets/mock-images/cafe3.png'),
      require('../../assets/mock-images/cafe4.png'),
      require('../../assets/mock-images/cafe5.png'),
    ],
    participants: [
      require('../../assets/mock-images/foto1.png'),
      require('../../assets/mock-images/foto2.png'),
    ],
  },
  {
    date: '24-06-2025',
    place: 'Rincón Verde',
    description: 'Café orgánico y tarta de zanahoria casera 🥕 El lugar perfecto para trabajar rodeado de plantas 🌿',
    rating: 4.9,
    images: [
      require('../../assets/mock-images/cafe6.png'),
      require('../../assets/mock-images/cafe7.png'),
    ],
    participants: [
      require('../../assets/mock-images/foto1.png'),
    ],
  },
  {
    date: '23-06-2025',
    place: 'Café del Puerto',
    description: 'Brunch con vista al mar 🌊 Cold brew perfecto para un día caluroso ❄️',
    rating: 4.6,
    images: [
      require('../../assets/mock-images/cafe9.png'),
      require('../../assets/mock-images/cafe10.png'),
      require('../../assets/mock-images/cafe8.png'),
    ],
    participants: [
      require('../../assets/mock-images/foto1.png'),
      require('../../assets/mock-images/foto2.png'),
    ],
  },
  {
    date: '22-06-2025',
    place: 'El Laboratorio',
    description: 'Experimentando métodos alternativos: Chemex y Aeropress 🧪 ¡La ciencia del café llevada al siguiente nivel! 🔬',
    rating: 5.0,
    images: [
      require('../../assets/mock-images/cafe11.png'),
      require('../../assets/mock-images/cafe7.png'),
    ],
    participants: [
      require('../../assets/mock-images/foto1.png'),
      require('../../assets/mock-images/foto2.png'),
    ],
  },
];

export default function DiaryScreen() {
  const router = useRouter();

  const handleLike = () => {
    console.log('Like pressed');
  };

  const handleShare = () => {
    console.log('Share pressed');
  };

  const handleDetails = (visit: any) => {
    router.push({
      pathname: '/visit-details',
      params: {
        ...visit,
        images: JSON.stringify(visit.images),
        participants: JSON.stringify(visit.participants),
      },
    });
  };

  return (
    <ScrollView style={styles.container} nestedScrollEnabled={true}>
      {mockVisits.map((visit, index) => (
        <VisitCard
          key={index}
          {...visit}
          onLike={handleLike}
          onShare={handleShare}
          onDetails={() => handleDetails(visit)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
}); 
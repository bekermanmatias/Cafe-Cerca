import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity, Dimensions, FlatList, ViewToken } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef } from 'react';

interface VisitCard {
  date: string;
  place: string;
  description: string;
  rating: number;
  images: any[];
  participants: any[];
}

interface RenderImageProps {
  item: any;
  index: number;
}

interface ViewableItemsChanged {
  viewableItems: ViewToken[];
  changed: ViewToken[];
}

const mockVisit: VisitCard = {
  date: '24-06-2025',
  place: 'Flora',
  description: 'Cortado riki y ambiente tranki para laburar ☕️',
  rating: 4.5,
  images: [
    require('../../assets/mock-images/cafe1.png'),
    require('../../assets/mock-images/cafe2.png'),
    require('../../assets/mock-images/cafe3.png'),
  ],
  participants: [
    require('../../assets/mock-images/foto1.png'),
    require('../../assets/mock-images/foto2.png'),
  ],
};

const windowWidth = Dimensions.get('window').width;

export default function DiaryScreen() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const renderImage = ({ item: image, index }: RenderImageProps) => (
    <View style={styles.imageWrapper}>
      <Image
        source={image}
        style={styles.image}
      />
      <View style={styles.ratingBubble}>
        <Text style={styles.rating}>{mockVisit.rating} ★</Text>
      </View>
    </View>
  );

  const handleViewableItemsChanged = useRef(({ viewableItems }: ViewableItemsChanged) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentImageIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  return (
    <ScrollView style={styles.container} nestedScrollEnabled={true}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.place}>{mockVisit.place}</Text>
            <Text style={styles.date}>{mockVisit.date}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.participantsContainer}>
              {mockVisit.participants.map((photo, index) => (
                <Image
                  key={index}
                  source={photo}
                  style={[
                    styles.participantPhoto,
                    { marginLeft: index > 0 ? -18 : 0 }
                  ]}
                />
              ))}
            </View>
          </View>
        </View>
        <View style={styles.imageContainer}>
          <FlatList
            ref={flatListRef}
            data={mockVisit.images}
            renderItem={renderImage}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            snapToInterval={windowWidth - 32}
            decelerationRate="fast"
            snapToAlignment="center"
            keyExtractor={(_, index) => index.toString()}
          />
          <View style={styles.paginationDots}>
            {mockVisit.images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  { backgroundColor: index === currentImageIndex ? '#fff' : 'rgba(255, 255, 255, 0.5)' }
                ]}
              />
            ))}
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={styles.description}>{mockVisit.description}</Text>
          <View style={styles.actions}>
            <View style={styles.leftActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="heart-outline" size={24} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-social-outline" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="book-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantPhoto: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2.5,
    borderColor: 'white',
  },
  imageContainer: {
    position: 'relative',
    height: 400,
    width: '100%',
  },
  imageWrapper: {
    width: windowWidth - 32,
    height: 400,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  ratingBubble: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    color: '#000',
    fontWeight: 'bold',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  place: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  date: {
    fontSize: 16,
    color: '#666',
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
  },
  description: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    padding: 8,
  },
}); 
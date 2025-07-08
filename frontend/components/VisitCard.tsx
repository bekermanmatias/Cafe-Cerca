import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions, FlatList, ViewToken } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useRef } from 'react';

const windowWidth = Dimensions.get('window').width;

export interface VisitCardProps {
  date: string;
  place: string;
  description: string;
  rating: number;
  images: any[];
  participants: any[];
  onLike?: () => void;
  onShare?: () => void;
  onDetails?: () => void;
}

interface RenderImageProps {
  item: any;
  index: number;
}

interface ViewableItemsChanged {
  viewableItems: ViewToken[];
  changed: ViewToken[];
}

export const VisitCard = ({
  date,
  place,
  description,
  rating,
  images,
  participants,
  onLike,
  onShare,
  onDetails,
}: VisitCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const renderImage = ({ item: image }: RenderImageProps) => (
    <View style={styles.imageWrapper}>
      <Image
        source={image}
        style={styles.image}
      />
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
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.place}>{place}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.participantsContainer}>
            {participants.map((photo, index) => (
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
      <View style={styles.imageSection}>
        <View style={styles.ratingBubble}>
          <Text style={styles.rating}>{rating} ★</Text>
        </View>
        <FlatList
          ref={flatListRef}
          data={images}
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
          style={styles.imageList}
        />
        <View style={styles.paginationDots}>
          {images.map((_, index) => (
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
        <View style={styles.actions}>
          <View style={styles.leftActions}>
            <TouchableOpacity style={styles.actionButton} onPress={onLike}>
              <Ionicons name="heart-outline" size={24} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={onShare}>
              <Ionicons name="share-social-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.actionButton} onPress={onDetails}>
            <Ionicons name="book-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  place: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  date: {
    fontSize: 14,
    color: '#666',
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
  imageSection: {
    height: 400,
    position: 'relative',
  },
  imageList: {
    flex: 1,
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
    zIndex: 10,
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
  footer: {
    padding: 16,
    paddingTop: 8,
    gap: 6,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 0,
    paddingRight: 8,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 6,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
}); 
import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity, Dimensions, ImageSourcePropType, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';

const windowWidth = Dimensions.get('window').width;

interface Review {
  user: string;
  rating: number;
  text: string;
  userPhoto: ImageSourcePropType;
}

interface Comment {
  user: string;
  text: string;
  timeAgo: string;
  userPhoto: ImageSourcePropType;
}

interface VisitDetails {
  date: string;
  place: string;
  description: string;
  rating: number;
  images: ImageSourcePropType[];
  participants: ImageSourcePropType[];
  reviews: Review[];
  comments: Comment[];
}

export default function VisitDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const visit: VisitDetails = {
    date: params.date as string,
    place: params.place as string,
    description: params.description as string,
    rating: Number(params.rating),
    images: JSON.parse(params.images as string),
    participants: JSON.parse(params.participants as string),
    reviews: JSON.parse((params.reviews as string) || '[]'),
    comments: JSON.parse((params.comments as string) || '[]'),
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{visit.place}</Text>
          <Text style={styles.headerDate}>{visit.date}</Text>
        </View>
        <View style={styles.participantsContainer}>
          {visit.participants.map((photo, index) => (
            <Image
              key={index}
              source={photo}
              style={[
                styles.participantPhoto,
                { marginLeft: index > 0 ? -12 : 0 }
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.mainImageContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imageScrollContainer}
        >
          {visit.images.map((image, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={image} style={styles.mainImage} />
            </View>
          ))}
        </ScrollView>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>{visit.rating} ★</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="heart-outline" size={28} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-social-outline" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>{visit.description}</Text>

        <View style={styles.reviewsSection}>
          {visit.reviews.map((review, index) => (
            <View key={index} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Image source={review.userPhoto} style={styles.reviewerPhoto} />
                <View style={styles.reviewerInfo}>
                  <Text style={styles.reviewerName}>{review.user}</Text>
                  <View style={styles.starsContainer}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < review.rating ? "star" : "star-outline"}
                        size={16}
                        color="#FFD700"
                      />
                    ))}
                  </View>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                  <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                </TouchableOpacity>
              </View>
              <Text style={styles.reviewText}>{review.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>Comentarios</Text>
          {visit.comments.map((comment, index) => (
            <View key={index} style={styles.commentItem}>
              <Image source={comment.userPhoto} style={styles.commentorPhoto} />
              <View style={styles.commentContent}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentorName}>{comment.user}</Text>
                  <Text style={styles.timeAgo}>{comment.timeAgo}</Text>
                </View>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Escribe tu comentario..."
            multiline
            maxLength={500}
          />
          <Text style={styles.charCount}>0/500</Text>
          <TouchableOpacity style={styles.publishButton}>
            <Text style={styles.publishButtonText}>Publicar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerDate: {
    fontSize: 14,
    color: '#666',
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  titleSection: {
    padding: 16,
    paddingTop: 0,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  place: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  mainImageContainer: {
    width: '100%',
    height: 450,
    position: 'relative',
  },
  imageScrollContainer: {
    paddingHorizontal: 0,
  },
  imageWrapper: {
    marginRight: 0,
    overflow: 'hidden',
  },
  mainImage: {
    width: windowWidth,
    height: 450,
  },
  ratingBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  actionButton: {
    padding: 4,
  },
  actionIcon: {
    width: 24,
    height: 24,
  },
  content: {
    padding: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  reviewsSection: {
    marginBottom: 24,
  },
  reviewItem: {
    marginBottom: 20,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  moreButton: {
    padding: 8,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  commentsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentorPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentorName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  timeAgo: {
    fontSize: 12,
    color: '#666',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  commentInputContainer: {
    marginTop: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  publishButton: {
    backgroundColor: '#E8BEAC',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
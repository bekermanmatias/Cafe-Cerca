import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../constants/Config';
import axios from 'axios';

interface Friend {
  id: number;
  name: string;
  profileImage: string;
}

export default function FriendsScreen() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { token } = useAuth();

  const fetchFriends = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      if (!token) throw new Error('Token no disponible');

      const friendsRes = await axios.get<Friend[]>(API_ENDPOINTS.AMIGOS.GET_LISTA, {
        headers: { Authorization: `Bearer ${token}` },
      });



      setFriends(friendsRes.data || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
      Alert.alert('Error', 'No se pudo cargar la información.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Función para refresh manual
  const onRefresh = useCallback(() => {
    fetchFriends(true);
  }, []);

  useEffect(() => {
    fetchFriends();
  }, []);

  // Refrescar cuando la pantalla se enfoca
  useFocusEffect(
    useCallback(() => {
      fetchFriends();
    }, [])
  );

  const eliminarAmigo = async (friendId: number, friendName: string) => {
    Alert.alert(
      'Eliminar amigo',
      `¿Estás seguro que deseas eliminar a ${friendName} de tu lista de amigos?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!token) throw new Error('Token no disponible');

              await axios.delete(`${API_ENDPOINTS.AMIGOS.ELIMINAR_AMIGO}/${friendId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });

              // Refrescar la lista después de eliminar
              fetchFriends();
              
              Alert.alert('Éxito', 'Amigo eliminado correctamente');
            } catch (error) {
              console.error('Error eliminating friend:', error);
              Alert.alert('Error', 'No se pudo eliminar al amigo.');
            }
          },
        },
      ]
    );
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <View style={styles.friendCard}>
      <View style={styles.friendHeader}>
        <Image
          source={{ 
            uri: item.profileImage || 'https://res.cloudinary.com/cafe-cerca/image/upload/v1/defaults/default-profile.png'
          }}
          style={styles.profileImage}
        />
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.name}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => eliminarAmigo(item.id, item.name)}
      >
        <Ionicons name="trash-outline" size={20} color="#dc3545" />
      </TouchableOpacity>
    </View>
  );

  const navigateToAddFriends = () => {
    router.push('/addFriendsScreen');
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Lista de Amigos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="people" size={20} color="#8D6E63" /> Amigos ({friends.length})
            </Text>
            <TouchableOpacity style={styles.addButton} onPress={navigateToAddFriends}>
              <Ionicons name="person-add" size={20} color="#000" />
            </TouchableOpacity>
          </View>
          {friends.length === 0 ? (
            <Text style={styles.noFriendsText}>No tienes amigos todavía. ¡Agrega alguno!</Text>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={(item) => `friend-${item.id}`}
              renderItem={renderFriend}
              contentContainerStyle={{ paddingBottom: 16 }}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  addButton: {
    padding: 8,
  },
  invitationsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  invitationsButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8D6E63',
    flexDirection: 'row',
    alignItems: 'center',
  },
  noFriendsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  friendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    backgroundColor: '#ccc',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#ffebee',
  },
});
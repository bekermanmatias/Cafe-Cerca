import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Friend {
  id: number;
  name: string;
  avatar: string;
}

interface Solicitud {
  id: number;
  userId: number;
  friendId: number;
  status: string;
  solicitante: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
}

export default function FriendsScreen() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

const fetchFriends = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Token no disponible');

    const [friendsRes, solicitudesRes] = await Promise.all([
      axios.get<Friend[]>('http://192.168.0.124:3000/api/amigos/lista', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get<Solicitud[]>('http://192.168.0.124:3000/api/amigos/solicitudes/recibidas', {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    console.log('Solicitudes recibidas:', solicitudesRes.data);  // <-- Log aquí

    setFriends(friendsRes.data);
    setSolicitudes(solicitudesRes.data);
  } catch (error) {
    console.error('Error fetching friends or solicitudes:', error);
    Alert.alert('Error', 'No se pudo cargar la información.');
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchFriends();
  }, []);

  // Función para aceptar o rechazar solicitud
  const responderSolicitud = async (solicitudId: number, status: 'accepted' | 'rejected') => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Token no disponible');

      const response = await axios.patch(`http://192.168.0.124:3000/api/amigos/responder/${solicitudId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('Éxito', response.data.message);
      // Actualizamos las solicitudes pendientes
      setSolicitudes(prev => prev.filter(s => s.id !== solicitudId));
      if (status === 'accepted') {
        // Opcional: refrescar lista de amigos
        fetchFriends();
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.error || 'No se pudo responder la solicitud.');
    }
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <View style={styles.friendCard}>
      <Image source={{ uri: item.avatar || 'https://via.placeholder.com/50' }} style={styles.avatar} />
      <Text style={styles.name}>{item.name}</Text>
    </View>
  );

  const renderSolicitud = ({ item }: { item: Solicitud }) => (
    <View style={styles.solicitudCard}>
      <Image source={{ uri: item.solicitante.avatar || 'https://via.placeholder.com/50' }} style={styles.avatar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.solicitante.name}</Text>
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.btn, styles.acceptBtn]}
            onPress={() => responderSolicitud(item.id, 'accepted')}
          >
            <Text style={styles.btnText}>Aceptar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.rejectBtn]}
            onPress={() => responderSolicitud(item.id, 'rejected')}
          >
            <Text style={styles.btnText}>Rechazar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Función para navegar a AddFriendsScreen
  const navigateToAddFriends = () => {
    router.push('/addFriendsScreen');
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.addButton} onPress={navigateToAddFriends}>
        <Ionicons name="person-add" size={28} color="#333" />
      </TouchableOpacity>

      {solicitudes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Solicitudes pendientes</Text>
          <FlatList
            data={solicitudes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderSolicitud}
            contentContainerStyle={{ paddingBottom: 16 }}
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tus amigos</Text>
        {friends.length === 0 ? (
          <Text style={styles.noFriendsText}>No tienes amigos todavía. ¡Agrega alguno!</Text>
        ) : (
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderFriend}
            contentContainerStyle={{ paddingBottom: 16 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  addButton: {
    padding: 12,
    alignSelf: 'flex-end',
    marginRight: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#4B3A2F',
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
  solicitudCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#FFF5E1',
    borderRadius: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    backgroundColor: '#ccc',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonsRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  acceptBtn: {
    backgroundColor: '#4CAF50',
  },
  rejectBtn: {
    backgroundColor: '#E53935',
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

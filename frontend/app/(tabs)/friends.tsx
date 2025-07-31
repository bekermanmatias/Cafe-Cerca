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

interface Solicitud {
  id: number;
  userId: number;
  friendId: number;
  status: string;
  solicitante: {
    id: number;
    name: string;
    email: string;
    profileImage?: string;
  };
}

interface SolicitudEnviada {
  id: number;
  userId: number;
  friendId: number;
  status: string;
  destinatario: {
    id: number;
    name: string;
    email: string;
    profileImage?: string;
  };
}

export default function FriendsScreen() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [solicitudesRecibidas, setSolicitudesRecibidas] = useState<Solicitud[]>([]);
  const [solicitudesEnviadas, setSolicitudesEnviadas] = useState<SolicitudEnviada[]>([]);
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

      const [friendsRes, solicitudesRecRes, solicitudesEnvRes] = await Promise.all([
        axios.get<Friend[]>(API_ENDPOINTS.AMIGOS.GET_LISTA, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get<Solicitud[]>(API_ENDPOINTS.AMIGOS.GET_SOLICITUDES_RECIBIDAS, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get<SolicitudEnviada[]>(API_ENDPOINTS.AMIGOS.GET_SOLICITUDES_ENVIADAS, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      console.log('=== DEBUG INFO ===');
      console.log('Solicitudes recibidas:', solicitudesRecRes.data);
      console.log('Cantidad solicitudes recibidas:', solicitudesRecRes.data?.length || 0);
      console.log('Solicitudes enviadas:', solicitudesEnvRes.data);
      console.log('Cantidad solicitudes enviadas:', solicitudesEnvRes.data?.length || 0);
      console.log('Friends:', friendsRes.data);
      console.log('==================');

      setFriends(friendsRes.data || []);
      setSolicitudesRecibidas(solicitudesRecRes.data || []);
      setSolicitudesEnviadas(solicitudesEnvRes.data || []);
    } catch (error) {
      console.error('Error fetching friends or solicitudes:', error);
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

  // Auto-refresh cuando la pantalla se enfoca
  useFocusEffect(
    useCallback(() => {
      fetchFriends();
    }, [])
  );

  // Función para aceptar o rechazar solicitud recibida
  const responderSolicitud = async (solicitudId: number, status: 'accepted' | 'rejected') => {
    try {
      if (!token) throw new Error('Token no disponible');

      const response = await axios.patch(API_ENDPOINTS.AMIGOS.RESPONDER_SOLICITUD(solicitudId), { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('Éxito', response.data.message);
      // Refrescar toda la lista para obtener datos actualizados
      fetchFriends();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.response?.data?.error || 'No se pudo responder la solicitud.');
    }
  };

  // Función para eliminar amigo
  const eliminarAmigo = async (friendId: number, friendName: string) => {
    Alert.alert(
      'Eliminar amigo',
      `¿Estás seguro de que quieres eliminar a ${friendName} de tu lista de amigos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!token) throw new Error('Token no disponible');

              await axios.delete(API_ENDPOINTS.AMIGOS.ELIMINAR_AMIGO, {
                headers: { Authorization: `Bearer ${token}` },
                data: { friendId }
              });

              Alert.alert('Éxito', 'Amigo eliminado correctamente.');
              fetchFriends(); // Refrescar la lista
            } catch (error: any) {
              console.error(error);
              Alert.alert('Error', error.response?.data?.error || 'No se pudo eliminar el amigo.');
            }
          }
        }
      ]
    );
  };
  const cancelarSolicitudEnviada = async (solicitudId: number) => {
    Alert.alert(
      'Cancelar solicitud',
      '¿Estás seguro de que quieres cancelar esta solicitud de amistad?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!token) throw new Error('Token no disponible');

              await axios.delete(`${API_ENDPOINTS.AMIGOS.GET_LISTA}/solicitud/${solicitudId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });

              Alert.alert('Éxito', 'Solicitud cancelada correctamente.');
              // Refrescar toda la lista para obtener datos actualizados
              fetchFriends();
            } catch (error: any) {
              console.error(error);
              Alert.alert('Error', error.response?.data?.error || 'No se pudo cancelar la solicitud.');
            }
          }
        }
      ]
    );
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <View style={styles.friendCard}>
      <Image source={{ uri: item.profileImage || 'https://via.placeholder.com/50' }} style={styles.avatar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
      </View>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => eliminarAmigo(item.id, item.name)}
      >
        <Ionicons name="ellipsis-vertical" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );

  const renderSolicitudRecibida = ({ item }: { item: Solicitud }) => (
    <View style={styles.solicitudRecibidaCard}>
      <Image source={{ uri: item.solicitante.profileImage || 'https://via.placeholder.com/50' }} style={styles.avatar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.solicitante.name}</Text>
        <Text style={styles.solicitudLabel}>Te envió una solicitud</Text>
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

  const renderSolicitudEnviada = ({ item }: { item: SolicitudEnviada }) => (
    <View style={styles.solicitudEnviadaCard}>
      <Image source={{ uri: item.destinatario.profileImage || 'https://via.placeholder.com/50' }} style={styles.avatar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.destinatario.name}</Text>
        <Text style={styles.solicitudLabel}>Solicitud enviada - Pendiente</Text>
        <TouchableOpacity
          style={[styles.btn, styles.cancelBtn]}
          onPress={() => cancelarSolicitudEnviada(item.id)}
        >
          <Text style={styles.btnText}>Cancelar solicitud</Text>
        </TouchableOpacity>
      </View>
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
        <TouchableOpacity style={styles.addButton} onPress={navigateToAddFriends}>
          <Ionicons name="person-add" size={28} color="#333" />
        </TouchableOpacity>

        {/* Solicitudes Recibidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="mail" size={20} color="#4B3A2F" /> Solicitudes recibidas ({solicitudesRecibidas.length})
          </Text>
          {solicitudesRecibidas.length === 0 ? (
            <Text style={styles.noFriendsText}>No tienes solicitudes pendientes</Text>
          ) : (
            <FlatList
              data={solicitudesRecibidas}
              keyExtractor={(item) => `recibida-${item.id}`}
              renderItem={renderSolicitudRecibida}
              contentContainerStyle={{ paddingBottom: 16 }}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Solicitudes Enviadas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="paper-plane" size={20} color="#4B3A2F" /> Solicitudes enviadas ({solicitudesEnviadas.length})
          </Text>
          {solicitudesEnviadas.length === 0 ? (
            <Text style={styles.noFriendsText}>No has enviado solicitudes</Text>
          ) : (
            <FlatList
              data={solicitudesEnviadas}
              keyExtractor={(item) => `enviada-${item.id}`}
              renderItem={renderSolicitudEnviada}
              contentContainerStyle={{ paddingBottom: 16 }}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* Lista de Amigos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="people" size={20} color="#4B3A2F" /> Tus amigos ({friends.length})
          </Text>
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
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  solicitudRecibidaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#E8F5E8', // Verde claro para recibidas
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  solicitudEnviadaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#FFF0E6', // Naranja claro para enviadas
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
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
  solicitudLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    marginBottom: 8,
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
  cancelBtn: {
    backgroundColor: '#FF9800',
    marginTop: 4,
  },
  btnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
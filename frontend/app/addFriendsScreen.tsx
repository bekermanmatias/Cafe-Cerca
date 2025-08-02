import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../constants/Config';
import axios from 'axios';

import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

interface Usuario {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}

export default function AddFriendsScreen() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
  const [existingFriends, setExistingFriends] = useState<Set<string>>(new Set());
  const { token } = useAuth();

  const handleSearch = useCallback(async (text: string) => {
    setSearch(text);
    if (text.length < 2) {
      setUsers([]);
      return;
    }

    setLoading(true);

    try {
      if (!token) throw new Error('Token no disponible');

      const response = await axios.get(
        `${API_ENDPOINTS.USERS.SEARCH}?query=${encodeURIComponent(text)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers(response.data);
      
      // Verificar solicitudes pendientes y amigos existentes para los usuarios encontrados
      const userIds = response.data.map((user: Usuario) => user.id);
      await checkPendingRequests(userIds);
      await checkExistingFriends(userIds);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron obtener los usuarios.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const checkPendingRequests = async (userIds: string[]) => {
    try {
      if (!token) return;
      
      // Obtener solicitudes pendientes del usuario actual
      const response = await axios.get(API_ENDPOINTS.AMIGOS.GET_SOLICITUDES_ENVIADAS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Crear set de IDs de usuarios con solicitudes pendientes
      const pendingUserIds = new Set(
        response.data.map((request: any) => request.friendId?.toString())
      );
      
      // Actualizar estado de solicitudes pendientes
      setPendingRequests(prev => {
        const newSet = new Set(prev);
        userIds.forEach(id => {
          if (pendingUserIds.has(id.toString())) {
            newSet.add(id);
          }
        });
        return newSet;
      });
    } catch (error) {
      console.error('Error verificando solicitudes pendientes:', error);
    }
  };

  const checkExistingFriends = async (userIds: string[]) => {
    try {
      if (!token) return;
      
      // Obtener lista de amigos del usuario actual
      const response = await axios.get(API_ENDPOINTS.AMIGOS.GET_LISTA, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Crear set de IDs de usuarios que ya son amigos
      const friendUserIds = new Set(
        response.data.map((friend: any) => friend.id?.toString())
      );
      
      // Actualizar estado de amigos existentes
      setExistingFriends(prev => {
        const newSet = new Set(prev);
        userIds.forEach(id => {
          if (friendUserIds.has(id.toString())) {
            newSet.add(id);
          }
        });
        return newSet;
      });
    } catch (error) {
      console.error('Error verificando amigos existentes:', error);
    }
  };

  const handleAddFriend = async (friendId: string, friendName: string) => {
    // Cerrar teclado inmediatamente
    Keyboard.dismiss();
    
    // Verificar si ya es amigo
    if (existingFriends.has(friendId)) {
      Alert.alert('Ya son amigos', `${friendName} ya es tu amigo.`);
      return;
    }
    
    try {
      // Agregar a la lista de solicitudes pendientes
      setPendingRequests(prev => new Set([...prev, friendId]));
      
      if (!token) throw new Error('Token no disponible');

      const response = await axios.post(API_ENDPOINTS.AMIGOS.ENVIAR_SOLICITUD, 
        { friendId },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert('Solicitud enviada', `Has enviado una solicitud a ${friendName}`);
    } catch (error: any) {
      console.error(error);
      
      // Si es error 409, significa que ya existe la solicitud
      if (error.response?.status === 409) {
        Alert.alert('Solicitud ya enviada', 'Ya has enviado una solicitud a este usuario.');
        // Mantener como pendiente ya que la solicitud ya existe
      } else {
        Alert.alert('Error', error.response?.data?.error || error.message || 'No se pudo enviar la solicitud.');
        // Remover de pendientes solo si es otro tipo de error
        setPendingRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(friendId);
          return newSet;
        });
      }
    }
  };

  const renderUserItem = ({ item }: { item: Usuario }) => {
    const isPending = pendingRequests.has(item.id);
    const isFriend = existingFriends.has(item.id);
    
    return (
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <Image
            source={{ 
              uri: item.profileImage || 'https://via.placeholder.com/50x50/8D6E63/FFFFFF?text=' + item.name.charAt(0).toUpperCase()
            }}
            style={styles.userImage}
            defaultSource={{ uri: 'https://via.placeholder.com/50x50/8D6E63/FFFFFF?text=' + item.name.charAt(0).toUpperCase() }}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.name}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.addButton,
            (isPending || isFriend) && styles.pendingButton
          ]}
          onPress={() => handleAddFriend(item.id, item.name)}
          disabled={isPending || isFriend}
        >
          <Text style={[
            styles.addButtonText,
            (isPending || isFriend) && styles.pendingButtonText
          ]}>
            {isFriend ? 'Amigo' : isPending ? 'Pendiente' : 'Agregar'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Agregar amigos</Text>

        <TextInput
          style={styles.input}
          placeholder="Buscar por nombre o email..."
          placeholderTextColor={Colors.text.light}
          value={search}
          onChangeText={handleSearch}
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
        />

        {loading && <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 10 }} />}

        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingVertical: 12 }}
          renderItem={renderUserItem}
          ListEmptyComponent={
            !loading && search.length >= 2 ? (
              <Text style={styles.emptyText}>No se encontraron usuarios.</Text>
            ) : null
          }
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: Fonts.sizes.title,
    fontWeight: Fonts.weights.bold,
    marginTop: -40,
    marginBottom: 12,
    color: Colors.text.primary,
  },
  input: {
    height: 44,
    borderColor: Colors.gray[300],
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.gray[100],
    color: Colors.text.primary,
    fontSize: Fonts.sizes.md,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomColor: Colors.gray[200],
    borderBottomWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: Colors.gray[200],
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: Fonts.sizes.lg,
    fontWeight: Fonts.weights.medium,
    color: Colors.text.primary,
    marginBottom: 2,
  },

  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  pendingButton: {
    backgroundColor: Colors.gray[300],
  },
  addButtonText: {
    color: Colors.white,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.medium,
  },
  pendingButtonText: {
    color: Colors.text.light,
  },
  emptyText: {
    marginTop: 20,
    textAlign: 'center',
    color: Colors.text.light,
    fontSize: Fonts.sizes.md,
  },
});

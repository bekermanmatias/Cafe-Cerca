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
  const [isAddingFriend, setIsAddingFriend] = useState(false);
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
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron obtener los usuarios.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleAddFriend = async (friendId: string, friendName: string) => {
    try {
      setIsAddingFriend(true);
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
      Alert.alert('Error', error.response?.data?.error || error.message || 'No se pudo enviar la solicitud.');
    } finally {
      setIsAddingFriend(false);
    }
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
        />

        {loading && <ActivityIndicator size="small" color={Colors.gray[500]} style={{ marginTop: 10 }} />}

        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingVertical: 12 }}
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <Text style={styles.userName}>{item.name}</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddFriend(item.id, item.name)}
              >
                <Text style={styles.addButtonText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            !loading && search.length >= 2 ? (
              <Text style={styles.emptyText}>No se encontraron usuarios.</Text>
            ) : null
          }
        />
      </SafeAreaView>
      
      <LoadingSpinner 
        visible={isAddingFriend} 
        message="Enviando solicitud..."
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: Fonts.sizes.title,
    fontWeight: Fonts.weights.bold,
    marginTop: 20,
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
    paddingVertical: 14,
    borderBottomColor: Colors.gray[200],
    borderBottomWidth: 1,
  },
  userName: {
    fontSize: Fonts.sizes.lg,
    color: Colors.text.primary,
  },
  addButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: Fonts.sizes.md,
    fontWeight: Fonts.weights.medium,
  },
  emptyText: {
    marginTop: 20,
    textAlign: 'center',
    color: Colors.text.light,
    fontSize: Fonts.sizes.md,
  },
});

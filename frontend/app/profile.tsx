// app/profile.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../services/api';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = () => {
  const router = useRouter();
  const { user, logout: contextLogout, login: updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleImagePick = async () => {
    try {
      // Solicitar permisos
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Se necesitan permisos para acceder a la galería');
          return;
        }
      }

      // Abrir selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        try {
          // Usar el servicio para actualizar la imagen
          const response = await apiService.updateProfileImage(result.assets[0].uri);
          
          // Actualizar datos del usuario en el contexto
          if (user) {
            const updatedUser = { ...user, profileImage: response.profileImage };
            await updateUser(updatedUser);
          }
          
          Alert.alert('Éxito', 'Foto de perfil actualizada');
        } catch (error) {
          console.error('Error actualizando foto:', error);
          Alert.alert('Error', 'No se pudo actualizar la foto de perfil');
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const handleMenuPress = (action: string) => {
    switch (action) {
      case 'Mis cafeterías guardadas':
        router.push('/saved-cafes');
        break;
      case 'Mis likes':
        router.push('/liked-visits');
        break;
      default:
        Alert.alert('Próximamente', 'Esta función estará disponible pronto');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await contextLogout();
              router.replace('/(auth)/signin');
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              Alert.alert('Error', 'No se pudo cerrar sesión');
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    { title: 'Mis cafeterías guardadas', icon: 'bookmark' as const },
    { title: 'Mis likes', icon: 'favorite' as const },
    { title: 'Tema', icon: 'palette' as const },
    { title: 'Editar Perfil', icon: 'edit' as const },
    { title: 'Cambiar Contraseña', icon: 'lock' as const },
  ];

  if (!user) {
    console.log('Usuario no encontrado en el contexto');
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Cargando perfil...</Text>
      </View>
    );
  }

  console.log('Usuario cargado:', user);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.profileSection}>
          <View style={styles.imageContainer}>
            <Image
              source={{ 
                uri: user.profileImage || 'https://via.placeholder.com/150x150/8B4513/FFFFFF?text=U'
              }}
              style={styles.profileImage}
              onError={(error) => {
                console.log('Error cargando imagen de perfil:', error);
              }}
            />
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={handleImagePick}
              disabled={loading}
            >
              <MaterialIcons name="camera-alt" size={20} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userHandle}>@{user.email.split('@')[0]}</Text>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item.title)}
            >
              <View style={styles.menuItemContent}>
                <MaterialIcons name={item.icon} size={24} color="#8D6E63" />
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#8D6E63" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <MaterialIcons name="logout" size={24} color="white" />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingTop: 60,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
  },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#8D6E63',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#8D6E63',
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#8D6E63',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8D6E63',
    padding: 16,
    margin: 20,
    borderRadius: 12,
    marginBottom: Platform.OS === 'ios' ? 40 : 20, // Más espacio para iOS
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;
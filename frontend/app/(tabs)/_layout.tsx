// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS, API_URL } from '../../constants/Config';
import axios from 'axios';

import DiaryIcon from '../../assets/icons/diary.svg';
import ExploreIcon from '../../assets/icons/explore.svg';
import FriendsIcon from '../../assets/icons/friends.svg';
import MapIcon from '../../assets/icons/map.svg';

function HeaderRight() {
  const router = useRouter();
  const { token } = useAuth();
  const [pendingInvitations, setPendingInvitations] = useState(0);

  const fetchPendingInvitations = async () => {
    if (!token) {
      return;
    }
    
    try {
      const [solicitudesRes, invitacionesRes] = await Promise.all([
        axios.get(API_ENDPOINTS.AMIGOS.GET_SOLICITUDES_RECIBIDAS, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/visita-participantes/invitaciones-pendientes`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      
      // Filtrar solo las solicitudes con status 'pending'
      const pendingSolicitudes = solicitudesRes.data?.filter((solicitud: any) => 
        solicitud.status === 'pending'
      ).length || 0;
      
      // Contar invitaciones a visitas pendientes
      const pendingInvitaciones = invitacionesRes.data?.length || 0;
      
      const totalPending = pendingSolicitudes + pendingInvitaciones;
      
      setPendingInvitations(totalPending);
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
    }
  };

  useEffect(() => {
    fetchPendingInvitations();
    
    // Refrescar cada 30 segundos para mantener el contador actualizado
    const interval = setInterval(fetchPendingInvitations, 30000);
    
    return () => clearInterval(interval);
  }, [token]);

  // Refrescar cuando la pantalla se enfoca
  useFocusEffect(
    useCallback(() => {
      fetchPendingInvitations();
    }, [token])
  );

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
      <TouchableOpacity 
        style={{ marginRight: 12, position: 'relative' }}
        onPress={() => router.push('/notifications')}
      >
        <Ionicons name="notifications-outline" size={28} color="#8D6E63" />
        {pendingInvitations > 0 && (
          <View style={{
            position: 'absolute',
            top: -5,
            right: -5,
            backgroundColor: '#FF4444',
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: '#fff',
          }}>
            <Text style={{
              color: '#fff',
              fontSize: 12,
              fontWeight: 'bold',
            }}>
              {pendingInvitations > 99 ? '99+' : pendingInvitations}
            </Text>
          </View>
        )}
        {/* Puntito de notificación cuando hay solicitudes pendientes */}
        {pendingInvitations > 0 && (
          <View style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#FF4444',
            borderWidth: 1,
            borderColor: '#fff',
          }} />
        )}
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => router.push('/profile')}
      >
        <Ionicons name="person-circle-outline" size={40} color="#8D6E63" />
      </TouchableOpacity>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#8D6E63',
                  tabBarInactiveTintColor: '#8D6E63',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          height: 65,
          paddingBottom: 8,
        },
        tabBarIconStyle: {
          marginTop: 5,
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          height: 100,
        },
                  headerTintColor: '#8D6E63',
        headerTitle: 'Café Cerca',
        headerTitleStyle: {
          fontSize: 26,
          fontWeight: '600',
        },
        headerRight: () => <HeaderRight />,
      }}
    >

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color }) => (
            <ExploreIcon width={28} height={28} fill={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color }) => (
            <MapIcon width={28} height={28} fill={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: 'Diario',
          tabBarIcon: ({ color }) => (
            <DiaryIcon width={28} height={28} stroke={color} fill="none" />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Amigos',
          tabBarIcon: ({ color }) => (
            <FriendsIcon width={35} height={35} fill={color} />
          ),
        }}
      />
    </Tabs>
  );
}

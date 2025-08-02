import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS, API_URL } from '../constants/Config';
import axios from 'axios';
import { formatRelativeDate } from '../utils/dateUtils';
import ReviewModal from '../components/ReviewModal';

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

interface InvitacionVisita {
  id: number;
  visita: {
    id: number;
    comentario: string;
    calificacion: number;
    fecha: string;
    cafeteria: {
      id: number;
      name: string;
      address: string;
      imageUrl: string;
    };
    usuario: {
      id: number;
      name: string;
      profileImage: string;
    };
  };
  estado: 'pendiente' | 'aceptada' | 'rechazada';
  rol: 'creador' | 'participante';
}

export default function NotificationsScreen() {
  const [solicitudesRecibidas, setSolicitudesRecibidas] = useState<Solicitud[]>([]);
  const [solicitudesEnviadas, setSolicitudesEnviadas] = useState<SolicitudEnviada[]>([]);
  const [invitacionesVisitas, setInvitacionesVisitas] = useState<InvitacionVisita[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedVisita, setSelectedVisita] = useState<InvitacionVisita | null>(null);
  const [isRespondingSolicitud, setIsRespondingSolicitud] = useState(false);
  const [isCancelingSolicitud, setIsCancelingSolicitud] = useState(false);
  const [isRespondingInvitacion, setIsRespondingInvitacion] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const router = useRouter();
  const { token } = useAuth();

  const fetchSolicitudes = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      if (!token) throw new Error('Token no disponible');

      const [solicitudesRecRes, solicitudesEnvRes, invitacionesRes] = await Promise.all([
        axios.get<Solicitud[]>(API_ENDPOINTS.AMIGOS.GET_SOLICITUDES_RECIBIDAS, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get<SolicitudEnviada[]>(API_ENDPOINTS.AMIGOS.GET_SOLICITUDES_ENVIADAS, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get<InvitacionVisita[]>(`${API_URL}/visita-participantes/invitaciones-pendientes`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);



      setSolicitudesRecibidas(solicitudesRecRes.data || []);
      setSolicitudesEnviadas(solicitudesEnvRes.data || []);
      setInvitacionesVisitas(invitacionesRes.data || []);
    } catch (error) {
      console.error('Error fetching solicitudes:', error);
      Alert.alert('Error', 'No se pudo cargar la información.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Función para refresh manual
  const onRefresh = useCallback(() => {
    fetchSolicitudes(true);
  }, []);

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  // Refrescar cuando la pantalla se enfoca
  useFocusEffect(
    useCallback(() => {
      fetchSolicitudes();
    }, [])
  );

  const responderSolicitud = async (solicitudId: number, status: 'accepted' | 'rejected') => {
    try {
      setIsRespondingSolicitud(true);
      if (!token) throw new Error('Token no disponible');

      await axios.patch(
        API_ENDPOINTS.AMIGOS.RESPONDER_SOLICITUD(solicitudId),
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refrescar la lista después de responder
      fetchSolicitudes();
      
      Alert.alert(
        'Éxito',
        status === 'accepted' ? 'Solicitud aceptada' : 'Solicitud rechazada'
      );
    } catch (error) {
      console.error('Error responding to solicitud:', error);
      Alert.alert('Error', 'No se pudo procesar la solicitud.');
    } finally {
      setIsRespondingSolicitud(false);
    }
  };

  const cancelarSolicitudEnviada = async (solicitudId: number) => {
    try {
      setIsCancelingSolicitud(true);
      if (!token) throw new Error('Token no disponible');

      await axios.delete(
        API_ENDPOINTS.AMIGOS.CANCELAR_SOLICITUD(solicitudId),
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refrescar la lista después de cancelar
      fetchSolicitudes();
      
      Alert.alert('Éxito', 'Solicitud cancelada');
    } catch (error) {
      console.error('Error canceling solicitud:', error);
      Alert.alert('Error', 'No se pudo cancelar la solicitud.');
    } finally {
      setIsCancelingSolicitud(false);
    }
  };

  const responderInvitacionVisita = async (visitaId: number, respuesta: 'aceptada' | 'rechazada') => {
    try {
      setIsRespondingInvitacion(true);
      if (!token) throw new Error('Token no disponible');

      if (respuesta === 'aceptada') {
        // Buscar la invitación para mostrar el modal
        const invitacion = invitacionesVisitas.find(inv => inv.visita.id === visitaId);
        if (invitacion) {
          setSelectedVisita(invitacion);
          setShowReviewModal(true);
        }
      } else {
        // Si rechaza, procesar directamente
        await axios.put(
          `${API_URL}/visita-participantes/${visitaId}/respuesta`,
          { respuesta },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Refrescar la lista después de rechazar
        fetchSolicitudes();
        
        Alert.alert('Éxito', 'Invitación rechazada');
      }
    } catch (error) {
      console.error('Error responding to invitacion:', error);
      Alert.alert('Error', 'No se pudo procesar la invitación.');
    } finally {
      setIsRespondingInvitacion(false);
    }
  };

  const handleSubmitReview = async (comentario: string, calificacion: number) => {
    try {
      setIsSubmittingReview(true);
      if (!token || !selectedVisita) throw new Error('Token o visita no disponible');

      // Primero aceptar la invitación
      await axios.put(
        `${API_URL}/visita-participantes/${selectedVisita.visita.id}/respuesta`,
        { respuesta: 'aceptada' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Luego crear la reseña
      const resenaResponse = await axios.post(
        `${API_URL}/resenas`,
        {
          visitaId: selectedVisita.visita.id,
          comentario,
          calificacion
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Cerrar modal y refrescar
      setShowReviewModal(false);
      setSelectedVisita(null);
      fetchSolicitudes();
      
      Alert.alert('Éxito', 'Invitación aceptada y reseña creada');
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'No se pudo procesar la reseña.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleCancelReview = () => {
    setShowReviewModal(false);
    setSelectedVisita(null);
  };

  const renderSolicitudRecibida = ({ item }: { item: Solicitud }) => (
    <View style={styles.solicitudCard}>
      <View style={styles.solicitudHeader}>
        <Image
          source={{ 
            uri: item.solicitante.profileImage || 'https://res.cloudinary.com/cafe-cerca/image/upload/v1/defaults/default-profile.png'
          }}
          style={styles.profileImage}
        />
        <View style={styles.solicitudInfo}>
          <Text style={styles.solicitudName}>{item.solicitante.name}</Text>
          <Text style={styles.solicitudEmail}>{item.solicitante.email}</Text>
        </View>
      </View>
      <View style={styles.solicitudActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => responderSolicitud(item.id, 'accepted')}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.acceptButtonText}>Aceptar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => responderSolicitud(item.id, 'rejected')}
        >
          <Ionicons name="close" size={20} color="#fff" />
          <Text style={styles.rejectButtonText}>Rechazar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSolicitudEnviada = ({ item }: { item: SolicitudEnviada }) => (
    <View style={styles.solicitudCard}>
      <View style={styles.solicitudHeader}>
        <Image
          source={{ 
            uri: item.destinatario.profileImage || 'https://res.cloudinary.com/cafe-cerca/image/upload/v1/defaults/default-profile.png'
          }}
          style={styles.profileImage}
        />
        <View style={styles.solicitudInfo}>
          <Text style={styles.solicitudName}>{item.destinatario.name}</Text>
          <Text style={styles.solicitudEmail}>{item.destinatario.email}</Text>
          <Text style={styles.solicitudStatus}>
            Estado: {item.status === 'pending' ? 'Pendiente' : item.status === 'accepted' ? 'Aceptada' : 'Rechazada'}
          </Text>
        </View>
      </View>
      {item.status === 'pending' && (
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => cancelarSolicitudEnviada(item.id)}
        >
          <Ionicons name="close" size={20} color="#fff" />
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderInvitacionVisita = ({ item }: { item: InvitacionVisita }) => (
    <View style={styles.invitacionCard}>
      <View style={styles.invitacionHeader}>
        <Image
          source={{ 
            uri: item.visita.usuario.profileImage || 'https://res.cloudinary.com/cafe-cerca/image/upload/v1/defaults/default-profile.png'
          }}
          style={styles.profileImage}
        />
        <View style={styles.invitacionInfo}>
          <Text style={styles.invitacionTitle}>{item.visita.cafeteria.name}</Text>
          <Text style={styles.invitacionSubtitle}>
            {item.visita.usuario.name} te invitó a visitar
          </Text>
          <Text style={styles.invitacionDate}>
                            {formatRelativeDate(item.visita.fecha)}
          </Text>
        </View>
      </View>
      <View style={styles.invitacionActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => responderInvitacionVisita(item.visita.id, 'aceptada')}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.acceptButtonText}>Aceptar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => responderInvitacionVisita(item.visita.id, 'rechazada')}
        >
          <Ionicons name="close" size={20} color="#fff" />
          <Text style={styles.rejectButtonText}>Rechazar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8D6E63" />
      </View>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            headerShown: true,
            title: 'Notificaciones',
            headerTitleStyle: {
              fontSize: 20,
              fontWeight: '600',
            },
          }}
        />
        
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Invitaciones a Visitas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="calendar" size={20} color="#8D6E63" /> Invitaciones a visitas ({invitacionesVisitas.length})
            </Text>
            {invitacionesVisitas.length === 0 ? (
              <Text style={styles.noItemsText}>No tienes invitaciones a visitas pendientes</Text>
            ) : (
              <FlatList
                data={invitacionesVisitas}
                keyExtractor={(item) => `invitacion-${item.id}`}
                renderItem={renderInvitacionVisita}
                contentContainerStyle={{ paddingBottom: 16 }}
                scrollEnabled={false}
              />
            )}
          </View>

          {/* Solicitudes Recibidas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="mail" size={20} color="#8D6E63" /> Solicitudes recibidas ({solicitudesRecibidas.length})
            </Text>
            {solicitudesRecibidas.length === 0 ? (
              <Text style={styles.noItemsText}>No tienes solicitudes pendientes</Text>
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
              <Ionicons name="paper-plane" size={20} color="#8D6E63" /> Solicitudes enviadas ({solicitudesEnviadas.length})
            </Text>
            {solicitudesEnviadas.length === 0 ? (
              <Text style={styles.noItemsText}>No has enviado solicitudes</Text>
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
        </ScrollView>
        <ReviewModal
          visible={showReviewModal}
          onClose={handleCancelReview}
          onSubmit={handleSubmitReview}
          cafeName={selectedVisita?.visita.cafeteria.name || 'Cafetería'}
        />
      </SafeAreaView>
      
      <LoadingSpinner 
        visible={isRespondingSolicitud || isCancelingSolicitud || isRespondingInvitacion || isSubmittingReview} 
        message={
          isRespondingSolicitud ? "Procesando solicitud..." :
          isCancelingSolicitud ? "Cancelando solicitud..." :
          isRespondingInvitacion ? "Procesando invitación..." :
          isSubmittingReview ? "Creando reseña..." : ""
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8D6E63',
    marginBottom: 12,
  },
  noItemsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 20,
  },
  solicitudCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8D6E63',
  },
  solicitudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  solicitudInfo: {
    flex: 1,
  },
  solicitudName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  solicitudEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  solicitudStatus: {
    fontSize: 12,
    color: '#8D6E63',
    fontWeight: '500',
  },
  solicitudActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  acceptButton: {
    backgroundColor: '#28a745',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#dc3545',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  invitacionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8D6E63', // Brown color for invitations
  },
  invitacionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  invitacionInfo: {
    flex: 1,
  },
  invitacionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  invitacionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  invitacionDate: {
    fontSize: 12,
    color: '#888',
  },
  invitacionActions: {
    flexDirection: 'row',
    gap: 8,
  },
}); 
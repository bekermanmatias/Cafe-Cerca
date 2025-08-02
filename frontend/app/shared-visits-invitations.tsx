import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../constants/Config';
import { formatRelativeDate } from '../utils/dateUtils';
import { apiService } from '../services/api';
import ReviewModal from '../components/ReviewModal';

interface InvitacionPendiente {
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

export default function SharedVisitsInvitationsScreen() {
  const [invitaciones, setInvitaciones] = useState<InvitacionPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedVisita, setSelectedVisita] = useState<InvitacionPendiente | null>(null);
  const [isRespondingInvitacion, setIsRespondingInvitacion] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const router = useRouter();
  const { token } = useAuth();

  const fetchInvitaciones = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      if (!token) throw new Error('Token no disponible');

      const response = await fetch(`${API_URL}/visita-participantes/invitaciones-pendientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Error al cargar las invitaciones');
      }

      const data = await response.json();
      setInvitaciones(data || []);
    } catch (error) {
      console.error('Error fetching invitaciones:', error);
      Alert.alert('Error', 'No se pudo cargar las invitaciones.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    fetchInvitaciones(true);
  }, []);

  useEffect(() => {
    fetchInvitaciones();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchInvitaciones();
    }, [])
  );

  const responderInvitacion = async (visitaId: number, respuesta: 'aceptada' | 'rechazada') => {
    try {
      setIsRespondingInvitacion(true);
      if (!token) throw new Error('Token no disponible');

      if (respuesta === 'aceptada') {
        // Buscar la invitación para mostrar el modal
        const invitacion = invitaciones.find(inv => inv.visita.id === visitaId);
        if (invitacion) {
          setSelectedVisita(invitacion);
          setShowReviewModal(true);
        }
        return;
      }

      // Si es rechazada, proceder normalmente
      const response = await fetch(`${API_URL}/visita-participantes/${visitaId}/respuesta`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ respuesta }),
      });

      if (!response.ok) {
        throw new Error('Error al responder la invitación');
      }

      const data = await response.json();
      Alert.alert('Éxito', data.message);
      fetchInvitaciones(); // Refrescar la lista
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'No se pudo responder la invitación.');
    } finally {
      setIsRespondingInvitacion(false);
    }
  };

  const handleSubmitReview = async (comentario: string, calificacion: number) => {
    if (!selectedVisita) return;

    try {
      setIsSubmittingReview(true);
      await apiService.aceptarInvitacionConResena(
        selectedVisita.visita.id,
        comentario,
        calificacion
      );

      Alert.alert('Éxito', 'Invitación aceptada y reseña guardada exitosamente');
      setShowReviewModal(false);
      setSelectedVisita(null);
      fetchInvitaciones(); // Refrescar la lista
    } catch (error: any) {
      console.error('Error al aceptar invitación con reseña:', error);
      Alert.alert('Error', error.message || 'No se pudo aceptar la invitación con reseña.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const renderInvitacion = ({ item }: { item: InvitacionPendiente }) => (
    <View style={styles.invitacionCard}>
      <View style={styles.invitacionHeader}>
        <Image 
          source={{ uri: item.visita.usuario.profileImage || 'https://via.placeholder.com/50' }} 
          style={styles.avatar}
        />
        <View style={styles.invitacionInfo}>
          <Text style={styles.invitacionTitle}>
            {item.visita.usuario.name} te invitó a una visita
          </Text>
          <Text style={styles.invitacionSubtitle}>
            {item.visita.cafeteria.name}
          </Text>
          <Text style={styles.invitacionDate}>
                            {formatRelativeDate(item.visita.fecha)}
          </Text>
        </View>
      </View>

      <View style={styles.cafeInfo}>
        {item.visita.cafeteria.imageUrl && (
          <Image 
            source={{ uri: item.visita.cafeteria.imageUrl }} 
            style={styles.cafeImage}
          />
        )}
        <View style={styles.cafeDetails}>
          <Text style={styles.cafeName}>{item.visita.cafeteria.name}</Text>
          <Text style={styles.cafeAddress}>{item.visita.cafeteria.address}</Text>
          <View style={styles.ratingContainer}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name={i < item.visita.calificacion ? "star" : "star-outline"}
                size={16}
                color="#FFD700"
              />
            ))}
            <Text style={styles.ratingText}>{item.visita.calificacion}/5</Text>
          </View>
        </View>
      </View>

      {item.visita.comentario && (
        <Text style={styles.comentario}>{item.visita.comentario}</Text>
      )}

      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[styles.btn, styles.acceptBtn]}
          onPress={() => responderInvitacion(item.visita.id, 'aceptada')}
        >
          <Text style={styles.btnText}>Aceptar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.rejectBtn]}
          onPress={() => responderInvitacion(item.visita.id, 'rechazada')}
        >
          <Text style={styles.btnText}>Rechazar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invitaciones de Visitas</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {invitaciones.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="mail-outline" size={64} color="#ccc" />
              <Text style={styles.emptyStateText}>No tienes invitaciones pendientes</Text>
              <Text style={styles.emptyStateSubtext}>
                Cuando tus amigos te inviten a visitas compartidas, aparecerán aquí
              </Text>
            </View>
          ) : (
            <FlatList
              data={invitaciones}
              keyExtractor={(item) => `invitacion-${item.id}`}
              renderItem={renderInvitacion}
              contentContainerStyle={styles.invitacionesList}
              scrollEnabled={false}
            />
          )}
        </ScrollView>

        {/* Modal para reseña */}
        <ReviewModal
          visible={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedVisita(null);
          }}
          onSubmit={handleSubmitReview}
          cafeName={selectedVisita?.visita.cafeteria.name || ''}
        />
      </SafeAreaView>
      
      <LoadingSpinner 
        visible={isRespondingInvitacion || isSubmittingReview} 
        message={
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  invitacionesList: {
    padding: 16,
  },
  invitacionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  invitacionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#ccc',
  },
  invitacionInfo: {
    flex: 1,
  },
  invitacionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  invitacionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  invitacionDate: {
    fontSize: 12,
    color: '#999',
  },
  cafeInfo: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  cafeImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  cafeDetails: {
    flex: 1,
  },
  cafeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cafeAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  comentario: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
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
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 
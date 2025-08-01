import { StyleSheet, ScrollView, Alert, TouchableOpacity, Text, View, RefreshControl, ActivityIndicator } from 'react-native';
import { VisitCard } from '../../components/VisitCard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useCallback, useMemo } from 'react';
import Constants from 'expo-constants';
import { shareVisit, shareDiary } from '../../constants/Sharing';
import { AntDesign, Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useDiary } from '../../hooks/useDiary';
import EmptyDiary from '../../assets/icons/empty-diary.svg';

export default function DiaryScreen() {
  const router = useRouter();
  const { refresh } = useLocalSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { visitas, isLoading, refreshing, error, refreshDiary, updateVisitLike } = useDiary();

  // Redirigir a login si no hay usuario después de la carga del contexto
  useEffect(() => {
    if (!authLoading && !user) {
      Alert.alert('Error', 'Debes iniciar sesión para ver tu diario');
      router.replace('/(auth)/signin');
    }
  }, [authLoading, user, router]);

  const handleShare = useCallback((visitId: number) => {
    shareVisit(visitId);
  }, []);

  const handleDetails = useCallback((visit: any) => {
    router.push({
      pathname: '/visit-details',
      params: {
        visitId: visit.id.toString(),
      },
    });
  }, [router]);

  const handleAddVisit = useCallback(() => {
    router.push({
      pathname: '/add-visit',
    });
  }, [router]);

  const handleShareDiary = useCallback(async () => {
    try {
      if (!user?.id) {
        Alert.alert('Error', 'Debes iniciar sesión para compartir tu diario');
        return;
      }
      await shareDiary(user.id);
    } catch (error) {
      console.error('Error sharing diary:', error);
      Alert.alert(
        'Error',
        'No se pudo compartir el diario. Por favor, intenta de nuevo.',
        [{ text: 'OK' }]
      );
    }
  }, [user?.id]);

  const handleStats = useCallback(() => {
    router.push('/stats');
  }, [router]);

  // Memoizar el componente EmptyState
  const EmptyState = useMemo(() => () => (
    <View style={styles.emptyContainer}>
      <EmptyDiary width={200} height={200} style={styles.emptyImage} fill="#E0E0E0" />
      <Text style={styles.emptyTitle}>¡Tu diario está vacío!</Text>
      <Text style={styles.emptyText}>Aquí podrás ver todas tus visitas a cafeterías.</Text>
      <Text style={styles.emptySubtext}>
        Comienza explorando cafeterías cercanas y comparte tus experiencias.
      </Text>
      <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/(tabs)/explore')}>
        <Feather name="coffee" size={20} color="#FFF" />
        <Text style={styles.exploreButtonText}>Explorar cafeterías</Text>
      </TouchableOpacity>
    </View>
  ), [router]);

  // Memoizar las visitas renderizadas
  const renderedVisits = useMemo(() => 
    visitas.map((visit) => (
      <VisitCard
        key={visit.id}
        visit={visit}
        onLikeChange={(liked) => updateVisitLike(visit.id, liked)}
        onShare={() => handleShare(visit.id)}
        onDetails={() => handleDetails(visit)}
      />
    )), [visitas, updateVisitLike, handleShare, handleDetails]);

  if (authLoading || !user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#8D6E63" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Mi Diario</Text>
          <TouchableOpacity style={styles.sortButton}>
            <Text style={styles.sortButtonText}>Recientes</Text>
            <AntDesign name="down" size={12} color="#8D6E63" style={styles.sortIcon} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={handleStats}>
            <AntDesign name="barschart" size={24} color="#8D6E63" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleShareDiary}>
            <AntDesign name="sharealt" size={24} color="#8D6E63" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={visitas.length === 0 ? styles.scrollViewEmpty : undefined}
        nestedScrollEnabled={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshDiary}
            colors={['#8D6E63']}
            tintColor="#8D6E63"
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando visitas...</Text>
          </View>
        ) : visitas.length === 0 ? (
          <EmptyState />
        ) : (
          renderedVisits
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fabButton} onPress={handleAddVisit}>
        <Text style={styles.fabText}>Agregar visita</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#8D6E63',
    marginRight: 4,
  },
  sortIcon: {
    marginTop: 2,
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#8D6E63',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8D6E63',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8D6E63',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollViewEmpty: {
    flexGrow: 1,
  },
});

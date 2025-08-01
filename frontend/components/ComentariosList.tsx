import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Alert, 
  ActivityIndicator, 
  StyleSheet,
  Platform,
  Keyboard,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  findNodeHandle,
  Image,
  RefreshControl
} from 'react-native';
import { apiService } from '../services/api';
import { ThemedText } from './ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

interface Usuario {
  id: number;
  name: string;
  profileImage: string | null;
}

interface Comentario {
  id: number;
  contenido: string;
  createdAt: string;
  usuario: Usuario;
}

interface ComentariosListProps {
  visitaId: number;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
}

export default function ComentariosList({ visitaId, ListHeaderComponent }: ComentariosListProps) {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [comentarioEditando, setComentarioEditando] = useState<Comentario | null>(null);
  const [textoEditado, setTextoEditado] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showOptions, setShowOptions] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const menuButtonsRefs = useRef<{ [key: number]: View | null }>({});
  const [userData, setUserData] = useState<any>(null);
  const defaultProfileImage = 'https://res.cloudinary.com/cafe-cerca/image/upload/v1/defaults/default-profile.png';

  const cargarComentarios = useCallback(async (isRefreshing = false) => {
    if (!visitaId) return;
    
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const data = await apiService.getComentarios(visitaId);
      setComentarios(data.comentarios || []);
    } catch (error) {
      console.error('Error al cargar comentarios:', error);
      Alert.alert('Error', 'No se pudieron cargar los comentarios');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [visitaId]);

  const onRefresh = useCallback(() => {
    cargarComentarios(true);
  }, [cargarComentarios]);

  useEffect(() => {
    const keyboardWillShow = (event: any) => {
      setIsKeyboardVisible(true);
      if (Platform.OS === 'android') {
        setKeyboardHeight(event.endCoordinates.height);
      }
      // Scroll más suave y con delay para que el teclado aparezca primero
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, Platform.OS === 'ios' ? 300 : 100);
    };

    const keyboardWillHide = () => {
      setIsKeyboardVisible(false);
      if (Platform.OS === 'android') {
        setKeyboardHeight(0);
      }
    };

    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      keyboardWillShow
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      keyboardWillHide
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    cargarComentarios();
  }, [cargarComentarios]);

  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      setUserData(user);
    }
  }, [user]);

  const handleTextChange = (text: string) => {
    setNuevoComentario(text);
    
    // Si el usuario comienza a escribir y el teclado no está visible, hacer scroll
    if (text.length === 1 && !isKeyboardVisible) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const agregarComentario = async () => {
    if (!nuevoComentario.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await apiService.createComentario(visitaId, nuevoComentario.trim());
      setComentarios(prevComentarios => [...prevComentarios, response.comentario]);
      setNuevoComentario('');
      
      // Scroll al final después de agregar comentario
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error al agregar comentario:', error);
      Alert.alert('Error', 'No se pudo agregar el comentario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const eliminarComentario = async (comentarioId: number) => {
    try {
      await apiService.deleteComentario(comentarioId);
      setComentarios(prevComentarios => 
        prevComentarios.filter(comentario => comentario.id !== comentarioId)
      );
    } catch (error) {
      console.error('Error al eliminar comentario:', error);
      Alert.alert('Error', 'No se pudo eliminar el comentario');
    }
  };

  const editarComentario = async (comentarioId: number, nuevoTexto: string) => {
    try {
      const response = await apiService.updateComentario(comentarioId, nuevoTexto);
      setComentarios(prevComentarios => 
        prevComentarios.map(c => 
          c.id === comentarioId ? response.comentario : c
        )
      );
      setShowEditModal(false);
      setComentarioEditando(null);
    } catch (error) {
      console.error('Error al editar comentario:', error);
      Alert.alert('Error', 'No se pudo editar el comentario');
    }
  };

  const handleEditarComentario = (comentario: Comentario) => {
    setComentarioEditando(comentario);
    setTextoEditado(comentario.contenido);
    setShowEditModal(true);
    setShowOptions(null);
  };

  const handleShowOptions = (comentarioId: number) => {
    const button = menuButtonsRefs.current[comentarioId];
    if (!button) return;

    button.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
      const screenWidth = Dimensions.get('window').width;
      const menuX = screenWidth - 170;
      const menuY = pageY - 35; // Subimos más el menú
      setMenuPosition({ x: menuX, y: menuY });
      setShowOptions(showOptions === comentarioId ? null : comentarioId);
    });
  };

  const setMenuButtonRef = (id: number) => (ref: View | null) => {
    menuButtonsRefs.current[id] = ref;
  };

  const renderOptionsMenu = (comentarioId: number, comentario: Comentario) => {
    if (showOptions !== comentarioId) return null;

    return (
      <View style={[
        styles.optionsMenu,
        {
          position: 'absolute',
          top: menuPosition.y,
          left: menuPosition.x,
        }
      ]}>
        <TouchableOpacity 
          style={styles.optionItem}
          onPress={(e) => {
            e.stopPropagation();
            handleEditarComentario(comentario);
          }}
        >
          <Ionicons name="create-outline" size={20} color="#666" />
          <ThemedText style={styles.optionText}>Editar</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.optionItem, styles.deleteOption]}
          onPress={(e) => {
            e.stopPropagation();
            setShowOptions(null);
            Alert.alert(
              "Eliminar comentario",
              "¿Estás seguro que deseas eliminar este comentario?",
              [
                { text: "Cancelar", style: "cancel" },
                { 
                  text: "Eliminar", 
                  style: "destructive",
                  onPress: () => eliminarComentario(comentarioId)
                }
              ]
            );
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#FF4444" />
          <ThemedText style={styles.deleteOptionText}>Eliminar</ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  const renderComentario = ({ item }: { item: Comentario }) => (
    <TouchableOpacity 
      activeOpacity={1}
      onPress={handlePressOutside}
    >
      <View style={styles.comentarioContainer}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ 
              uri: item.usuario?.profileImage || defaultProfileImage
            }}
            style={styles.avatar}
          />
        </View>
        <View style={styles.comentarioContent}>
          <View style={styles.comentarioHeader}>
            <ThemedText style={styles.nombreUsuario}>{item.usuario?.name || 'Usuario sin nombre'}</ThemedText>
            <ThemedText style={styles.fecha}>
              {new Date(item.createdAt).toLocaleDateString()}
            </ThemedText>
          </View>
          <ThemedText style={styles.textoComentario}>{item.contenido}</ThemedText>
        </View>
        {userData?.id === item.usuario?.id && (
          <TouchableOpacity 
            ref={setMenuButtonRef(item.id)}
            style={styles.moreButton}
            onPress={(e) => {
              e.stopPropagation();
              handleShowOptions(item.id);
            }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  // Agregar función para cerrar el menú
  const handlePressOutside = () => {
    if (showOptions !== null) {
      setShowOptions(null);
    }
  };

  const renderCommentsList = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8D6E63" />
        </View>
      );
    }

    return (
      <View style={styles.comentariosSection}>
        <View style={styles.comentariosHeader}>
          <ThemedText style={styles.comentariosTitle}>Comentarios</ThemedText>
        </View>
        {comentarios.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>No hay comentarios aún</ThemedText>
          </View>
        ) : (
          comentarios.map(comentario => (
            <View key={comentario.id.toString()}>
              {renderComentario({ item: comentario })}
            </View>
          ))
        )}
      </View>
    );
  };

  const EmptyListComponent = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>No hay comentarios aún</ThemedText>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      enabled={Platform.OS === 'ios'} // Deshabilitar en Android para manejar manualmente
    >
      <FlatList
        ref={flatListRef}
        data={comentarios}
        renderItem={renderComentario}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={ListHeaderComponent}
        style={styles.flatList}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.flatListContent}
        ListEmptyComponent={EmptyListComponent}
        ListHeaderComponentStyle={styles.listHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#8D6E63']}
            tintColor="#8D6E63"
          />
        }
      />
      
      {showOptions !== null && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handlePressOutside}
        />
      )}

      {showOptions !== null && comentarios.find(c => c.id === showOptions) && (
        renderOptionsMenu(
          showOptions,
          comentarios.find(c => c.id === showOptions)!
        )
      )}

      {/* Input de comentarios */}
      <View style={[
        styles.inputWrapper,
        isKeyboardVisible && styles.inputWrapperWithKeyboard,
        Platform.OS === 'android' && isKeyboardVisible && { 
          bottom: keyboardHeight + 20 // Reducir el espacio extra
        }
      ]}>
        <View style={styles.inputContainer}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ 
                uri: userData?.profileImage || defaultProfileImage
              }}
              style={styles.avatar}
            />
          </View>
          <TextInput
            value={nuevoComentario}
            onChangeText={handleTextChange}
            placeholder="Escribe un comentario..."
            placeholderTextColor="#999"
            style={styles.input}
            multiline
            textAlignVertical="center"
          />
          <TouchableOpacity
            onPress={agregarComentario}
            disabled={isSubmitting || !nuevoComentario.trim()}
            style={[
              styles.publishButton,
              (!nuevoComentario.trim() || isSubmitting) && styles.publishButtonDisabled
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <ThemedText style={styles.publishButtonText}>Publicar</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Editar comentario</ThemedText>
            <TextInput
              value={textoEditado}
              onChangeText={setTextoEditado}
              style={styles.modalInput}
              multiline
              placeholder="Edita tu comentario..."
              placeholderTextColor="#999"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => {
                  if (comentarioEditando && textoEditado.trim()) {
                    editarComentario(comentarioEditando.id, textoEditado.trim());
                  }
                }}
              >
                <ThemedText style={styles.saveButtonText}>Guardar</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    flexGrow: 1,
    paddingBottom: 120, // Más espacio para el input
  },
  keyboardAvoidingView: {
    width: '100%',
    backgroundColor: '#fff',
  },
  inputWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingBottom: Platform.OS === 'ios' ? 20 : 5, // Reducir padding en Android
    ...Platform.select({
      android: {
        elevation: 3,
        // Asegurar que esté por encima del teclado
        zIndex: 1000,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  inputWrapperWithKeyboard: {
    // En Android, el KeyboardAvoidingView se encarga de subir el input
    ...Platform.select({
      android: {
        // Asegurar que el input esté visible cuando el teclado aparece
        position: 'relative',
      },
    }),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    marginRight: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    fontSize: 14,
    minHeight: 36,
    maxHeight: 100,
    color: '#000',
  },
  publishButton: {
    backgroundColor: '#8D6E63',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
  },
  publishButtonDisabled: {
    opacity: 0.5,
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  comentariosSection: {
    flex: 1,
  },
  comentariosHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16, // Más espacio vertical
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  comentariosTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000', // Color más oscuro para el título
    letterSpacing: 0.25, // Mejor legibilidad
  },
  comentarioContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-start',
    backgroundColor: '#fff',
  },
  comentarioContent: {
    flex: 1,
  },
  comentarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nombreUsuario: {
    fontWeight: '600',
    marginRight: 8,
    fontSize: 15,
    color: '#000',
  },
  fecha: {
    fontSize: 13,
    color: '#666',
  },
  textoComentario: {
    fontSize: 15,
    lineHeight: 20,
    color: '#333',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
  moreButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
  },
  optionsMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    minWidth: 140,
    zIndex: 9999,
    ...Platform.select({
      android: {
        elevation: 8,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
    }),
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    borderRadius: 8,
  },
  deleteOption: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 4,
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  deleteOptionText: {
    fontSize: 14,
    color: '#FF4444',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#000',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#8D6E63',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  touchableContainer: {
    flex: 1,
  },
  listHeader: {
    backgroundColor: '#fff',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  optionsMenuContainer: {
    position: 'absolute',
    zIndex: 9999,
  },
}); 
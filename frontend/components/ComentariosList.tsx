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
  Image
} from 'react-native';
import { API_ENDPOINTS } from '../constants/Config';
import { ThemedText } from './ThemedText';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Usuario {
  id: number;
  name: string;
  profileImage: string | null;
}

interface Comentario {
  id: number;
  texto: string;
  fechaHora: string;
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
  const [showOptions, setShowOptions] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const flatListRef = useRef<FlatList>(null);
  const menuButtonsRefs = useRef<{ [key: number]: View | null }>({});
  const [userData, setUserData] = useState<any>(null);
  const defaultProfileImage = 'https://res.cloudinary.com/cafe-cerca/image/upload/v1/defaults/default-profile.png';

  useEffect(() => {
    const keyboardWillShow = () => {
      setIsKeyboardVisible(true);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    const keyboardWillHide = () => {
      setIsKeyboardVisible(false);
    };

    const showSubscription = Keyboard.addListener(
      'keyboardDidShow',
      keyboardWillShow
    );
    const hideSubscription = Keyboard.addListener(
      'keyboardDidHide',
      keyboardWillHide
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    loadUserData();
    cargarComentarios();
  }, [cargarComentarios]);

  const loadUserData = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        setUserData(JSON.parse(userDataStr));
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
    }
  };

  const cargarComentarios = useCallback(async () => {
    if (!visitaId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.COMENTARIOS.GET_BY_VISITA(visitaId));
      if (!response.ok) throw new Error('Error al obtener comentarios');
      const data = await response.json();
      setComentarios(data);
    } catch (error) {
      console.error('Error al cargar comentarios:', error);
      Alert.alert('Error', 'No se pudieron cargar los comentarios');
    } finally {
      setIsLoading(false);
    }
  }, [visitaId]);

  const agregarComentario = async () => {
    if (!nuevoComentario.trim() || !visitaId || !userData) return;

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) throw new Error('No se encontró el token de autenticación');

      const response = await fetch(API_ENDPOINTS.COMENTARIOS.CREATE(visitaId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          texto: nuevoComentario.trim()
        }),
      });

      if (!response.ok) throw new Error('Error al crear comentario');

      const comentarioCreado = await response.json();
      setComentarios(prevComentarios => [...prevComentarios, comentarioCreado]);
      setNuevoComentario('');
    } catch (error) {
      console.error('Error al agregar comentario:', error);
      Alert.alert('Error', 'No se pudo agregar el comentario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const eliminarComentario = async (comentarioId: number) => {
    try {
      const response = await fetch(API_ENDPOINTS.COMENTARIOS.DELETE(comentarioId), {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Error al eliminar comentario');

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
      const response = await fetch(API_ENDPOINTS.COMENTARIOS.UPDATE(comentarioId), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texto: nuevoTexto
        }),
      });

      if (!response.ok) throw new Error('Error al actualizar comentario');

      const comentarioActualizado = await response.json();
      setComentarios(prevComentarios => 
        prevComentarios.map(c => 
          c.id === comentarioId ? { ...c, texto: nuevoTexto } : c
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
    setTextoEditado(comentario.texto);
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
              {new Date(item.fechaHora).toLocaleDateString()}
            </ThemedText>
          </View>
          <ThemedText style={styles.textoComentario}>{item.texto}</ThemedText>
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
    <View style={styles.container}>
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

      {Platform.OS === 'android' ? (
        <View style={[
          styles.inputWrapper,
          isKeyboardVisible && styles.inputWrapperWithKeyboard
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
              onChangeText={setNuevoComentario}
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
      ) : (
        <KeyboardAvoidingView
          behavior="padding"
          keyboardVerticalOffset={90}
          style={styles.keyboardAvoidingView}
        >
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
              onChangeText={setNuevoComentario}
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
        </KeyboardAvoidingView>
      )}

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
    </View>
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
    paddingBottom: 100, // Espacio para el input
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
    ...Platform.select({
      android: {
        elevation: 3,
      },
    }),
  },
  inputWrapperWithKeyboard: {
    position: 'relative',
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
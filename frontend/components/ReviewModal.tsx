import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (comentario: string, calificacion: number) => Promise<void>;
  cafeName: string;
}

export default function ReviewModal({ visible, onClose, onSubmit, cafeName }: ReviewModalProps) {
  const [comentario, setComentario] = useState('');
  const [calificacion, setCalificacion] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (calificacion === 0) {
      Alert.alert('Error', 'Por favor selecciona una calificación');
      return;
    }

    if (!comentario.trim()) {
      Alert.alert('Error', 'Por favor escribe un comentario');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(comentario, calificacion);
      // Reset form
      setComentario('');
      setCalificacion(0);
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'No se pudo guardar tu reseña');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setComentario('');
      setCalificacion(0);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={handleClose}
      >
        <View 
          style={styles.modalContainer}
          onStartShouldSetResponder={() => true}
          onTouchEnd={e => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Tu opinión sobre {cafeName}</Text>
            <TouchableOpacity 
              onPress={handleClose} 
              disabled={loading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.subtitle}>
              Comparte tu experiencia en esta visita
            </Text>

            {/* Rating Stars */}
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingLabel}>Calificación</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setCalificacion(star)}
                    disabled={loading}
                    style={styles.starButton}
                    hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
                  >
                    <Ionicons
                      name={star <= calificacion ? "star" : "star-outline"}
                      size={36}
                      color={star <= calificacion ? "#FFD700" : "#ddd"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.ratingText}>{calificacion}/5</Text>
            </View>

            {/* Comment Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Comentario</Text>
              <TextInput
                style={styles.textInput}
                value={comentario}
                onChangeText={setComentario}
                placeholder="¿Qué te pareció el lugar? ¿Recomendarías visitarlo?"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                maxLength={500}
                editable={!loading}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{comentario.length}/500</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button, 
                styles.submitButton, 
                loading && styles.disabledButton,
                (!comentario.trim() || calificacion === 0) && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={loading || !comentario.trim() || calificacion === 0}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Guardar Reseña</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end', // Modal desde abajo
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    width: '100%',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  content: {
    paddingVertical: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  ratingContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 16,
  },
  starButton: {
    padding: 8,
    marginHorizontal: 8,
  },
  ratingText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: '#f8f9fa',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    borderWidth: 1,
    borderColor: '#6c757d',
  },
  submitButton: {
    backgroundColor: '#8D6E63',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
}); 
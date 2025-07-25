import React, { useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, Modal, Dimensions } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { AntDesign } from '@expo/vector-icons';

const STANDARD_WIDTH = 1080; // Ancho estándar para las imágenes
const STANDARD_HEIGHT = 1080; // Alto estándar para las imágenes
const ASPECT_RATIOS = [
  { label: 'Cuadrado', value: 1 },
  { label: '4:3', value: 4/3 },
  { label: '16:9', value: 16/9 },
];

interface ImageEditorProps {
  uri: string;
  onSave: (uri: string) => void;
  onCancel: () => void;
  visible: boolean;
}

export default function ImageEditor({ uri, onSave, onCancel, visible }: ImageEditorProps) {
  const [selectedRatio, setSelectedRatio] = useState(1);
  const screenWidth = Dimensions.get('window').width;

  const handleCrop = async (ratio: number) => {
    try {
      // Calcular dimensiones manteniendo el ratio seleccionado
      let width = STANDARD_WIDTH;
      let height = width / ratio;

      // Si la altura resultante es mayor que el máximo, ajustamos basándonos en la altura
      if (height > STANDARD_HEIGHT) {
        height = STANDARD_HEIGHT;
        width = height * ratio;
      }

      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          { resize: { width: Math.round(width), height: Math.round(height) } },
          { crop: { originX: 0, originY: 0, width: Math.round(width), height: Math.round(height) } }
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      onSave(result.uri);
    } catch (error) {
      console.error('Error al procesar la imagen:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel}>
            <AntDesign name="close" size={24} color="#8D6E63" />
          </TouchableOpacity>
          <Text style={styles.title}>Editar imagen</Text>
          <View style={{ width: 24 }} />
        </View>

        <Image
          source={{ uri }}
          style={[styles.image, { width: screenWidth, height: screenWidth / selectedRatio }]}
          resizeMode="cover"
        />

        <View style={styles.ratiosContainer}>
          {ASPECT_RATIOS.map((ratio) => (
            <TouchableOpacity
              key={ratio.label}
              style={[
                styles.ratioButton,
                selectedRatio === ratio.value && styles.selectedRatio
              ]}
              onPress={() => setSelectedRatio(ratio.value)}
            >
              <Text style={[
                styles.ratioText,
                selectedRatio === ratio.value && styles.selectedRatioText
              ]}>
                {ratio.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => handleCrop(selectedRatio)}
        >
          <Text style={styles.saveButtonText}>Guardar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  image: {
    marginVertical: 20,
  },
  ratiosContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
  },
  ratioButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#8D6E63',
  },
  selectedRatio: {
    backgroundColor: '#8D6E63',
  },
  ratioText: {
    color: '#8D6E63',
    fontSize: 14,
  },
  selectedRatioText: {
    color: '#FFF',
  },
  saveButton: {
    backgroundColor: '#8D6E63',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
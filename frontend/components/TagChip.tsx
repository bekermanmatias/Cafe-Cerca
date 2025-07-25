import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

type TagChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void; // Si no se pasa, es decorativo
  style?: ViewStyle;
  textStyle?: TextStyle;  // <-- agregar
};

export default function TagChip({ label, selected = false, onPress, style, textStyle }: TagChipProps) {
  const ChipComponent = onPress ? Pressable : View;

  return (
    <ChipComponent
      onPress={onPress}
      style={[
        styles.chip,
        selected ? styles.selected : styles.unselected,
        style,
      ]}
    >
      <Text
        style={[
          selected ? styles.textSelected : styles.textUnselected,
          textStyle,  // <-- agregar aquí
        ]}
      >
        {label}
      </Text>
    </ChipComponent>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  selected: {
    backgroundColor: '#D7B899',
    borderColor: '#D7B899',
  },
  unselected: {
    backgroundColor: '#EDDCC2',
    borderColor: '#EDDCC2',
  },
  textSelected: {
    color: '#333',
  },
  textUnselected: {
    color: '#333',
  },
});

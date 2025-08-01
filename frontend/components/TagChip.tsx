import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons'; // Asumiendo que usas FontAwesome para iconos

type TagChipProps = {
  label: string;
  icon?: string;            // nuevo prop para icono (nombre de icono FontAwesome5)
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export default function TagChip({ label, icon, selected = false, onPress, style, textStyle }: TagChipProps) {
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
      {icon && (
        <FontAwesome5
          name={icon}
          size={14}
          color={selected ? '#333' : '#333'}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          selected ? styles.textSelected : styles.textUnselected,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </ChipComponent>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
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
  icon: {
    marginRight: 6,
  },
});

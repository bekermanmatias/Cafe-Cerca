import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

type TagChipProps = {
  label: string;
  icon?: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

// Componente para iconos seguros (mismo que en explore)
const SafeIcon = React.memo(({ iconName }: { iconName: string }) => {
  const iconMap: { [key: string]: string } = {
    'shield': 'shield-alt',
    'volume-x': 'volume-mute',
    'utensils': 'utensils',
    'coffee': 'coffee',
    'wifi': 'wifi',
  };

  const validIconName = iconMap[iconName] || 'tag';

  try {
    return (
      <FontAwesome5 
        name={validIconName} 
        size={14} 
        color="#8D6E63" 
        style={styles.icon} 
      />
    );
  } catch (error) {
    return (
      <FontAwesome5 
        name="tag" 
        size={14} 
        color="#8D6E63" 
        style={styles.icon} 
      />
    );
  }
});

export default function TagChip({ 
  label, 
  icon, 
  selected = false, 
  onPress, 
  style, 
  textStyle 
}: TagChipProps) {
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
      {icon && <SafeIcon iconName={icon} />}
      <Text
        style={[
          styles.text,
          selected ? styles.textSelected : styles.textUnselected,
          textStyle,
        ]}
        numberOfLines={1}
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
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 4,
  },
  selected: {
    backgroundColor: '#D4AF8C', // Un poco más oscuro cuando está seleccionado
    borderWidth: 2,
    borderColor: '#8D6E63',
  },
  unselected: {
    backgroundColor: '#E8D5B7', // Mismo color que las otras etiquetas
    borderWidth: 1,
    borderColor: '#E8D5B7',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  textSelected: {
    color: '#6B4423', // Más oscuro cuando está seleccionado
  },
  textUnselected: {
    color: '#6B4423', // Mismo color que las otras etiquetas
  },
  icon: {
    marginRight: 6,
  },
});
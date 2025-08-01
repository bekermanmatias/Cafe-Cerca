import React from 'react';
import { ScrollView, ViewStyle } from 'react-native';
import TagChip from './TagChip';

type Tag = {
  id: number;
  nombre: string;
  icono: string;
};

type FilterChipsProps = {
  items: Tag[];               // ahora recibe array de Tags
  selected: number[];         // ids seleccionados
  onSelect: (newSelected: number[]) => void;
  style?: ViewStyle;
};

export default function FilterChips({ items, selected, onSelect, style }: FilterChipsProps) {
  const toggleSelect = (itemId: number) => {
    if (selected.includes(itemId)) {
      onSelect(selected.filter(i => i !== itemId));
    } else {
      onSelect([...selected, itemId]);
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[{ marginVertical: 12 }, style]}
    >
      {items.map((item) => {
        const isSelected = selected.includes(item.id);
        return (
          <TagChip
            key={item.id}
            label={item.nombre}
            icon={item.icono}
            selected={isSelected}
            onPress={() => toggleSelect(item.id)}
          />
        );
      })}
    </ScrollView>
  );
}

import React from 'react';
import { ScrollView, ViewStyle } from 'react-native';
import TagChip from './TagChip';

type FilterChipsProps = {
  items: string[];
  selected: string[];
  onSelect: (newSelected: string[]) => void;
  style?: ViewStyle;
};

export default function FilterChips({ items, selected, onSelect, style }: FilterChipsProps) {
  const toggleSelect = (item: string) => {
    if (selected.includes(item)) {
      onSelect(selected.filter(i => i !== item));
    } else {
      onSelect([...selected, item]);
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[{ marginVertical: 12 }, style]}
    >
      {items.map((item, index) => {
        const isSelected = selected.includes(item);
        return (
            <TagChip
            key={index}
            label={item}
            selected={selected.includes(item)}
            onPress={() => toggleSelect(item)}
            />
        );
      })}
    </ScrollView>
  );
}

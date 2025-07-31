import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

type SearchBarProps = {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
};

export default function SearchBar({ placeholder = "Buscar...", value, onChangeText }: SearchBarProps) {
  return (
    <View style={styles.container}>
              <Ionicons name="search" size={20} color="#8D6E63" style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#aaa"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FCFAF7',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
});

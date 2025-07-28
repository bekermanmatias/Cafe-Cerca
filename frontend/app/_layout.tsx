import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { LogBox } from 'react-native';

// Ignorar advertencias específicas si son esperadas
LogBox.ignoreLogs([
  'Warning: Failed prop type',
  'Non-serializable values were found in the navigation state',
]);

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#8B4513',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="add-visit" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right'
          }} 
        />
        <Stack.Screen 
          name="edit-visit" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right'
          }} 
        />
        <Stack.Screen 
          name="visit-details" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right'
          }} 
        />
        <Stack.Screen 
          name="stats" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_bottom'
          }} 
        />
        <Stack.Screen 
          name="cafe/[id]" 
          options={{ 
            headerShown: false,
            animation: 'slide_from_right'
          }} 
        />
      </Stack>
    </ThemeProvider>
  );
}

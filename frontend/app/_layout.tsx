// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from '../context/AuthContext';

// Mantener la pantalla de splash visible mientras cargamos recursos
SplashScreen.preventAutoHideAsync();

// Ignorar advertencias específicas si son esperadas
LogBox.ignoreLogs([
  'Warning: Failed prop type',
  'Non-serializable values were found in the navigation state',
]);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'SpaceMono-Regular': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerTintColor: '#8D6E63',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          {/* Pantalla principal sin header */}
          <Stack.Screen name="index" options={{ headerShown: false }} />

          {/* Pantalla de autenticación */}
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />

          {/* Grupo de tabs */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          <Stack.Screen
            name="add-visit"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="edit-visit"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="visit-details"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="stats"
            options={{
              headerShown: false,
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="cafe/[id]"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
        </Stack>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </AuthProvider>
  );
}

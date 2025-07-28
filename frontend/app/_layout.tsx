// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack>
        {/* Pantalla principal sin header */}
        <Stack.Screen name="index" options={{ headerShown: false }} />

        {/* Pantalla de autenticación */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />

        {/* Grupo de tabs, sin header para que lo maneje el layout de tabs */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

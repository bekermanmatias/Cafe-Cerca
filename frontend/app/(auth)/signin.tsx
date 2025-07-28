// app/auth/signin.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      alert('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.login({ email, password });
      
      // Guardar el token y la información del usuario
      await AsyncStorage.setItem('userToken', response.token);
      await AsyncStorage.setItem('userData', JSON.stringify(response.user));
      
      // Redirigir al usuario a la pestaña explore
      router.replace('/(tabs)/explore');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      <Text style={styles.title}>Sign in</Text>
      <Text style={styles.subtitle}>Welcome back</Text>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={20} color="#A76F4D" style={styles.icon} />
          <TextInput
            placeholder="Email address"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={20} color="#A76F4D" style={styles.icon} />
          <TextInput
            placeholder="Password"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          onPress={() => router.push('./forgot-password')}
          style={styles.forgotLink}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <MaterialIcons name="arrow-forward" size={24} color="white" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>New member?</Text>
        <TouchableOpacity onPress={() => router.push('./signup')}>
          <Text style={styles.footerLink}> Sign up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  backButton: { marginBottom: 20 },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4B3A2F',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 40,
  },
  form: { gap: 16 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  icon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  forgotLink: { alignSelf: 'flex-end' },
  forgotText: { fontSize: 12, color: '#A76F4D', marginTop: 8 },
  button: {
    backgroundColor: '#A76F4D',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: { fontSize: 13, color: '#999' },
  footerLink: { fontSize: 13, color: '#A76F4D', fontWeight: '500' },
});

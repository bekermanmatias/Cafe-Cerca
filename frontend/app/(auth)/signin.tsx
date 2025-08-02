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
import LoadingSpinner from '../../components/LoadingSpinner';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function SignInScreen() {
  const router = useRouter();
  const { login } = useAuth();
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
      
      // Usar el contexto de autenticación para guardar el token y usuario
      await login(response.token, response.user);
      
      // Redirigir al usuario a la pestaña explore
      router.replace('/(tabs)/explore');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Iniciar Sesión</Text>
          <Text style={styles.subtitle}>Bienvenido de vuelta</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color="#8D6E63" style={styles.icon} />
            <TextInput
              placeholder="Correo electrónico"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color="#8D6E63" style={styles.icon} />
            <TextInput
              placeholder="Contraseña"
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
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Iniciar Sesión</Text>
                <MaterialIcons name="arrow-forward" size={20} color="white" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Nuevo usuario?</Text>
          <TouchableOpacity onPress={() => router.push('./signup')}>
            <Text style={styles.footerLink}> Regístrate</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      
      <LoadingSpinner 
        visible={loading} 
        message="Iniciando sesión..."
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    padding: 20,
    justifyContent: 'center',
  },
  backButton: { marginBottom: 20 },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#8D6E63',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: { gap: 16 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  icon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  forgotLink: { alignSelf: 'flex-end' },
      forgotText: { fontSize: 14, color: '#8D6E63', marginTop: 8, fontWeight: '500' },
  button: {
    backgroundColor: '#8D6E63',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerText: { fontSize: 13, color: '#999' },
      footerLink: { fontSize: 13, color: '#8D6E63', fontWeight: '500' },
});

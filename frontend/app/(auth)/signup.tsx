// app/auth/signup.tsx
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
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadingSpinner from '../../components/LoadingSpinner';
import { apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function SignUpScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      alert('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      // Registrar al usuario
      const registerResponse = await apiService.register({ name, email, password });
      
      // Hacer login automático usando el contexto
      await login(registerResponse.token, registerResponse.user);
      
      alert('¡Cuenta creada exitosamente!');
      // Redirigir al usuario a la pestaña explore
      router.replace('/(tabs)/explore');
    } catch (error) {
      console.error('Error de registro:', error);
      alert(error instanceof Error ? error.message : 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#8D6E63" />
        </TouchableOpacity>

        <Text style={styles.title}>Registro</Text>
        <Text style={styles.subtitle}>Crea tu cuenta aquí</Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={20} color="#8D6E63" style={styles.icon} />
            <TextInput
              placeholder="Nombre completo"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
          </View>

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

          <Text style={styles.terms}>
            Al registrarte aceptas nuestros{' '}
            <Text style={styles.link}>Términos de Uso</Text>
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handleSignUp}
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
          <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
          <TouchableOpacity onPress={() => router.push('./signin')}>
            <Text style={styles.footerLink}> Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      
      <LoadingSpinner 
        visible={loading} 
        message="Creando cuenta..."
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  backButton: { marginBottom: 20 },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#8D6E63',
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
  terms: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
      link: { color: '#8D6E63', fontWeight: '500' },
  button: {
    backgroundColor: '#8D6E63',
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
      footerLink: { fontSize: 13, color: '#8D6E63', fontWeight: '500' },
});

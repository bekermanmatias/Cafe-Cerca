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

        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete a nuestra comunidad</Text>
          </View>

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
            <Text style={styles.link}>Términos de Uso</Text> y{' '}
            <Text style={styles.link}>Política de Privacidad</Text>
          </Text>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Crear Cuenta</Text>
                <MaterialIcons name="arrow-forward" size={20} color="white" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
          <TouchableOpacity onPress={() => router.push('./signin')}>
            <Text style={styles.footerLink}> Inicia sesión</Text>
          </TouchableOpacity>
          </View>
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
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    padding: 20,
  },
  backButton: { marginBottom: 20 },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
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
  terms: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 18,
  },
      link: { color: '#8D6E63', fontWeight: '500' },
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

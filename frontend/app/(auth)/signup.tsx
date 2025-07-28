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

export default function SignUpScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password || !mobile) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, mobile }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Account created!');
        router.push('./signin');
      } else {
        alert(data.error || 'Something went wrong');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <MaterialIcons name="arrow-back" size={24} color="#A76F4D" />
      </TouchableOpacity>

      <Text style={styles.title}>Sign up</Text>
      <Text style={styles.subtitle}>Create an account here</Text>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <MaterialIcons name="person" size={20} color="#A76F4D" style={styles.icon} />
          <TextInput
            placeholder="Create an account here"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialIcons name="phone" size={20} color="#A76F4D" style={styles.icon} />
          <TextInput
            placeholder="Mobile number"
            style={styles.input}
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
          />
        </View>

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

        <Text style={styles.terms}>
          By signing up you agree with our{' '}
          <Text style={styles.link}>Terms of Use</Text>
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
        <Text style={styles.footerText}>Already a member?</Text>
        <TouchableOpacity onPress={() => router.push('./signin')}>
          <Text style={styles.footerLink}> Sign in</Text>
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
  terms: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  link: { color: '#A76F4D', fontWeight: '500' },
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

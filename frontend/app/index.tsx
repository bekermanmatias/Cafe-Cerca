// app/index.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🌳</Text>
        </View>
        <Text style={styles.brandName}>Café Cerca</Text>
      </View>

      <View style={styles.middleSection}>
        <Text style={styles.title}>Feel yourself like{"\n"}a barista!</Text>
        <Text style={styles.subtitle}>Magic coffee on order.</Text>
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/(auth)')}
      >
        <Text style={styles.buttonText}>→</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const BROWN = '#9B6B50'; // Marrón similar a la imagen
const WHITE = '#FFFFFF';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WHITE,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'space-between',
  },

  topSection: {
    backgroundColor: BROWN,
    paddingVertical: 70,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },

  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  logoEmoji: {
    fontSize: 50,
  },

  brandName: {
    color: WHITE,
    fontSize: 30,
    fontStyle: 'italic',
    fontWeight: '300',
    fontFamily: 'Cochin', // si usas fuentes nativas, para simular manuscrita
  },

  middleSection: {
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    lineHeight: 36,
  },

  subtitle: {
    fontSize: 16,
    color: '#AAA',
    marginTop: 8,
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: '300',
  },

  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DDD',
    marginHorizontal: 5,
  },

  activeDot: {
    width: 25,
    backgroundColor: BROWN,
  },

  button: {
    backgroundColor: BROWN,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    color: WHITE,
    fontSize: 28,
    fontWeight: '700',
  },
});

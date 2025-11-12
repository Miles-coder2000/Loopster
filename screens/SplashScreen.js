// screens/SplashScreen.js
import React, { useEffect } from 'react';
import { View, Image, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const t = setTimeout(() => navigation.replace('Home'), 1200);
    return () => clearTimeout(t);
  }, [navigation]);

  return (
    <LinearGradient colors={[Colors.background, Colors.deepShadow]} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Image source={require('../assets/Logo.png')} style={styles.logo} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo: { width: 220, height: 80, resizeMode: 'contain' },
});

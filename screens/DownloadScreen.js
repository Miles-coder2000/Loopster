import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DownloadScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Download Screen (Coming Soon)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center' },
  text: { color: '#FFFFFF', fontSize: 18 },
});

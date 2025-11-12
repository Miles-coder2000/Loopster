// src/components/PlaylistItem.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';

export default function PlaylistItem({ playlist }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{playlist.name}</Text>
      <Text style={styles.count}>{playlist.songs.length} songs</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    marginVertical: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 8,
  },
  title: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  count: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
});

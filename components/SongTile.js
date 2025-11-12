import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';

export default function SongTile({ song, onPress }) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={require('../assets/music-note.png')} style={styles.image} />
      <Text style={styles.name} numberOfLines={1}>{song.name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    backgroundColor: Colors.deepShadow,
    padding: 10,
    borderRadius: 10,
  },
  image: { width: 50, height: 50, marginRight: 15, borderRadius: 5 },
  name: { color: Colors.text, fontSize: 16, flex: 1 },
});

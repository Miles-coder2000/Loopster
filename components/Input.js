import React from 'react';
import { TextInput, StyleSheet } from 'react-native';
import Colors from '../constants/Colors';

export default function Input({ value, onChangeText, placeholder, style, secureTextEntry }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.text}
      secureTextEntry={secureTextEntry}
      style={[styles.input, style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#1E1E1E',
    color: Colors.text,
    marginVertical: 8,
  },
});

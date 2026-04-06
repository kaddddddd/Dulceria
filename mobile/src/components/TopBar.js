import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function TopBar() {
  const insets = useSafeAreaInsets();
  const { C, isDark, toggle } = useTheme();

  return (
    <View style={[{ backgroundColor: C.moradoClaro, paddingTop: insets.top + 8, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: isDark ? '#E9D5FF' : '#5B21B6', fontSize: 26, fontWeight: '800', fontStyle: 'italic', letterSpacing: 1, flex: 1, textAlign: 'center' }}>
        Dulces KAV
      </Text>
      <TouchableOpacity onPress={toggle} style={{ position: 'absolute', right: 20, top: insets.top + 10 }}>
        <Text style={{ fontSize: 22 }}>{isDark ? '☀️' : '🌙'}</Text>
      </TouchableOpacity>
    </View>
  );
}

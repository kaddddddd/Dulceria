import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TopBar() {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={['#C084FC', '#A855F7', '#818CF8']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[s.bar, { paddingTop: insets.top + 8 }]}
    >
      <View>
        <Text style={s.subtitle}>🍬 Mi Negocio</Text>
        <Text style={s.title}>Dulces KAV</Text>
      </View>
      <Text style={s.candy}>🍭</Text>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16,
  },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  title: { color: '#fff', fontSize: 26, fontWeight: '800', fontStyle: 'italic' },
  candy: { fontSize: 32 },
});

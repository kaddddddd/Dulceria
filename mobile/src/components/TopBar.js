import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../theme';

export default function TopBar() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.bar, { paddingTop: insets.top + 8 }]}>
      <Text style={s.title}>Dulces KAV</Text>
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    backgroundColor: C.moradoClaro,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    color: '#5B21B6',
    fontSize: 26,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
});

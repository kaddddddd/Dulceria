import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { C } from '../theme';

export default function Toast({ message, type = 'success', onClose }) {
  const opacity = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(onClose);
    }, 2800);
    return () => clearTimeout(t);
  }, []);

  const bg = type === 'success' ? '#ECFDF5' : '#FEF2F2';
  const border = type === 'success' ? C.verde : C.rojo;
  const textColor = type === 'success' ? '#065F46' : '#991B1B';
  const icon = type === 'success' ? '✅' : '❌';

  return (
    <Animated.View style={[s.toast, { opacity, borderLeftColor: border, backgroundColor: bg }]}>
      <Text style={[s.text, { color: textColor }]}>{icon} {message}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  toast: {
    position: 'absolute', top: 12, left: 16, right: 16, zIndex: 999,
    borderRadius: 12, padding: 14, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 6,
  },
  text: { fontWeight: '700', fontSize: 14 },
});

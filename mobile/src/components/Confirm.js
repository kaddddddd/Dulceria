import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { C } from '../theme';

export default function Confirm({ message, onConfirm, onCancel }) {
  return (
    <Modal transparent animationType="slide" visible>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <Text style={s.message}>{message}</Text>
          <View style={s.row}>
            <TouchableOpacity style={[s.btn, s.ghost]} onPress={onCancel}>
              <Text style={s.ghostText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, s.danger]} onPress={onConfirm}>
              <Text style={s.dangerText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(45,27,46,0.5)',
    justifyContent: 'flex-end', alignItems: 'center',
  },
  sheet: {
    width: '100%', backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24,
  },
  message: { fontWeight: '700', fontSize: 16, textAlign: 'center', marginBottom: 20, color: C.text },
  row: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  ghost: { borderWidth: 1.5, borderColor: C.border },
  danger: { backgroundColor: C.rojo },
  ghostText: { fontWeight: '700', color: C.text },
  dangerText: { fontWeight: '700', color: '#fff' },
});

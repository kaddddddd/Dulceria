import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function Confirm({ message, onConfirm, onCancel }) {
  const { C } = useTheme();
  return (
    <Modal transparent animationType="slide" visible>
      <View style={{ flex: 1, backgroundColor: 'rgba(45,27,46,0.5)', justifyContent: 'flex-end', alignItems: 'center' }}>
        <View style={{ width: '100%', backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
          <Text style={{ fontWeight: '700', fontSize: 16, textAlign: 'center', marginBottom: 20, color: C.text }}>{message}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: C.border }} onPress={onCancel}>
              <Text style={{ fontWeight: '700', color: C.text }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: C.rojo }} onPress={onConfirm}>
              <Text style={{ fontWeight: '700', color: '#fff' }}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

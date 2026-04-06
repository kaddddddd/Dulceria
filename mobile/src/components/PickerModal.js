import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function PickerModal({ options, value, onChange, placeholder = '— Selecciona —' }) {
  const [open, setOpen] = useState(false);
  const { C } = useTheme();
  const label = options.find(o => String(o.value) === String(value))?.label || placeholder;
  const isEmpty = value === '' || value === null || value === undefined;

  return (
    <>
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: C.surface }}
        onPress={() => setOpen(true)}
      >
        <Text style={{ fontSize: 14, color: isEmpty ? C.textMuted : C.text, flex: 1 }}>{label}</Text>
        <Text style={{ fontSize: 14, color: C.textMuted, marginLeft: 8 }}>▾</Text>
      </TouchableOpacity>

      <Modal transparent animationType="slide" visible={open} onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={{ backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%', padding: 16 }}>
            <Text style={{ fontWeight: '800', fontSize: 15, color: C.text, marginBottom: 12, textAlign: 'center' }}>Selecciona una opción</Text>
            <FlatList
              data={[{ value: '', label: placeholder }, ...options]}
              keyExtractor={item => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{ paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: String(item.value) === String(value) ? C.lilaPalido : 'transparent' }}
                  onPress={() => { onChange(item.value); setOpen(false); }}
                >
                  <Text style={{ fontSize: 15, color: String(item.value) === String(value) ? C.morado : C.text, fontWeight: String(item.value) === String(value) ? '700' : '400' }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

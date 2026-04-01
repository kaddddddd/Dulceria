import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { C } from '../theme';

export default function PickerModal({ options, value, onChange, placeholder = '— Selecciona —' }) {
  const [open, setOpen] = useState(false);
  const label = options.find(o => String(o.value) === String(value))?.label || placeholder;
  const isEmpty = value === '' || value === null || value === undefined;

  return (
    <>
      <TouchableOpacity style={s.trigger} onPress={() => setOpen(true)}>
        <Text style={[s.triggerText, isEmpty && { color: C.textMuted }]}>{label}</Text>
        <Text style={s.arrow}>▾</Text>
      </TouchableOpacity>

      <Modal transparent animationType="slide" visible={open} onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={s.sheet}>
            <Text style={s.sheetTitle}>Selecciona una opción</Text>
            <FlatList
              data={[{ value: '', label: placeholder }, ...options]}
              keyExtractor={item => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.option, String(item.value) === String(value) && s.optionActive]}
                  onPress={() => { onChange(item.value); setOpen(false); }}
                >
                  <Text style={[s.optionText, String(item.value) === String(value) && s.optionTextActive]}>
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

const s = StyleSheet.create({
  trigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff',
  },
  triggerText: { fontSize: 14, color: C.text, flex: 1 },
  arrow: { fontSize: 14, color: C.textMuted, marginLeft: 8 },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '60%', padding: 16,
  },
  sheetTitle: { fontWeight: '800', fontSize: 15, color: C.text, marginBottom: 12, textAlign: 'center' },
  option: { paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  optionActive: { backgroundColor: C.lilaPalido },
  optionText: { fontSize: 15, color: C.text },
  optionTextActive: { color: C.morado, fontWeight: '700' },
});

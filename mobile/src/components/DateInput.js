import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { C } from '../theme';

// value: 'YYYY-MM-DD' string
// onChange: (newValue: 'YYYY-MM-DD') => void
export default function DateInput({ value, onChange, label }) {
  const [show, setShow] = useState(false);

  const date = value ? new Date(value + 'T12:00:00') : new Date();

  function handleChange(event, selected) {
    setShow(Platform.OS === 'ios');
    if (selected) {
      const y = selected.getFullYear();
      const m = String(selected.getMonth() + 1).padStart(2, '0');
      const d = String(selected.getDate()).padStart(2, '0');
      onChange(`${y}-${m}-${d}`);
    }
  }

  const display = value
    ? new Date(value + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Seleccionar fecha';

  return (
    <View>
      <TouchableOpacity style={s.btn} onPress={() => setShow(true)}>
        <Text style={s.icon}>📅</Text>
        <Text style={[s.text, !value && { color: C.textMuted }]}>{display}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          locale="es-CO"
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff',
  },
  icon: { fontSize: 16 },
  text: { fontSize: 14, color: C.text },
});

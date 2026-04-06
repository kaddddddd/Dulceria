import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';

// value: 'YYYY-MM-DD' string
// onChange: (newValue: 'YYYY-MM-DD') => void
export default function DateInput({ value, onChange }) {
  const [show, setShow] = useState(false);
  const { C } = useTheme();

  // Normaliza el valor a solo YYYY-MM-DD sin importar si viene con hora
  const cleanValue = value ? value.split('T')[0] : null;
  const date = cleanValue ? new Date(cleanValue + 'T12:00:00') : new Date();

  function handleChange(event, selected) {
    setShow(Platform.OS === 'ios');
    if (selected) {
      const y = selected.getFullYear();
      const m = String(selected.getMonth() + 1).padStart(2, '0');
      const d = String(selected.getDate()).padStart(2, '0');
      onChange(`${y}-${m}-${d}`);
    }
  }

  const display = cleanValue
    ? new Date(cleanValue + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Seleccionar fecha';

  return (
    <View>
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: C.surface }}
        onPress={() => setShow(true)}
      >
        <Text style={{ fontSize: 16 }}>📅</Text>
        <Text style={{ fontSize: 14, color: cleanValue ? C.text : C.textMuted }}>{display}</Text>
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

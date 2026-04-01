import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { dashboardService } from '../services/api';
import { C, fmt } from '../theme';

function mesActual() {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
  const fin = hoy.toISOString().split('T')[0];
  return { inicio, fin };
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fechas, setFechas] = useState(mesActual);

  useEffect(() => {
    setLoading(true);
    setError('');
    dashboardService.get({ fecha_inicio: fechas.inicio, fecha_fin: fechas.fin })
      .then(setData)
      .catch(() => setError('No se pudo cargar el dashboard'))
      .finally(() => setLoading(false));
  }, [fechas]);

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color={C.morado} />
      <Text style={s.loadingText}>Cargando resumen...</Text>
    </View>
  );

  if (error) return (
    <View style={s.center}>
      <Text style={{ fontSize: 40 }}>😕</Text>
      <Text style={s.errorText}>{error}</Text>
    </View>
  );

  if (!data) return null;

  const { resumen, productos_bajo_stock, top_productos, top_vendedores } = data;

  return (
    <ScrollView style={s.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
      {/* Saludo */}
      <View style={{ marginBottom: 16 }}>
        <Text style={s.dateText}>
          Hoy, {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        <Text style={s.welcome}>¡Bienvenida! 🍬</Text>
      </View>

      {/* Filtro de fechas */}
      <View style={[s.card, { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }]}>
        <View>
          <Text style={s.label}>Desde</Text>
          <Text style={s.dateVal}>{fechas.inicio}</Text>
        </View>
        <View>
          <Text style={s.label}>Hasta</Text>
          <Text style={s.dateVal}>{fechas.fin}</Text>
        </View>
        <TouchableOpacity style={s.mesBtn} onPress={() => setFechas(mesActual())}>
          <Text style={s.mesBtnText}>Este mes</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={s.grid}>
        <View style={[s.statCard, { backgroundColor: '#FFF0F9', borderColor: C.rosa }]}>
          <Text style={s.statIcon}>💰</Text>
          <Text style={s.statLabel}>Ventas</Text>
          <Text style={s.statValue}>{fmt(resumen.total_ventas)}</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: '#FFF5F5', borderColor: C.rojo }]}>
          <Text style={s.statIcon}>📤</Text>
          <Text style={s.statLabel}>Gastos</Text>
          <Text style={s.statValue}>{fmt(resumen.total_gastos)}</Text>
        </View>
      </View>

      <View style={[s.card, { backgroundColor: '#F0FDF4', borderColor: C.verde, marginBottom: 8 }]}>
        <Text style={s.statIcon}>📈</Text>
        <Text style={s.statLabel}>Ganancia neta</Text>
        <Text style={[s.statValue, { fontSize: 22, color: '#065F46' }]}>{fmt(resumen.ganancia_neta)}</Text>
        <Text style={{ fontSize: 11, color: C.textMuted }}>{fechas.inicio} → {fechas.fin}</Text>
      </View>

      <View style={s.grid}>
        <View style={[s.statCard, { backgroundColor: C.lilaPalido, borderColor: C.moradoClaro }]}>
          <Text style={s.statIcon}>🛒</Text>
          <Text style={s.statLabel}>Nº Ventas</Text>
          <Text style={s.statValue}>{resumen.num_ventas}</Text>
        </View>
        <View style={[s.statCard, { borderColor: productos_bajo_stock.length > 0 ? C.rojo : C.border }]}>
          <Text style={s.statIcon}>⚠️</Text>
          <Text style={s.statLabel}>Stock bajo</Text>
          <Text style={[s.statValue, { color: productos_bajo_stock.length > 0 ? C.rojo : C.verde }]}>
            {productos_bajo_stock.length}
          </Text>
        </View>
      </View>

      {/* Stock bajo */}
      {productos_bajo_stock.length > 0 && (
        <View style={[s.card, { borderColor: C.rojo, borderWidth: 2, backgroundColor: '#FFF8F8' }]}>
          <Text style={s.panelTitle}>⚠️ Stock bajo — requiere reposición</Text>
          {productos_bajo_stock.map(p => (
            <View key={p.id} style={s.row}>
              <Text style={s.itemName}>{p.nombre}</Text>
              <View style={[s.badge, { backgroundColor: '#FEE2E2' }]}>
                <Text style={{ color: C.rojo, fontWeight: '700', fontSize: 12 }}>{p.stock} unid.</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Top productos */}
      {top_productos.length > 0 && (
        <View style={s.card}>
          <Text style={s.panelTitle}>🏆 Top productos (este mes)</Text>
          {top_productos.map((p, i) => (
            <View key={i} style={s.row}>
              <View>
                <Text style={s.itemName}>{['🥇','🥈','🥉','4️⃣','5️⃣'][i]} {p.nombre}</Text>
                <Text style={s.itemSub}>{p.total_vendido} unidades</Text>
              </View>
              <Text style={[s.amount, { color: C.verde }]}>{fmt(p.ingresos)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Top vendedores */}
      {top_vendedores.length > 0 && (
        <View style={s.card}>
          <Text style={s.panelTitle}>👑 Rendimiento vendedoras</Text>
          {top_vendedores.map((v, i) => (
            <View key={i} style={s.row}>
              <View>
                <Text style={s.itemName}>{v.nombre}</Text>
                <Text style={s.itemSub}>{v.num_ventas} ventas realizadas</Text>
              </View>
              <Text style={[s.amount, { color: C.morado }]}>{fmt(v.total)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: C.textMuted, fontSize: 14 },
  errorText: { color: C.rojo, fontWeight: '700' },
  dateText: { fontSize: 13, color: C.textMuted, fontWeight: '700' },
  welcome: { fontSize: 20, fontWeight: '900', marginTop: 2, color: C.text },
  card: {
    backgroundColor: C.surface, borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1.5, borderColor: C.border,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  statCard: {
    flex: 1, borderRadius: 16, padding: 14, borderWidth: 1.5,
    borderColor: C.border, backgroundColor: C.surface,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, marginBottom: 4,
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statLabel: { fontSize: 12, color: C.textMuted, fontWeight: '600' },
  statValue: { fontSize: 16, fontWeight: '900', color: C.text, marginTop: 2 },
  panelTitle: { fontWeight: '800', fontSize: 14, color: C.morado, marginBottom: 10 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  itemName: { fontWeight: '700', fontSize: 14, color: C.text },
  itemSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  amount: { fontWeight: '800', fontSize: 14 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  label: { fontSize: 11, color: C.textMuted, fontWeight: '700' },
  dateVal: { fontSize: 13, color: C.text, fontWeight: '600' },
  mesBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg,
  },
  mesBtnText: { fontSize: 13, fontWeight: '700', color: C.text },
});

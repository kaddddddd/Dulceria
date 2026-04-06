import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { repartoService, retirosService, vendedoresService } from '../services/api';
import PickerModal from '../components/PickerModal';
import DateInput from '../components/DateInput';
import Toast from '../components/Toast';
import Confirm from '../components/Confirm';
import { useTheme } from '../context/ThemeContext';
import { fmt } from '../theme';

function mesActual() {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
  const fin = hoy.toISOString().split('T')[0];
  return { inicio, fin };
}

const LS_DUENA = 'reparto_vendedor_duena_id';

export default function Reparto() {
  const { C } = useTheme();
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [fechas,     setFechas]     = useState(mesActual);
  const [vendedores, setVendedores] = useState([]);
  const [vendDuena,  setVendDuena]  = useState('');
  const [form,       setForm]       = useState({ persona: '', monto: '', concepto: '', fecha: new Date().toISOString().split('T')[0] });
  const [saving,     setSaving]     = useState(false);
  const [fError,     setFError]     = useState('');
  const [confirmId,  setConfirmId]  = useState(null);
  const [toast,      setToast]      = useState(null);
  const s = makeStyles(C);

  function showToast(msg, type = 'success') { setToast({ message: msg, type }); }

  useEffect(() => {
    AsyncStorage.getItem(LS_DUENA).then(v => { if (v) setVendDuena(v); });
    vendedoresService.getAll().then(lista => {
      setVendedores(lista);
      setForm(f => ({ ...f, persona: f.persona || (lista[0]?.nombre ?? '') }));
    }).catch(() => {});
  }, []);

  const cargar = useCallback(() => {
    setLoading(true); setError('');
    const params = { fecha_inicio: fechas.inicio, fecha_fin: fechas.fin };
    if (vendDuena) params.duena_id = vendDuena;
    repartoService.get(params).then(setData).catch(() => setError('No se pudo cargar el reparto')).finally(() => setLoading(false));
  }, [fechas, vendDuena]);

  useEffect(() => { cargar(); }, [cargar]);

  async function handleVendDuenaChange(val) {
    setVendDuena(val || '');
    if (val) await AsyncStorage.setItem(LS_DUENA, String(val));
    else await AsyncStorage.removeItem(LS_DUENA);
  }

  async function handleAgregarRetiro() {
    if (!form.persona)                          { setFError('Selecciona una persona'); return; }
    if (!form.monto || Number(form.monto) <= 0) { setFError('El monto debe ser mayor a 0'); return; }
    setSaving(true); setFError('');
    try {
      await retirosService.create({ ...form, monto: Number(form.monto) });
      setForm(f => ({ ...f, monto: '', concepto: '' }));
      showToast('Retiro registrado'); cargar();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  }

  async function handleRetirarPropios() {
    const monto = Math.round(data?.propios?.ingresos || 0);
    if (!monto) return;
    setSaving(true);
    try {
      await retirosService.create({ persona: nombreDuena, monto, concepto: 'Ganancias productos propios', fecha: new Date().toISOString().split('T')[0] });
      showToast(`Retiro registrado — ${fmt(monto)}`); cargar();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setSaving(false); }
  }

  async function handleEliminar() {
    try { await retirosService.delete(confirmId); setConfirmId(null); showToast('Retiro eliminado'); cargar(); }
    catch { setConfirmId(null); showToast('No se pudo eliminar', 'error'); }
  }

  const nombreDuena    = vendedores.find(v => String(v.id) === String(vendDuena))?.nombre || 'Dueña';
  const nombreVendedor = vendedores.find(v => String(v.id) !== String(vendDuena))?.nombre || 'Vendedora';
  const hayDatos       = data && (data.propios.ingresos > 0 || data.general.ventas > 0);
  const vendOptions    = vendedores.map(v => ({ value: v.id, label: v.nombre }));

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {confirmId && <Confirm message="¿Eliminar este retiro?" onConfirm={handleEliminar} onCancel={() => setConfirmId(null)} />}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View style={{ marginBottom: 16 }}>
          <Text style={s.pageTitle}>Reparto de ganancias 💵</Text>
          <Text style={s.subtitle}>Productos propios 100% · Resto 50 / 50</Text>
        </View>

        <View style={[s.card, { backgroundColor: C.lilaPalido, borderColor: C.moradoClaro }]}>
          <Text style={s.panelTitle}>⚙️ Configuración</Text>
          <Text style={s.label}>¿Quién es la dueña?</Text>
          <PickerModal options={vendOptions} value={vendDuena} onChange={handleVendDuenaChange} placeholder="— Selecciona —" />
          {data && !data.tiene_propios && (
            <View style={s.infoBox}>
              <Text style={s.infoText}>ℹ️ No hay productos propios. En <Text style={{ fontWeight: '700' }}>Inventario</Text> puedes asignar productos a una persona.</Text>
            </View>
          )}
          {data && data.tiene_propios && (
            <View style={s.successBox}>
              <Text style={s.successText}>✅ {data.productos_propios.length} producto{data.productos_propios.length > 1 ? 's propios' : ' propio'} — sus ventas van 100% a su propietaria.</Text>
            </View>
          )}
        </View>

        <View style={s.card}>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Desde</Text>
              <DateInput value={fechas.inicio} onChange={v => setFechas(f => ({ ...f, inicio: v }))} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Hasta</Text>
              <DateInput value={fechas.fin} onChange={v => setFechas(f => ({ ...f, fin: v }))} />
            </View>
          </View>
          <TouchableOpacity style={s.mesBtn} onPress={() => setFechas(mesActual())}>
            <Text style={s.mesBtnText}>Este mes</Text>
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          <Text style={s.panelTitle}>Registrar retiro de caja</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Persona</Text>
              <PickerModal options={vendOptions} value={form.persona} onChange={v => { const nombre = vendedores.find(vd => String(vd.id) === String(v))?.nombre || ''; setForm(f => ({ ...f, persona: nombre })); }} placeholder="— Selecciona —" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Monto</Text>
              <TextInput style={s.input} placeholder="0" keyboardType="numeric" placeholderTextColor={C.textMuted} value={form.monto} onChangeText={v => setForm(f => ({ ...f, monto: v }))} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Concepto (opcional)</Text>
              <TextInput style={s.input} placeholder="Ej: adelanto semana" placeholderTextColor={C.textMuted} value={form.concepto} onChangeText={v => setForm(f => ({ ...f, concepto: v }))} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Fecha</Text>
              <DateInput value={form.fecha} onChange={v => setForm(f => ({ ...f, fecha: v }))} />
            </View>
          </View>
          {fError ? <View style={s.errorBox}><Text style={s.errorText}>⚠️ {fError}</Text></View> : null}
          <TouchableOpacity style={[s.btnPrimary, { marginTop: 12 }]} onPress={handleAgregarRetiro} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnPrimaryText}>➕ Registrar retiro</Text>}
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <ActivityIndicator size="large" color={C.morado} />
            <Text style={{ color: C.textMuted, marginTop: 8 }}>Calculando reparto...</Text>
          </View>
        )}
        {error && <View style={s.card}><Text style={{ color: C.rojo, textAlign: 'center' }}>{error}</Text></View>}

        {data && !loading && (
          !hayDatos ? (
            <View style={[s.card, { backgroundColor: C.lilaPalido, alignItems: 'center', padding: 32 }]}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>📭</Text>
              <Text style={{ fontWeight: '700', fontSize: 15, color: C.text }}>Sin ventas en este período</Text>
              <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Cuando haya ventas registradas aquí aparecerá el reparto.</Text>
            </View>
          ) : (
            <>
              {data.tiene_propios && (
                <View style={[s.card, { borderColor: C.moradoClaro, borderWidth: 2, backgroundColor: C.lilaPalido }]}>
                  <Text style={s.panelTitle}>⭐ Productos propios — 100% {nombreDuena}</Text>
                  {data.productos_propios.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      {data.productos_propios.map(p => (
                        <View key={p.id} style={s.badge}><Text style={s.badgeText}>{p.nombre}</Text></View>
                      ))}
                    </View>
                  )}
                  <View style={s.rowBetween}>
                    <Text style={{ fontSize: 14, color: C.text }}>Ingresos de productos propios</Text>
                    <Text style={{ fontWeight: '800', color: C.morado, fontSize: 16 }}>{fmt(data.propios.ingresos)}</Text>
                  </View>
                  {data.propios.ingresos > 0 && (
                    <TouchableOpacity style={[s.btnMorado, { marginTop: 12 }]} onPress={handleRetirarPropios} disabled={saving}>
                      <Text style={s.btnPrimaryText}>Retirar todo ({fmt(data.propios.ingresos)})</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View style={s.card}>
                <Text style={s.panelTitle}>📊 Ganancia general · 50 / 50</Text>
                <View style={s.rowBetween}>
                  <Text style={{ fontSize: 14, color: C.text }}>Ventas generales</Text>
                  <Text style={{ fontWeight: '700', color: C.text }}>{fmt(data.general.ventas)}</Text>
                </View>
                <View style={[s.rowBetween, { marginTop: 8 }]}>
                  <Text style={{ fontSize: 14, color: C.textMuted }}>📤 Gastos (se reinvierte)</Text>
                  <Text style={{ fontWeight: '700', color: C.textMuted }}>− {fmt(data.general.gastos)}</Text>
                </View>
                <View style={[s.rowBetween, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border }]}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>💰 Ganancia a dividir</Text>
                  <Text style={{ fontWeight: '800', fontSize: 16, color: data.general.ganancia >= 0 ? C.verde : C.rojo }}>{fmt(data.general.ganancia)}</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                <View style={[s.statCard, { backgroundColor: C.lilaPalido, borderColor: C.verde }]}>
                  <Text style={s.statName}>{nombreDuena}</Text>
                  <Text style={s.statSub}>{data.tiene_propios ? 'Propios + 50% general' : '50% general'}</Text>
                  <Text style={s.statAmount}>{fmt(data.distribucion.dueno.bruto)}</Text>
                  <Text style={{ fontSize: 12, color: C.text }}>Retirado: <Text style={{ color: C.rojo, fontWeight: '700' }}>{fmt(data.distribucion.dueno.retirado)}</Text></Text>
                  <View style={{ borderTopWidth: 1, borderTopColor: C.border, marginTop: 6, paddingTop: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: C.verde }}>Pendiente: {fmt(data.distribucion.dueno.pendiente)}</Text>
                  </View>
                </View>
                <View style={[s.statCard, { backgroundColor: C.lilaPalido, borderColor: C.moradoClaro }]}>
                  <Text style={s.statName}>{nombreVendedor}</Text>
                  <Text style={s.statSub}>50% general</Text>
                  <Text style={s.statAmount}>{fmt(data.distribucion.vendedor.bruto)}</Text>
                  <Text style={{ fontSize: 12, color: C.text }}>Retirado: <Text style={{ color: C.rojo, fontWeight: '700' }}>{fmt(data.distribucion.vendedor.retirado)}</Text></Text>
                  <View style={{ borderTopWidth: 1, borderTopColor: C.border, marginTop: 6, paddingTop: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: C.morado }}>Pendiente: {fmt(data.distribucion.vendedor.pendiente)}</Text>
                  </View>
                </View>
              </View>

              {data.historial.length > 0 && (
                <View style={s.card}>
                  <Text style={s.panelTitle}>Historial de retiros</Text>
                  {data.historial.map(r => (
                    <View key={r.id} style={[s.rowBetween, { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border }]}>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={s.badge}><Text style={s.badgeText}>{r.persona}</Text></View>
                          {r.concepto ? <Text style={{ fontSize: 13, color: C.text }}>· {r.concepto}</Text> : null}
                        </View>
                        <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{r.fecha?.split('T')[0] || r.fecha}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={{ fontWeight: '800', color: C.rojo }}>−{fmt(r.monto)}</Text>
                        <TouchableOpacity style={s.iconBtn} onPress={() => setConfirmId(r.id)}><Text>🗑️</Text></TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(C) {
  return StyleSheet.create({
    pageTitle: { fontSize: 20, fontWeight: '900', color: C.text },
    subtitle: { fontSize: 13, color: C.textMuted, marginTop: 2 },
    card: { backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: C.border, elevation: 2 },
    panelTitle: { fontWeight: '800', fontSize: 14, color: C.morado, marginBottom: 10 },
    label: { fontSize: 12, fontWeight: '700', color: C.textMuted, marginBottom: 6, marginTop: 8 },
    input: { borderWidth: 1.5, borderColor: C.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: C.surface, color: C.text },
    btnPrimary: { backgroundColor: C.morado, padding: 14, borderRadius: 12, alignItems: 'center' },
    btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    btnMorado: { backgroundColor: C.morado, padding: 10, borderRadius: 10, alignItems: 'center' },
    mesBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg, alignSelf: 'flex-start' },
    mesBtnText: { fontSize: 13, fontWeight: '700', color: C.text },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statCard: { flex: 1, borderRadius: 16, padding: 14, borderWidth: 1.5, gap: 4 },
    statName: { fontWeight: '800', fontSize: 15, color: C.text },
    statSub: { fontSize: 11, color: C.textMuted },
    statAmount: { fontSize: 18, fontWeight: '800', color: C.text, marginTop: 4 },
    badge: { backgroundColor: C.lilaPalido, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    badgeText: { fontSize: 12, color: C.morado, fontWeight: '700' },
    iconBtn: { padding: 8, borderRadius: 8, backgroundColor: C.lilaPalido },
    infoBox: { marginTop: 10, backgroundColor: '#FFF9E6', borderWidth: 1, borderColor: '#FCD34D', borderRadius: 8, padding: 10 },
    infoText: { fontSize: 13, color: '#92400E' },
    successBox: { marginTop: 10, backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#6EE7B7', borderRadius: 8, padding: 10 },
    successText: { fontSize: 13, color: '#065F46' },
    errorBox: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 10, marginTop: 8 },
    errorText: { color: C.rojo, fontWeight: '600', fontSize: 13 },
  });
}

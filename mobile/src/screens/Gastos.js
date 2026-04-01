import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator,
} from 'react-native';
import { gastosService, categoriasGastosService } from '../services/api';
import PickerModal from '../components/PickerModal';
import DateInput from '../components/DateInput';
import Toast from '../components/Toast';
import Confirm from '../components/Confirm';
import { C, fmt } from '../theme';

const hoy = new Date().toISOString().split('T')[0];
const EMPTY = { descripcion: '', monto: '', fecha: hoy, categoria_id: '' };

function mesActualStr() {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}`;
}

function mesLabel(mes) {
  return new Date(mes + '-02').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}

function prevMes(mes) {
  const [y, m] = mes.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function nextMes(mes) {
  const [y, m] = mes.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function Gastos() {
  const [gastos,      setGastos]      = useState([]);
  const [categorias,  setCategorias]  = useState([]);
  const [form,        setForm]        = useState(EMPTY);
  const [editId,      setEditId]      = useState(null);
  const [showForm,    setShowForm]    = useState(false);
  const [toast,       setToast]       = useState(null);
  const [confirmId,   setConfirmId]   = useState(null);
  const [confirmCat,  setConfirmCat]  = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [mes,         setMes]         = useState(mesActualStr);
  const [nuevaCat,    setNuevaCat]    = useState('');
  const [showCatForm, setShowCatForm] = useState(false);

  function showToast(msg, type = 'success') { setToast({ message: msg, type }); }

  function loadCategorias() {
    return categoriasGastosService.getAll().then(setCategorias).catch(() => {});
  }

  function loadGastos() {
    const [anio, month] = mes.split('-');
    const inicio = `${anio}-${month}-01`;
    const ultimo = new Date(Number(anio), Number(month), 0).getDate();
    const fin    = `${anio}-${month}-${ultimo}`;
    return gastosService.getAll({ fecha_inicio: inicio, fecha_fin: fin })
      .then(setGastos)
      .catch(() => showToast('Error al cargar gastos', 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadCategorias(); }, []);
  useEffect(() => { setLoading(true); loadGastos(); }, [mes]);

  async function handleCrearCategoria() {
    if (!nuevaCat.trim()) return;
    try {
      await categoriasGastosService.create({ nombre: nuevaCat.trim() });
      setNuevaCat('');
      setShowCatForm(false);
      showToast('Categoría creada');
      loadCategorias();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleEliminarCategoria() {
    try {
      await categoriasGastosService.delete(confirmCat);
      setConfirmCat(null);
      showToast('Categoría eliminada');
      loadCategorias();
      loadGastos();
    } catch {
      setConfirmCat(null);
      showToast('No se pudo eliminar', 'error');
    }
  }

  function handleEdit(g) {
    setForm({
      descripcion: g.descripcion,
      monto: String(g.monto),
      fecha: g.fecha?.split('T')[0] || hoy,
      categoria_id: g.categoria_id ? String(g.categoria_id) : '',
    });
    setEditId(g.id);
    setShowForm(true);
  }

  function handleCancel() { setForm(EMPTY); setEditId(null); setShowForm(false); }

  async function handleSubmit() {
    if (!form.descripcion || !form.monto || !form.fecha) {
      showToast('Completa todos los campos', 'error'); return;
    }
    setSaving(true);
    try {
      const payload = {
        descripcion: form.descripcion,
        monto: Number(form.monto),
        fecha: form.fecha,
        categoria_id: form.categoria_id || null,
      };
      if (editId) {
        await gastosService.update(editId, payload);
        showToast('Gasto actualizado');
      } else {
        await gastosService.create(payload);
        showToast('Gasto registrado');
      }
      handleCancel();
      loadGastos();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await gastosService.delete(id);
      showToast('Gasto eliminado');
      setConfirmId(null);
      loadGastos();
    } catch (err) {
      showToast(err.message, 'error');
      setConfirmId(null);
    }
  }

  const porCategoria = gastos.reduce((acc, g) => {
    const key = g.categoria_nombre || '— Sin categoría';
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {});

  const totalMes = gastos.reduce((s, g) => s + Number(g.monto), 0);
  const catOptions = categorias.map(c => ({ value: c.id, label: c.nombre }));

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {confirmId && (
        <Confirm message="¿Eliminar este gasto?"
          onConfirm={() => handleDelete(confirmId)} onCancel={() => setConfirmId(null)} />
      )}
      {confirmCat && (
        <Confirm message="¿Eliminar esta categoría? Los gastos quedarán sin categoría."
          onConfirm={handleEliminarCategoria} onCancel={() => setConfirmCat(null)} />
      )}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.pageTitle}>📤 Gastos</Text>
          {!showForm && (
            <TouchableOpacity style={s.btnAdd} onPress={() => setShowForm(true)}>
              <Text style={s.btnAddText}>+ Registrar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Categorías */}
        {!showForm && (
          <View style={[s.card, { backgroundColor: C.lilaPalido, borderColor: C.moradoClaro }]}>
            <View style={s.rowBetween}>
              <Text style={s.panelTitle}>🏷️ Categorías</Text>
              <TouchableOpacity style={s.catBtn} onPress={() => setShowCatForm(v => !v)}>
                <Text style={s.catBtnText}>{showCatForm ? 'Cancelar' : '+ Nueva'}</Text>
              </TouchableOpacity>
            </View>

            {showCatForm && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <TextInput
                  style={[s.input, { flex: 1 }]}
                  placeholder="Ej: Empaques, Transporte..."
                  value={nuevaCat}
                  onChangeText={setNuevaCat}
                />
                <TouchableOpacity style={s.btnPrimary} onPress={handleCrearCategoria}>
                  <Text style={s.btnPrimaryText}>Crear</Text>
                </TouchableOpacity>
              </View>
            )}

            {categorias.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {categorias.map(c => (
                  <View key={c.id} style={s.chip}>
                    <Text style={s.chipText}>{c.nombre}</Text>
                    <TouchableOpacity onPress={() => setConfirmCat(c.id)}>
                      <Text style={{ color: C.textMuted, fontSize: 12, marginLeft: 4 }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            {categorias.length === 0 && !showCatForm && (
              <Text style={s.muted}>Crea categorías para organizar tus gastos.</Text>
            )}
          </View>
        )}

        {/* Filtro mes */}
        {!showForm && (
          <View style={[s.card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <TouchableOpacity style={s.navBtn} onPress={() => setMes(prevMes(mes))}>
              <Text style={s.navBtnText}>‹</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontWeight: '800', fontSize: 15, color: C.text, textTransform: 'capitalize' }}>
                {mesLabel(mes)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TouchableOpacity style={s.navBtn} onPress={() => setMes(nextMes(mes))}>
                <Text style={s.navBtnText}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.mesBtn} onPress={() => setMes(mesActualStr())}>
                <Text style={s.mesBtnText}>Hoy</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Total del mes */}
        {!showForm && gastos.length > 0 && (
          <View style={[s.card, { backgroundColor: C.lilaPalido, borderColor: C.moradoClaro, borderWidth: 2 }]}>
            <Text style={s.muted}>Total gastos — {mesLabel(mes)}</Text>
            <Text style={{ fontSize: 28, fontWeight: '900', color: C.rojo, marginTop: 4 }}>
              {fmt(totalMes)}
            </Text>
          </View>
        )}

        {/* Formulario */}
        {showForm && (
          <View style={[s.card, { borderColor: C.lila, borderWidth: 2 }]}>
            <Text style={s.panelTitle}>{editId ? '✏️ Editar gasto' : '➕ Nuevo gasto'}</Text>

            <Text style={s.label}>Descripción *</Text>
            <TextInput style={s.input} placeholder="Ej: Compra de empaques"
              value={form.descripcion} onChangeText={v => setForm(f => ({ ...f, descripcion: v }))} />

            <Text style={s.label}>Categoría</Text>
            <PickerModal
              options={catOptions}
              value={form.categoria_id}
              onChange={v => setForm(f => ({ ...f, categoria_id: v ? String(v) : '' }))}
              placeholder="— Sin categoría —"
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Monto *</Text>
                <TextInput style={s.input} placeholder="0" keyboardType="numeric"
                  value={form.monto} onChangeText={v => setForm(f => ({ ...f, monto: v }))} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Fecha *</Text>
                <DateInput value={form.fecha} onChange={v => setForm(f => ({ ...f, fecha: v }))} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={handleCancel}>
                <Text style={s.btnGhostText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, s.btnPrimary, { flex: 1 }]} onPress={handleSubmit} disabled={saving}>
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.btnPrimaryText}>{editId ? 'Actualizar' : 'Guardar'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Lista agrupada */}
        {!showForm && (
          loading ? (
            <ActivityIndicator size="large" color={C.morado} style={{ marginTop: 40 }} />
          ) : gastos.length === 0 ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 40 }}>📤</Text>
              <Text style={s.emptyText}>No hay gastos en este período</Text>
            </View>
          ) : (
            Object.entries(porCategoria).map(([catNombre, items]) => (
              <View key={catNombre} style={{ marginBottom: 16 }}>
                <View style={s.catHeader}>
                  <Text style={s.catLabel}>🏷️ {catNombre}</Text>
                  <Text style={[s.catLabel, { color: C.rojo }]}>
                    {fmt(items.reduce((s, g) => s + Number(g.monto), 0))}
                  </Text>
                </View>
                {items.map(g => (
                  <View key={g.id} style={s.card}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.itemName}>{g.descripcion}</Text>
                        <Text style={s.itemSub}>
                          {new Date(g.fecha + 'T12:00:00').toLocaleDateString('es-CO', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </Text>
                      </View>
                      <Text style={[s.amount, { color: C.rojo }]}>{fmt(g.monto)}</Text>
                      <TouchableOpacity style={[s.iconBtn, { marginLeft: 8 }]} onPress={() => handleEdit(g)}>
                        <Text>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.iconBtn, { backgroundColor: '#FEE2E2', marginLeft: 6 }]} onPress={() => setConfirmId(g.id)}>
                        <Text>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ))
          )
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pageTitle: { fontSize: 20, fontWeight: '900', color: C.text },
  btnAdd: { backgroundColor: C.morado, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  btnAddText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: C.surface, borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1.5, borderColor: C.border, elevation: 2,
  },
  panelTitle: { fontWeight: '800', fontSize: 14, color: C.morado, marginBottom: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1.5, borderColor: C.morado, backgroundColor: '#fff',
  },
  catBtnText: { color: C.morado, fontWeight: '700', fontSize: 13 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.moradoClaro,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: C.morado },
  label: { fontSize: 12, fontWeight: '700', color: C.textMuted, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: '#fff',
  },
  muted: { fontSize: 13, color: C.textMuted },
  navBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: C.lilaPalido,
    alignItems: 'center', justifyContent: 'center',
  },
  navBtnText: { fontSize: 20, fontWeight: '700', color: C.morado },
  mesBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg,
  },
  mesBtnText: { fontSize: 12, fontWeight: '700', color: C.text },
  btn: { padding: 14, borderRadius: 12, alignItems: 'center', flex: 1 },
  btnPrimary: { backgroundColor: C.morado, padding: 12, borderRadius: 10, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '700' },
  btnGhost: { borderWidth: 1.5, borderColor: C.border },
  btnGhostText: { fontWeight: '700', color: C.text },
  catHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 6, paddingHorizontal: 4,
  },
  catLabel: { fontWeight: '800', fontSize: 13, color: C.morado, textTransform: 'uppercase', letterSpacing: 0.5 },
  itemName: { fontWeight: '700', fontSize: 14, color: C.text },
  itemSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  amount: { fontWeight: '900', fontSize: 15 },
  iconBtn: { padding: 8, borderRadius: 8, backgroundColor: C.lilaPalido },
  empty: { alignItems: 'center', padding: 40, gap: 8 },
  emptyText: { fontSize: 15, color: C.textMuted, fontWeight: '600' },
});

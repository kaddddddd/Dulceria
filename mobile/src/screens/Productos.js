import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator,
} from 'react-native';
import { productosService, vendedoresService } from '../services/api';
import PickerModal from '../components/PickerModal';
import Toast from '../components/Toast';
import Confirm from '../components/Confirm';
import { C, fmt } from '../theme';

const EMPTY = { nombre: '', precio_compra: '', precio_venta: '', stock: '', propietario_id: '' };

export default function Productos() {
  const [productos,  setProductos]  = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [form,       setForm]       = useState(EMPTY);
  const [editId,     setEditId]     = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [toast,      setToast]      = useState(null);
  const [confirmId,  setConfirmId]  = useState(null);
  const [saving,     setSaving]     = useState(false);

  function showToast(msg, type = 'success') { setToast({ message: msg, type }); }

  const loadProductos = () =>
    productosService.getAll()
      .then(setProductos)
      .catch(() => showToast('Error al cargar productos', 'error'))
      .finally(() => setLoading(false));

  useEffect(() => {
    loadProductos();
    vendedoresService.getAll().then(setVendedores).catch(() => {});
  }, []);

  function handleEdit(p) {
    setForm({
      nombre: p.nombre, precio_compra: String(p.precio_compra),
      precio_venta: String(p.precio_venta), stock: String(p.stock),
      propietario_id: p.propietario_id ? String(p.propietario_id) : '',
    });
    setEditId(p.id);
    setShowForm(true);
  }

  function handleCancel() { setForm(EMPTY); setEditId(null); setShowForm(false); }

  async function handleSubmit() {
    if (!form.nombre || form.precio_venta === '' || form.stock === '') {
      showToast('Completa todos los campos requeridos', 'error'); return;
    }
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre,
        precio_compra: Number(form.precio_compra) || 0,
        precio_venta: Number(form.precio_venta),
        stock: Number(form.stock),
        propietario_id: form.propietario_id ? Number(form.propietario_id) : null,
      };
      if (editId) {
        await productosService.update(editId, payload);
        showToast('Producto actualizado');
      } else {
        await productosService.create(payload);
        showToast('Producto creado');
      }
      handleCancel();
      loadProductos();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await productosService.delete(id);
      showToast('Producto eliminado');
      setConfirmId(null);
      loadProductos();
    } catch (err) {
      showToast(err.message, 'error');
      setConfirmId(null);
    }
  }

  const vendOptions = vendedores.map(v => ({ value: v.id, label: `${v.nombre} — 100% para ella` }));
  const propietarioNombre = vendedores.find(v => String(v.id) === String(form.propietario_id))?.nombre;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {confirmId && (
        <Confirm
          message="¿Eliminar este producto?"
          onConfirm={() => handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View style={s.header}>
          <Text style={s.pageTitle}>📦 Inventario</Text>
          {!showForm && (
            <TouchableOpacity style={s.btnAdd} onPress={() => setShowForm(true)}>
              <Text style={s.btnAddText}>+ Agregar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Formulario */}
        {showForm && (
          <View style={[s.card, { borderColor: C.rosa, borderWidth: 2 }]}>
            <Text style={s.panelTitle}>{editId ? '✏️ Editar producto' : '➕ Nuevo producto'}</Text>

            <Text style={s.label}>Nombre del producto *</Text>
            <TextInput
              style={s.input} placeholder="Ej: Gomitas de fresa"
              value={form.nombre} onChangeText={v => setForm(f => ({ ...f, nombre: v }))}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Precio compra</Text>
                <TextInput style={s.input} placeholder="0" keyboardType="numeric"
                  value={form.precio_compra} onChangeText={v => setForm(f => ({ ...f, precio_compra: v }))} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Precio venta *</Text>
                <TextInput style={s.input} placeholder="0" keyboardType="numeric"
                  value={form.precio_venta} onChangeText={v => setForm(f => ({ ...f, precio_venta: v }))} />
              </View>
            </View>

            <Text style={s.label}>{editId ? 'Stock actual *' : 'Stock inicial *'}</Text>
            <TextInput style={s.input} placeholder="0" keyboardType="numeric"
              value={form.stock} onChangeText={v => setForm(f => ({ ...f, stock: v }))} />
            {editId && (
              <Text style={s.hint}>Este valor reemplaza el stock actual.</Text>
            )}

            <Text style={s.label}>¿Este producto es de alguien en específico?</Text>
            <PickerModal
              options={vendOptions}
              value={form.propietario_id}
              onChange={v => setForm(f => ({ ...f, propietario_id: v ? String(v) : '' }))}
              placeholder="No — va al pool general (50 / 50)"
            />
            {propietarioNombre && (
              <Text style={s.propietarioHint}>Las ventas irán 100% a {propietarioNombre}.</Text>
            )}

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

        {/* Lista */}
        {loading ? (
          <ActivityIndicator size="large" color={C.morado} style={{ marginTop: 40 }} />
        ) : productos.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ fontSize: 40 }}>📦</Text>
            <Text style={s.emptyText}>No hay productos registrados</Text>
          </View>
        ) : (
          productos.map(p => (
            <View key={p.id} style={s.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    <Text style={s.itemName}>{p.nombre}</Text>
                    {p.propietario_nombre && (
                      <View style={s.badge}>
                        <Text style={s.badgeText}>100% {p.propietario_nombre}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.itemSub}>Venta: {fmt(p.precio_venta)} · Compra: {fmt(p.precio_compra)}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Text style={s.itemSub}>Stock: </Text>
                    <Text style={[s.itemSub, {
                      fontWeight: '700',
                      color: p.stock === 0 ? C.rojo : p.stock < 10 ? '#F59E0B' : C.verde,
                    }]}>
                      {p.stock === 0 ? '⚠ Sin stock' : `${p.stock} unid.`}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={s.btnEdit} onPress={() => handleEdit(p)}>
                    <Text>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.btnDanger} onPress={() => setConfirmId(p.id)}>
                    <Text>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pageTitle: { fontSize: 20, fontWeight: '900', color: C.text },
  btnAdd: {
    backgroundColor: C.morado, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 12,
  },
  btnAddText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: C.surface, borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1.5, borderColor: C.border, elevation: 2,
  },
  panelTitle: { fontWeight: '800', fontSize: 14, color: C.morado, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', color: C.textMuted, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: '#fff',
  },
  hint: { fontSize: 11, color: C.textMuted, marginTop: 4 },
  propietarioHint: { fontSize: 12, color: C.morado, fontWeight: '600', marginTop: 6 },
  btn: { padding: 14, borderRadius: 12, alignItems: 'center', flex: 1 },
  btnPrimary: { backgroundColor: C.morado },
  btnPrimaryText: { color: '#fff', fontWeight: '700' },
  btnGhost: { borderWidth: 1.5, borderColor: C.border },
  btnGhostText: { fontWeight: '700', color: C.text },
  btnEdit: { padding: 8, borderRadius: 8, backgroundColor: C.lilaPalido },
  btnDanger: { padding: 8, borderRadius: 8, backgroundColor: '#FEE2E2' },
  itemName: { fontWeight: '700', fontSize: 15, color: C.text },
  itemSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  badge: { backgroundColor: C.lilaPalido, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, color: C.morado, fontWeight: '700' },
  empty: { alignItems: 'center', padding: 40, gap: 8 },
  emptyText: { fontSize: 15, color: C.textMuted, fontWeight: '600' },
});

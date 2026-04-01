import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Image, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { vendedoresService } from '../services/api';
import Toast from '../components/Toast';
import Confirm from '../components/Confirm';
import { C, fmt } from '../theme';

const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

function Avatar({ foto, nombre, size = 52 }) {
  const initials = nombre
    ? nombre.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  if (foto) {
    return (
      <Image
        source={{ uri: foto }}
        style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: C.moradoClaro }}
      />
    );
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: C.morado, alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: C.moradoClaro,
    }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

function FotoInput({ value, onChange }) {
  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      onChange(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 8 }}>
      <TouchableOpacity onPress={pickImage} style={{ position: 'relative' }}>
        <Avatar foto={value} nombre="" size={64} />
        <View style={{
          position: 'absolute', bottom: 0, right: 0,
          backgroundColor: C.morado, borderRadius: 11,
          width: 22, height: 22, alignItems: 'center', justifyContent: 'center',
          borderWidth: 2, borderColor: '#fff',
        }}>
          <Text style={{ fontSize: 10 }}>📷</Text>
        </View>
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <TouchableOpacity onPress={pickImage}>
          <Text style={{ color: C.morado, fontWeight: '700', fontSize: 13 }}>
            {value ? 'Cambiar foto' : 'Agregar foto'}
          </Text>
        </TouchableOpacity>
        {value && (
          <TouchableOpacity onPress={() => onChange(null)}>
            <Text style={{ color: C.rojo, fontSize: 12, marginTop: 4 }}>Quitar foto</Text>
          </TouchableOpacity>
        )}
        <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>JPG o PNG · recomendado cuadrada</Text>
      </View>
    </View>
  );
}

export default function Vendedores() {
  const [vendedores, setVendedores] = useState([]);
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState({ nombre: '', foto: null });
  const [editId,     setEditId]     = useState(null);
  const [editForm,   setEditForm]   = useState({ nombre: '', foto: null });
  const [toast,      setToast]      = useState(null);
  const [confirmId,  setConfirmId]  = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [loading,    setLoading]    = useState(true);

  function showToast(msg, type = 'success') { setToast({ message: msg, type }); }

  const loadVendedores = () =>
    vendedoresService.getAll()
      .then(setVendedores)
      .catch(() => showToast('Error al cargar vendedores', 'error'))
      .finally(() => setLoading(false));

  useEffect(() => { loadVendedores(); }, []);

  async function handleCreate() {
    if (!form.nombre.trim()) { showToast('Ingresa un nombre', 'error'); return; }
    setSaving(true);
    try {
      await vendedoresService.create({ nombre: form.nombre.trim(), foto: form.foto || null });
      showToast('Vendedor creado');
      setForm({ nombre: '', foto: null });
      setShowForm(false);
      loadVendedores();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id) {
    if (!editForm.nombre.trim()) { showToast('Ingresa un nombre', 'error'); return; }
    try {
      await vendedoresService.update(id, { nombre: editForm.nombre.trim(), foto: editForm.foto });
      showToast('Vendedor actualizado');
      setEditId(null);
      loadVendedores();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDelete(id) {
    try {
      await vendedoresService.delete(id);
      showToast('Vendedor eliminado');
      setConfirmId(null);
      loadVendedores();
    } catch (err) {
      showToast(err.message, 'error');
      setConfirmId(null);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {confirmId && (
        <Confirm
          message="¿Eliminar este vendedor? Solo es posible si no tiene ventas."
          onConfirm={() => handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View style={s.header}>
          <Text style={s.pageTitle}>👤 Equipo</Text>
          {!showForm && (
            <TouchableOpacity style={s.btnAdd} onPress={() => setShowForm(true)}>
              <Text style={s.btnAddText}>+ Agregar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Formulario nuevo */}
        {showForm && (
          <View style={[s.card, { borderColor: C.rosa, borderWidth: 2 }]}>
            <Text style={s.panelTitle}>➕ Nueva vendedora</Text>
            <FotoInput value={form.foto} onChange={foto => setForm(f => ({ ...f, foto }))} />
            <Text style={s.label}>Nombre completo *</Text>
            <TextInput
              style={s.input} placeholder="Ej: María López"
              value={form.nombre} onChangeText={v => setForm(f => ({ ...f, nombre: v }))}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity style={[s.btn, s.btnGhost]}
                onPress={() => { setShowForm(false); setForm({ nombre: '', foto: null }); }}>
                <Text style={s.btnGhostText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, s.btnPrimary, { flex: 1 }]} onPress={handleCreate} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.btnPrimaryText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Lista */}
        {loading ? (
          <ActivityIndicator size="large" color={C.morado} style={{ marginTop: 40 }} />
        ) : vendedores.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ fontSize: 40 }}>👤</Text>
            <Text style={s.emptyText}>No hay vendedores registrados</Text>
          </View>
        ) : (
          vendedores.map((v, i) => (
            <View key={v.id} style={[s.card, i < 3 && { borderColor: rankColors[i] + '66', borderWidth: 2 }]}>
              {editId === v.id ? (
                <View>
                  <FotoInput value={editForm.foto} onChange={foto => setEditForm(f => ({ ...f, foto }))} />
                  <TextInput
                    style={[s.input, { borderColor: C.rosa, borderWidth: 2, marginBottom: 12 }]}
                    value={editForm.nombre}
                    onChangeText={nombre => setEditForm(f => ({ ...f, nombre }))}
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={() => setEditId(null)}>
                      <Text style={s.btnGhostText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.btn, s.btnPrimary, { flex: 1 }]} onPress={() => handleUpdate(v.id)}>
                      <Text style={s.btnPrimaryText}>Guardar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Avatar foto={v.foto} nombre={v.nombre} size={52} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {i < 3 && <Text style={{ fontSize: 16 }}>{'🥇🥈🥉'[i]}</Text>}
                      <Text style={s.itemName}>{v.nombre}</Text>
                    </View>
                    <Text style={s.itemSub}>
                      {v.total_ventas} ventas · <Text style={{ color: C.verde, fontWeight: '800' }}>{fmt(v.total_vendido)}</Text>
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity style={s.iconBtn}
                      onPress={() => { setEditId(v.id); setEditForm({ nombre: v.nombre, foto: v.foto || null }); }}>
                      <Text>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.iconBtn, { backgroundColor: '#FEE2E2' }]} onPress={() => setConfirmId(v.id)}>
                      <Text>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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
  btnAdd: { backgroundColor: C.morado, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  btnAddText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: C.surface, borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1.5, borderColor: C.border, elevation: 2,
  },
  panelTitle: { fontWeight: '800', fontSize: 14, color: C.morado, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '700', color: C.textMuted, marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: '#fff',
  },
  btn: { padding: 14, borderRadius: 12, alignItems: 'center', flex: 1 },
  btnPrimary: { backgroundColor: C.morado },
  btnPrimaryText: { color: '#fff', fontWeight: '700' },
  btnGhost: { borderWidth: 1.5, borderColor: C.border },
  btnGhostText: { fontWeight: '700', color: C.text },
  iconBtn: { padding: 8, borderRadius: 8, backgroundColor: C.lilaPalido },
  itemName: { fontWeight: '700', fontSize: 15, color: C.text },
  itemSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  empty: { alignItems: 'center', padding: 40, gap: 8 },
  emptyText: { fontSize: 15, color: C.textMuted, fontWeight: '600' },
});

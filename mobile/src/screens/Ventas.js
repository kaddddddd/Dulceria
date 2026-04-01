import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator,
} from 'react-native';
import { ventasService, productosService, vendedoresService } from '../services/api';
import PickerModal from '../components/PickerModal';
import Toast from '../components/Toast';
import Confirm from '../components/Confirm';
import { C, fmt } from '../theme';

function fmtDate(d) {
  return new Date(d).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function Ventas() {
  const [tab, setTab] = useState('nueva');
  const [productos, setProductos] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [cart, setCart] = useState([]);
  const [vendedorId, setVendedorId] = useState('');
  const [productoSel, setProductoSel] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  function showToast(msg, type = 'success') { setToast({ message: msg, type }); }

  useEffect(() => {
    Promise.all([productosService.getAll(), vendedoresService.getAll()])
      .then(([prods, vends]) => { setProductos(prods); setVendedores(vends); })
      .catch(() => showToast('Error al cargar datos', 'error'));
  }, []);

  useEffect(() => {
    if (tab === 'historial') loadVentas();
  }, [tab]);

  function loadVentas() {
    ventasService.getAll()
      .then(setVentas)
      .catch(() => showToast('Error al cargar historial', 'error'));
  }

  function handleAddToCart() {
    if (!productoSel) { showToast('Selecciona un producto', 'error'); return; }
    const prod = productos.find(p => p.id === Number(productoSel));
    if (!prod) return;
    const yaEnCarrito = cart.find(c => c.producto_id === prod.id);
    const cantidadEnCarrito = yaEnCarrito ? yaEnCarrito.cantidad : 0;
    if (cantidadEnCarrito + cantidad > prod.stock) {
      showToast(`Stock insuficiente. Disponible: ${prod.stock - cantidadEnCarrito}`, 'error');
      return;
    }
    if (yaEnCarrito) {
      setCart(cart.map(c => c.producto_id === prod.id
        ? { ...c, cantidad: c.cantidad + cantidad, subtotal: (c.cantidad + cantidad) * c.precio_unitario }
        : c));
    } else {
      setCart([...cart, {
        producto_id: prod.id, nombre: prod.nombre, cantidad,
        precio_unitario: prod.precio_venta, subtotal: cantidad * prod.precio_venta,
      }]);
    }
    setProductoSel('');
    setCantidad(1);
  }

  function removeFromCart(id) { setCart(cart.filter(c => c.producto_id !== id)); }

  function updateQty(id, delta) {
    setCart(cart.map(c => {
      if (c.producto_id !== id) return c;
      const prod = productos.find(p => p.id === id);
      const newQty = c.cantidad + delta;
      if (newQty < 1) return c;
      if (newQty > prod.stock) { showToast('Stock insuficiente', 'error'); return c; }
      return { ...c, cantidad: newQty, subtotal: newQty * c.precio_unitario };
    }));
  }

  const total = cart.reduce((sum, c) => sum + c.subtotal, 0);

  async function handleVender() {
    if (!vendedorId) { showToast('Selecciona un vendedor', 'error'); return; }
    if (cart.length === 0) { showToast('Agrega productos al carrito', 'error'); return; }
    setLoading(true);
    try {
      await ventasService.create({
        vendedor_id: Number(vendedorId),
        items: cart.map(c => ({ producto_id: c.producto_id, cantidad: c.cantidad, precio_unitario: c.precio_unitario })),
      });
      showToast('¡Venta registrada! 🎉');
      setCart([]);
      setVendedorId('');
      productosService.getAll().then(setProductos);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteVenta(id) {
    try {
      await ventasService.delete(id);
      showToast('Venta eliminada y stock restaurado');
      setConfirmId(null);
      loadVentas();
      productosService.getAll().then(setProductos);
    } catch (err) {
      showToast(err.message, 'error');
      setConfirmId(null);
    }
  }

  const prodOptions = productos.filter(p => p.stock > 0).map(p => ({
    value: p.id, label: `${p.nombre} · Stock: ${p.stock} · ${fmt(p.precio_venta)}`,
  }));
  const vendOptions = vendedores.map(v => ({ value: v.id, label: v.nombre }));

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {confirmId && (
        <Confirm
          message="¿Eliminar esta venta? El stock será restaurado."
          onConfirm={() => handleDeleteVenta(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <Text style={s.pageTitle}>🛒 Ventas</Text>

        {/* Tabs */}
        <View style={s.tabs}>
          {['nueva', 'historial'].map(t => (
            <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                {t === 'nueva' ? '➕ Nueva venta' : '📋 Historial'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'nueva' && (
          <>
            {/* Vendedor */}
            <View style={s.card}>
              <Text style={s.panelTitle}>👤 Vendedor</Text>
              <PickerModal
                options={vendOptions}
                value={vendedorId}
                onChange={setVendedorId}
                placeholder="— Selecciona vendedor —"
              />
            </View>

            {/* Agregar producto */}
            <View style={s.card}>
              <Text style={s.panelTitle}>🍬 Agregar producto</Text>
              <Text style={s.label}>Producto</Text>
              <PickerModal
                options={prodOptions}
                value={productoSel}
                onChange={v => setProductoSel(String(v))}
                placeholder="— Selecciona producto —"
              />
              <Text style={[s.label, { marginTop: 12 }]}>Cantidad</Text>
              <View style={s.qtyRow}>
                <TouchableOpacity style={s.qtyBtn} onPress={() => setCantidad(Math.max(1, cantidad - 1))}>
                  <Text style={s.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={s.qtyVal}>{cantidad}</Text>
                <TouchableOpacity style={s.qtyBtn} onPress={() => setCantidad(cantidad + 1)}>
                  <Text style={s.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[s.btn, s.btnGhost, { marginTop: 12 }]} onPress={handleAddToCart}>
                <Text style={s.btnGhostText}>➕ Agregar al carrito</Text>
              </TouchableOpacity>
            </View>

            {/* Carrito */}
            {cart.length > 0 && (
              <View style={s.card}>
                <Text style={s.panelTitle}>🛍️ Carrito ({cart.length})</Text>
                {cart.map(item => (
                  <View key={item.producto_id} style={s.cartItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cartName}>{item.nombre}</Text>
                      <Text style={s.cartPrice}>{fmt(item.precio_unitario)} c/u → {fmt(item.subtotal)}</Text>
                    </View>
                    <View style={s.qtyRow}>
                      <TouchableOpacity style={s.qtyBtn} onPress={() => updateQty(item.producto_id, -1)}>
                        <Text style={s.qtyBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={s.qtyVal}>{item.cantidad}</Text>
                      <TouchableOpacity style={s.qtyBtn} onPress={() => updateQty(item.producto_id, 1)}>
                        <Text style={s.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.qtyBtn} onPress={() => removeFromCart(item.producto_id)}>
                        <Text style={[s.qtyBtnText, { color: C.rojo }]}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <View style={s.totalBar}>
                  <Text style={s.totalLabel}>TOTAL A COBRAR</Text>
                  <Text style={s.totalAmount}>{fmt(total)}</Text>
                </View>
                <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={handleVender} disabled={loading}>
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.btnPrimaryText}>✅ Confirmar venta</Text>}
                </TouchableOpacity>
              </View>
            )}

            {cart.length === 0 && (
              <View style={s.empty}>
                <Text style={{ fontSize: 40 }}>🛒</Text>
                <Text style={s.emptyText}>El carrito está vacío</Text>
              </View>
            )}
          </>
        )}

        {tab === 'historial' && (
          ventas.length === 0 ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 40 }}>📋</Text>
              <Text style={s.emptyText}>No hay ventas registradas</Text>
            </View>
          ) : (
            ventas.map((v, i) => (
              <View key={v.id} style={s.card}>
                <View style={s.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.itemName}>Venta #{ventas.length - i}</Text>
                    <Text style={s.itemSub}>{v.vendedor} · {fmtDate(v.fecha)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={[s.amount, { color: C.verde }]}>{fmt(v.total)}</Text>
                    <TouchableOpacity style={s.btnDanger} onPress={() => setConfirmId(v.id)}>
                      <Text>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setExpandedId(expandedId === v.id ? null : v.id)}>
                  <Text style={s.expandBtn}>
                    {expandedId === v.id ? '▲ Ocultar detalle' : '▼ Ver detalle'}
                  </Text>
                </TouchableOpacity>
                {expandedId === v.id && v.detalle && (
                  <View style={{ marginTop: 10 }}>
                    {v.detalle.map(d => (
                      <View key={d.id} style={s.rowBetween}>
                        <Text style={{ fontSize: 13, color: C.text }}>{d.producto_nombre} × {d.cantidad}</Text>
                        <Text style={{ fontWeight: '700', fontSize: 13 }}>{fmt(d.subtotal)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  pageTitle: { fontSize: 20, fontWeight: '900', color: C.text, marginBottom: 16 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: {
    flex: 1, padding: 12, borderRadius: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface,
  },
  tabActive: { backgroundColor: C.morado, borderColor: C.morado },
  tabText: { fontSize: 13, fontWeight: '700', color: C.text },
  tabTextActive: { color: '#fff' },
  card: {
    backgroundColor: C.surface, borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1.5, borderColor: C.border, elevation: 2,
  },
  panelTitle: { fontWeight: '800', fontSize: 14, color: C.morado, marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '700', color: C.textMuted, marginBottom: 6 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: C.lilaPalido,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 18, fontWeight: '700', color: C.morado },
  qtyVal: { fontSize: 18, fontWeight: '800', minWidth: 32, textAlign: 'center', color: C.text },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  cartName: { fontWeight: '700', fontSize: 14, color: C.text },
  cartPrice: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  totalBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.lilaPalido, borderRadius: 12, padding: 14, marginVertical: 12,
  },
  totalLabel: { fontSize: 11, fontWeight: '800', color: C.morado, letterSpacing: 0.5 },
  totalAmount: { fontSize: 20, fontWeight: '900', color: C.morado },
  btn: { padding: 14, borderRadius: 12, alignItems: 'center' },
  btnPrimary: { backgroundColor: C.morado },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnGhost: { borderWidth: 1.5, borderColor: C.border },
  btnGhostText: { fontWeight: '700', color: C.text },
  btnDanger: { padding: 8, borderRadius: 8, backgroundColor: '#FEE2E2' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontWeight: '700', fontSize: 14, color: C.text },
  itemSub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  amount: { fontWeight: '800', fontSize: 15 },
  expandBtn: { fontSize: 12, fontWeight: '700', color: C.rosa, marginTop: 8 },
  empty: { alignItems: 'center', padding: 40, gap: 8 },
  emptyText: { fontSize: 15, color: C.textMuted, fontWeight: '600' },
});

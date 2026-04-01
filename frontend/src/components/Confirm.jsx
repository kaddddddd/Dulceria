// components/Confirm.jsx — Diálogo de confirmación
export default function Confirm({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(45,27,46,0.5)',
      zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }}>
      <div style={{
        background: 'white', borderRadius: '20px 20px 0 0',
        padding: '24px 20px', width: '100%', maxWidth: '430px',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.15)'
      }}>
        <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, textAlign: 'center' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost w-full" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-danger w-full" style={{ flex: 1 }} onClick={onConfirm}>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

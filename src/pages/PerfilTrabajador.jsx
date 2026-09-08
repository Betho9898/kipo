import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function PerfilTrabajador() {
  const navigate = useNavigate()
  const [trabajador, setTrabajador] = useState(null)
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [passwordForm, setPasswordForm] = useState({ nueva: '', confirmar: '' })
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/'); return }
    const { data: trab } = await supabase.from('trabajadores').select('*').eq('email', user.email).single()
    if (trab) {
      setTrabajador(trab)
      setNombre(trab.nombre)
    }
  }

  const guardarNombre = async () => {
    await supabase.from('trabajadores').update({ nombre }).eq('id', trabajador.id)
    setMensaje('✅ Nombre actualizado')
    setEditando(false)
    cargarDatos()
    setTimeout(() => setMensaje(''), 3000)
  }

  const cambiarPassword = async () => {
    if (passwordForm.nueva !== passwordForm.confirmar) {
      setMensaje('❌ Las contraseñas no coinciden')
      return
    }
    if (passwordForm.nueva.length < 6) {
      setMensaje('❌ Mínimo 6 caracteres')
      return
    }
    const { error } = await supabase.auth.updateUser({ password: passwordForm.nueva })
    if (error) {
      setMensaje('❌ Error al cambiar la contraseña')
    } else {
      setMensaje('✅ Contraseña actualizada')
      setPasswordForm({ nueva: '', confirmar: '' })
    }
    setTimeout(() => setMensaje(''), 3000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const inputStyle = { width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #4a7a5e', fontSize: '13px', outline: 'none', background: '#fff', boxSizing: 'border-box' }
  const labelStyle = { fontSize: '11px', fontWeight: '700', color: '#4a7a5e', display: 'block', marginBottom: '6px' }

  return (
    <div style={{ background: '#f0f7f2', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'sans-serif' }}>

      {/* TOPBAR */}
      <div style={{
        background: 'linear-gradient(135deg, #1a7a4a 0%, #2eaa6a 60%, #f97316 100%)',
        padding: '14px 16px 20px', borderRadius: '0 0 28px 28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate('/dashboard')} style={{
            background: 'rgba(255,255,255,0.22)', border: 'none', borderRadius: '20px',
            padding: '6px 14px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
          }}>← Volver</button>
        </div>
        <div style={{ marginTop: '10px' }}>
          <p style={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}>Mi perfil</p>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px' }}>{trabajador?.rol}</span>
        </div>
      </div>

      <div style={{ padding: '16px' }}>

        {/* AVATAR Y DATOS */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', marginBottom: '16px', border: '1.5px solid #7abf9a', textAlign: 'center' }}>
          <div style={{
            width: '70px', height: '70px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #1a7a4a, #f97316)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0 auto 12px'
          }}>
            {trabajador?.nombre?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#1a4a2e' }}>{trabajador?.nombre}</div>
          <div style={{ fontSize: '13px', color: '#7aaa8e', marginTop: '4px' }}>{trabajador?.email}</div>
          <span style={{ display: 'inline-block', background: '#e8f7ef', color: '#1a7a4a', fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', marginTop: '8px' }}>
            {trabajador?.rol}
          </span>
        </div>

        {/* MENSAJE */}
        {mensaje && (
          <div style={{ padding: '10px 14px', borderRadius: '10px', background: mensaje.includes('✅') ? '#e8f7ef' : '#ffe4e4', fontSize: '13px', fontWeight: '600', color: mensaje.includes('✅') ? '#1a7a4a' : '#e53e3e', marginBottom: '16px' }}>
            {mensaje}
          </div>
        )}

        {/* EDITAR NOMBRE */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '16px', border: '1.5px solid #7abf9a' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a4a2e', marginBottom: '12px' }}>Información personal</div>
          {!editando ? (
            <div>
              <div style={{ fontSize: '12px', color: '#7aaa8e', marginBottom: '4px' }}>Nombre</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a4a2e', marginBottom: '12px' }}>{trabajador?.nombre}</div>
              <button onClick={() => setEditando(true)} style={{
                width: '100%', padding: '10px', background: '#f0f7f2',
                color: '#1a7a4a', border: '1px solid #a8d5b8', borderRadius: '10px',
                fontSize: '13px', fontWeight: '700', cursor: 'pointer'
              }}>✏️ Editar nombre</button>
            </div>
          ) : (
            <div>
              <label style={labelStyle}>Nombre</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} style={{ ...inputStyle, marginBottom: '12px' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setEditando(false)} style={{ flex: 1, padding: '10px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={guardarNombre} style={{ flex: 2, padding: '10px', background: 'linear-gradient(135deg, #1a7a4a, #f97316)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Guardar</button>
              </div>
            </div>
          )}
        </div>

        {/* CAMBIAR CONTRASEÑA */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '16px', border: '1.5px solid #7abf9a' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a4a2e', marginBottom: '12px' }}>Cambiar contraseña</div>
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Nueva contraseña</label>
            <input type="password" value={passwordForm.nueva} onChange={e => setPasswordForm({ ...passwordForm, nueva: e.target.value })} placeholder="••••••••" style={inputStyle} />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Confirmar contraseña</label>
            <input type="password" value={passwordForm.confirmar} onChange={e => setPasswordForm({ ...passwordForm, confirmar: e.target.value })} placeholder="••••••••" style={inputStyle} />
          </div>
          <button onClick={cambiarPassword} style={{
            width: '100%', padding: '12px', background: 'linear-gradient(135deg, #1a7a4a, #f97316)',
            color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer'
          }}>Actualizar contraseña</button>
        </div>

        {/* CERRAR SESIÓN */}
        <button onClick={handleLogout} style={{
          width: '100%', padding: '14px', background: '#ffe4e4', color: '#e53e3e',
          border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer'
        }}>Cerrar sesión</button>

      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1.5px solid #7abf9a', display: 'flex', justifyContent: 'space-around', padding: '10px 0 14px' }}>
        {[
          { icon: 'ti-home', label: 'Inicio', path: '/dashboard' },
          { icon: 'ti-clipboard-list', label: 'Novedades', path: '/novedades-trabajador' },
          { icon: 'ti-file-text', label: 'Colillas', path: '/colillas-trabajador' },
          { icon: 'ti-calendar', label: 'Turnos', path: '/turnos-trabajador' },
          { icon: 'ti-user', label: 'Perfil', path: '/perfil-trabajador', active: true },
        ].map((n, i) => (
          <div key={i} onClick={() => navigate(n.path)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <i className={`ti ${n.icon}`} style={{ fontSize: '22px', color: n.active ? '#1a7a4a' : '#4a7a5e' }} aria-hidden="true" />
            <span style={{ fontSize: '10px', color: n.active ? '#1a7a4a' : '#4a7a5e', fontWeight: n.active ? '700' : '400' }}>{n.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
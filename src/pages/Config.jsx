import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Config() {
  const navigate = useNavigate()
  const [trabajador, setTrabajador] = useState(null)
  const [empresa, setEmpresa] = useState(null)
  const [tiposNovedad, setTiposNovedad] = useState([])
  const [nuevoTipo, setNuevoTipo] = useState('')
  const [mostrarFormTipo, setMostrarFormTipo] = useState(false)
  const [tab, setTab] = useState('perfil')
  const [editandoPerfil, setEditandoPerfil] = useState(false)
  const [editandoEmpresa, setEditandoEmpresa] = useState(false)
  const [perfilForm, setPerfilForm] = useState({ nombre: '', email: '' })
  const [empresaForm, setEmpresaForm] = useState({ nombre: '', nit: '' })
  const [passwordForm, setPasswordForm] = useState({ nueva: '', confirmar: '' })
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate('/')
    })
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: trab } = await supabase.from('trabajadores').select('*').eq('email', user.email).single()
    if (trab) {
      setTrabajador(trab)
      setPerfilForm({ nombre: trab.nombre, email: trab.email })
    }

    const { data: emp } = await supabase.from('empresas').select('*').limit(1).single()
    if (emp) {
      setEmpresa(emp)
      setEmpresaForm({ nombre: emp.nombre, nit: emp.nit || '' })
    }

    const { data: tipos } = await supabase.from('tipos_novedad').select('*')
    if (tipos) setTiposNovedad(tipos)
  }

  const guardarPerfil = async () => {
    await supabase.from('trabajadores').update({ nombre: perfilForm.nombre }).eq('id', trabajador.id)
    setMensaje('✅ Perfil actualizado')
    setEditandoPerfil(false)
    cargarDatos()
    setTimeout(() => setMensaje(''), 3000)
  }

  const guardarEmpresa = async () => {
    await supabase.from('empresas').update({ nombre: empresaForm.nombre, nit: empresaForm.nit }).eq('id', empresa.id)
    setMensaje('✅ Datos de empresa actualizados')
    setEditandoEmpresa(false)
    cargarDatos()
    setTimeout(() => setMensaje(''), 3000)
  }

  const cambiarPassword = async () => {
    if (passwordForm.nueva !== passwordForm.confirmar) {
      setMensaje('❌ Las contraseñas no coinciden')
      return
    }
    if (passwordForm.nueva.length < 6) {
      setMensaje('❌ La contraseña debe tener al menos 6 caracteres')
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

  const crearTipo = async () => {
    if (!nuevoTipo) return
    await supabase.from('tipos_novedad').insert([{ nombre: nuevoTipo }])
    setNuevoTipo('')
    setMostrarFormTipo(false)
    cargarDatos()
  }

  const eliminarTipo = async (id) => {
    await supabase.from('tipos_novedad').delete().eq('id', id)
    cargarDatos()
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
          <button onClick={() => navigate('/admin')} style={{
            background: 'rgba(255,255,255,0.22)', border: 'none', borderRadius: '20px',
            padding: '6px 14px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
          }}>← Volver</button>
          <button onClick={handleLogout} style={{
            background: 'rgba(255,255,255,0.22)', border: 'none', borderRadius: '20px',
            padding: '6px 14px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
          }}>Salir</button>
        </div>
        <div style={{ marginTop: '10px' }}>
          <p style={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}>Configuración</p>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px' }}>Perfil · Empresa · Seguridad · Plataforma</span>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '6px', padding: '16px 16px 0', overflowX: 'auto' }}>
        {[
          { id: 'perfil', label: 'Perfil' },
          { id: 'empresa', label: 'Empresa' },
          { id: 'seguridad', label: 'Seguridad' },
          { id: 'plataforma', label: 'Plataforma' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', flexShrink: 0,
            background: tab === t.id ? '#1a7a4a' : '#fff',
            color: tab === t.id ? '#fff' : '#4a7a5e',
            fontSize: '12px', fontWeight: '700',
            border: tab === t.id ? 'none' : '0.5px solid #c8e6d4'
          }}>{t.label}</button>
        ))}
      </div>

      {/* MENSAJE */}
      {mensaje && (
        <div style={{ margin: '12px 16px 0', padding: '10px 14px', borderRadius: '10px', background: mensaje.includes('✅') ? '#e8f7ef' : '#ffe4e4', fontSize: '13px', fontWeight: '600', color: mensaje.includes('✅') ? '#1a7a4a' : '#e53e3e' }}>
          {mensaje}
        </div>
      )}

      <div style={{ padding: '16px' }}>

        {/* TAB PERFIL */}
        {tab === 'perfil' && (
          <div>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '16px', border: '0.5px solid #c8e6d4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1a7a4a, #f97316)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', fontWeight: '700', color: '#fff'
                }}>
                  {trabajador?.nombre?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a4a2e' }}>{trabajador?.nombre}</div>
                  <div style={{ fontSize: '12px', color: '#7aaa8e', marginTop: '2px' }}>{trabajador?.email}</div>
                  <span style={{ display: 'inline-block', background: '#e8f7ef', color: '#1a7a4a', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', marginTop: '4px' }}>✦ {trabajador?.rol}</span>
                </div>
              </div>

              {!editandoPerfil ? (
                <button onClick={() => setEditandoPerfil(true)} style={{
                  width: '100%', padding: '10px', background: '#f0f7f2',
                  color: '#1a7a4a', border: '0.5px solid #c8e6d4', borderRadius: '10px',
                  fontSize: '13px', fontWeight: '700', cursor: 'pointer'
                }}>✏️ Editar perfil</button>
              ) : (
                <div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={labelStyle}>Nombre</label>
                    <input value={perfilForm.nombre} onChange={e => setPerfilForm({ ...perfilForm, nombre: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}>Correo</label>
                    <input value={perfilForm.email} disabled style={{ ...inputStyle, background: '#f0f7f2', color: '#7aaa8e' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setEditandoPerfil(false)} style={{ flex: 1, padding: '10px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Cancelar</button>
                    <button onClick={guardarPerfil} style={{ flex: 2, padding: '10px', background: 'linear-gradient(135deg, #1a7a4a, #f97316)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Guardar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB EMPRESA */}
        {tab === 'empresa' && (
          <div>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '16px', border: '0.5px solid #c8e6d4' }}>
              {!editandoEmpresa ? (
                <div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#7aaa8e', marginBottom: '4px' }}>Nombre de la empresa</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a4a2e' }}>{empresa?.nombre || 'Sin nombre'}</div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#7aaa8e', marginBottom: '4px' }}>NIT</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a4a2e' }}>{empresa?.nit || 'Sin NIT'}</div>
                  </div>
                  <button onClick={() => setEditandoEmpresa(true)} style={{
                    width: '100%', padding: '10px', background: '#f0f7f2',
                    color: '#1a7a4a', border: '0.5px solid #c8e6d4', borderRadius: '10px',
                    fontSize: '13px', fontWeight: '700', cursor: 'pointer'
                  }}>✏️ Editar datos de empresa</button>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={labelStyle}>Nombre de la empresa</label>
                    <input value={empresaForm.nombre} onChange={e => setEmpresaForm({ ...empresaForm, nombre: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={labelStyle}>NIT</label>
                    <input value={empresaForm.nit} onChange={e => setEmpresaForm({ ...empresaForm, nit: e.target.value })} placeholder="900.123.456-7" style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setEditandoEmpresa(false)} style={{ flex: 1, padding: '10px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Cancelar</button>
                    <button onClick={guardarEmpresa} style={{ flex: 2, padding: '10px', background: 'linear-gradient(135deg, #1a7a4a, #f97316)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Guardar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB SEGURIDAD */}
        {tab === 'seguridad' && (
          <div>
            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '16px', border: '0.5px solid #c8e6d4' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a4a2e', marginBottom: '16px' }}>Cambiar contraseña</div>
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Nueva contraseña</label>
                <input type="password" value={passwordForm.nueva} onChange={e => setPasswordForm({ ...passwordForm, nueva: e.target.value })} placeholder="••••••••" style={inputStyle} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Confirmar contraseña</label>
                <input type="password" value={passwordForm.confirmar} onChange={e => setPasswordForm({ ...passwordForm, confirmar: e.target.value })} placeholder="••••••••" style={inputStyle} />
              </div>
              <button onClick={cambiarPassword} style={{
                width: '100%', padding: '12px',
                background: 'linear-gradient(135deg, #1a7a4a, #f97316)',
                color: '#fff', border: 'none', borderRadius: '10px',
                fontSize: '13px', fontWeight: '700', cursor: 'pointer'
              }}>Actualizar contraseña</button>
            </div>

            <button onClick={handleLogout} style={{
              width: '100%', padding: '14px',
              background: '#ffe4e4', color: '#e53e3e',
              border: 'none', borderRadius: '12px',
              fontSize: '14px', fontWeight: '700', cursor: 'pointer'
            }}>Cerrar sesión</button>
          </div>
        )}

        {/* TAB PLATAFORMA */}
        {tab === 'plataforma' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#4a7a5e', textTransform: 'uppercase' }}>Tipos de novedad</div>
              <div onClick={() => setMostrarFormTipo(!mostrarFormTipo)} style={{ fontSize: '12px', color: '#f97316', fontWeight: '700', cursor: 'pointer' }}>
                {mostrarFormTipo ? '✕ Cancelar' : '+ Nuevo tipo'}
              </div>
            </div>

            {mostrarFormTipo && (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', border: '0.5px solid #c8e6d4' }}>
                <label style={labelStyle}>Nombre del tipo</label>
                <input value={nuevoTipo} onChange={e => setNuevoTipo(e.target.value)} placeholder="Ej: Calamidad, Licencia..." style={{ ...inputStyle, marginBottom: '12px' }} />
                <button onClick={crearTipo} style={{
                  width: '100%', padding: '12px',
                  background: 'linear-gradient(135deg, #1a7a4a, #f97316)',
                  color: '#fff', border: 'none', borderRadius: '10px',
                  fontSize: '13px', fontWeight: '700', cursor: 'pointer'
                }}>Crear tipo</button>
              </div>
            )}

            {tiposNovedad.map(t => (
              <div key={t.id} style={{
                background: '#fff', borderRadius: '12px', padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: '10px',
                marginBottom: '8px', border: '0.5px solid #c8e6d4'
              }}>
                <i className="ti ti-tag" style={{ fontSize: '18px', color: '#1a7a4a' }} aria-hidden="true" />
                <div style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: '#1a4a2e' }}>{t.nombre}</div>
                <button onClick={() => eliminarTipo(t.id)} style={{
                  background: '#ffe4e4', color: '#e53e3e', border: 'none',
                  borderRadius: '8px', padding: '4px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
                }}>✕</button>
              </div>
            ))}

            {/* Info de versión */}
            <div style={{ textAlign: 'center', marginTop: '24px', color: '#7aaa8e', fontSize: '12px' }}>
              <div style={{ fontWeight: '700', marginBottom: '4px' }}>Kipu v1.0</div>
              <div>Plataforma de gestión de equipos</div>
            </div>
          </div>
        )}

      </div>

      {/* BOTTOM NAV */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff', borderTop: '0.5px solid #c8e6d4',
        display: 'flex', justifyContent: 'space-around', padding: '10px 0 14px'
      }}>
        {[
          { icon: 'ti-home', label: 'Inicio', path: '/admin' },
          { icon: 'ti-users', label: 'Equipo', path: '/trabajadores' },
          { icon: 'ti-bell', label: 'Novedades', path: '/novedades' },
          { icon: 'ti-chart-bar', label: 'Reportes', path: '/reportes' },
          { icon: 'ti-settings', label: 'Config', path: '/config', active: true },
        ].map((n, i) => (
          <div key={i} onClick={() => navigate(n.path)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer'
          }}>
            <i className={`ti ${n.icon}`} style={{ fontSize: '22px', color: n.active ? '#1a7a4a' : '#9abcaa' }} aria-hidden="true" />
            <span style={{ fontSize: '10px', color: n.active ? '#1a7a4a' : '#9abcaa', fontWeight: n.active ? '700' : '400' }}>{n.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
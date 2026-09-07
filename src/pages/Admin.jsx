import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Admin() {
  const navigate = useNavigate()
  const [areas, setAreas] = useState([])
  const [novedades, setNovedades] = useState([])
  const [trabajadores, setTrabajadores] = useState([])
  const [mostrarFormArea, setMostrarFormArea] = useState(false)
  const [nuevaArea, setNuevaArea] = useState({ nombre: '', color: '#1a7a4a' })
  const colores = ['#1a7a4a', '#f97316', '#0d9488', '#65a30d', '#7c3aed', '#db2777']

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate('/')
    })
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    const [a, n, t] = await Promise.all([
      supabase.from('areas').select('*'),
      supabase.from('novedades').select('*').eq('estado', 'pendiente'),
      supabase.from('trabajadores').select('*')
    ])
    if (a.data) setAreas(a.data)
    if (n.data) setNovedades(n.data)
    if (t.data) setTrabajadores(t.data)
  }

  const crearArea = async () => {
    if (!nuevaArea.nombre) return
    await supabase.from('areas').insert([nuevaArea])
    setNuevaArea({ nombre: '', color: '#1a7a4a' })
    setMostrarFormArea(false)
    cargarDatos()
  }

  const eliminarArea = async (id) => {
    await supabase.from('areas').delete().eq('id', id)
    cargarDatos()
  }

  const cambiarEstadoNovedad = async (id, estado) => {
    await supabase.from('novedades').update({ estado }).eq('id', id)
    cargarDatos()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const getNombreTrabajador = (id) => {
    const t = trabajadores.find(t => t.id === id)
    return t ? t.nombre : 'Trabajador'
  }

  const navItems = [
    { icon: 'ti-home', label: 'Inicio', path: '/admin' },
    { icon: 'ti-users', label: 'Equipo', path: '/trabajadores' },
    { icon: 'ti-bell', label: 'Novedades', path: '/novedades' },
    { icon: 'ti-chart-bar', label: 'Reportes', path: '/reportes' },
    { icon: 'ti-settings', label: 'Config', path: '/config' },
  ]

  return (
    <div style={{ background: '#f0f7f2', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'sans-serif' }}>

      {/* TOPBAR */}
      <div style={{
        background: 'linear-gradient(135deg, #1a7a4a 0%, #2eaa6a 60%, #f97316 100%)',
        padding: '14px 16px 20px', borderRadius: '0 0 28px 28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <svg viewBox="0 0 130 58" style={{ width: '110px', height: '48px' }} xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="28" width="114" height="26" rx="13" fill="rgba(255,255,255,0.22)" />
            <circle cx="28" cy="30" r="14" fill="rgba(255,255,255,0.22)" />
            <circle cx="62" cy="20" r="20" fill="rgba(255,255,255,0.22)" />
            <circle cx="100" cy="27" r="16" fill="rgba(255,255,255,0.22)" />
            <text x="65" y="42" textAnchor="middle" fontFamily="Nunito,sans-serif" fontSize="22" fontWeight="900" fill="#ffffff" letterSpacing="2">kipu</text>
          </svg>
          <button onClick={handleLogout} style={{
            background: 'rgba(255,255,255,0.22)', border: 'none', borderRadius: '20px',
            padding: '6px 14px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
          }}>Salir</button>
        </div>
        <div style={{ marginTop: '10px' }}>
          <p style={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}>Panel de administración</p>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px' }}>Planet Solar</span><br />
          <span style={{
            display: 'inline-block', background: 'rgba(255,255,255,0.22)', borderRadius: '20px',
            padding: '2px 10px', fontSize: '10px', fontWeight: '700', color: '#fff', marginTop: '4px'
          }}>✦ Admin Global</span>
        </div>
      </div>

      {/* CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '16px' }}>
        {[
          { label: 'Trabajadores', value: trabajadores.length, sub: `${areas.length} áreas activas` },
          { label: 'Activos hoy', value: trabajadores.length, sub: '0 ausentes' },
          { label: 'Novedades', value: novedades.length, sub: 'por aprobar', orange: true },
          { label: 'Incapacidades', value: '0', sub: 'activas', red: true },
        ].map((c, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: '14px', padding: '14px', border: '0.5px solid #c8e6d4' }}>
            <div style={{ fontSize: '10px', color: '#4a7a5e', fontWeight: '700', marginBottom: '5px', textTransform: 'uppercase' }}>{c.label}</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: c.orange ? '#f97316' : c.red ? '#e53e3e' : '#1a4a2e' }}>{c.value}</div>
            <div style={{ fontSize: '10px', color: '#7aaa8e', marginTop: '2px' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ACCESO RÁPIDO */}
      <div style={{ padding: '0 16px', marginBottom: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: '#4a7a5e', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '10px' }}>Acceso rápido</div>
        {[
          { icon: 'ti-users', label: 'Trabajadores', sub: 'Crear, editar o eliminar', color: '#e8f7ef', iconColor: '#1a7a4a', path: '/trabajadores' },
          { icon: 'ti-clipboard-list', label: 'Novedades', sub: 'Aprobar o rechazar solicitudes', color: '#fff0e6', iconColor: '#f97316', path: '/novedades' },
          { icon: 'ti-file-invoice', label: 'Colillas de pago', sub: 'Subir para todos los trabajadores', color: '#e0f7f4', iconColor: '#0d9488', path: '/colillas' },
          { icon: 'ti-calendar', label: 'Horarios y turnos', sub: 'Asignar y gestionar turnos', color: '#f0f9e8', iconColor: '#65a30d', path: '/turnos' },
        ].map((r, i) => (
          <div key={i} onClick={() => navigate(r.path)} style={{
            background: '#fff', borderRadius: '12px', padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '8px', border: '0.5px solid #c8e6d4', cursor: 'pointer'
          }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`ti ${r.icon}`} style={{ fontSize: '19px', color: r.iconColor }} aria-hidden="true" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a4a2e' }}>{r.label}</div>
              <div style={{ fontSize: '11px', color: '#7aaa8e', marginTop: '2px' }}>{r.sub}</div>
            </div>
            <i className="ti ti-chevron-right" style={{ color: '#c8e6d4', fontSize: '18px' }} aria-hidden="true" />
          </div>
        ))}
      </div>

      {/* ÁREAS */}
      <div style={{ padding: '0 16px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#4a7a5e', textTransform: 'uppercase' }}>Áreas</div>
          <div onClick={() => setMostrarFormArea(!mostrarFormArea)} style={{ fontSize: '12px', color: '#f97316', fontWeight: '700', cursor: 'pointer' }}>
            {mostrarFormArea ? '✕ Cancelar' : '+ Nueva'}
          </div>
        </div>

        {mostrarFormArea && (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', border: '0.5px solid #c8e6d4' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a7a5e', display: 'block', marginBottom: '6px' }}>Nombre del área</label>
            <input
              value={nuevaArea.nombre}
              onChange={e => setNuevaArea({ ...nuevaArea, nombre: e.target.value })}
              placeholder="Ej: Recursos Humanos"
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '0.5px solid #c8e6d4', fontSize: '13px', outline: 'none', marginBottom: '12px' }}
            />
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {colores.map(c => (
                <div key={c} onClick={() => setNuevaArea({ ...nuevaArea, color: c })} style={{
                  width: '28px', height: '28px', borderRadius: '50%', background: c, cursor: 'pointer',
                  border: nuevaArea.color === c ? '3px solid #1a4a2e' : '2px solid transparent'
                }} />
              ))}
            </div>
            <button onClick={crearArea} style={{
              width: '100%', padding: '12px', background: 'linear-gradient(135deg, #1a7a4a, #f97316)',
              color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer'
            }}>Crear área</button>
          </div>
        )}

        {areas.map((a, i) => (
          <div key={a.id} style={{
            background: '#fff', borderRadius: '12px', padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '8px', border: '0.5px solid #c8e6d4'
          }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: a.color || colores[i % colores.length], flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: '#1a4a2e' }}>{a.nombre}</div>
            <button onClick={() => eliminarArea(a.id)} style={{
              background: '#ffe4e4', color: '#e53e3e', border: 'none',
              borderRadius: '8px', padding: '4px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
            }}>✕</button>
          </div>
        ))}
      </div>

      {/* NOVEDADES PENDIENTES */}
      {novedades.length > 0 && (
        <div style={{ padding: '0 16px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#4a7a5e', textTransform: 'uppercase' }}>Novedades por aprobar</div>
            <div onClick={() => navigate('/novedades')} style={{ fontSize: '12px', color: '#f97316', fontWeight: '700', cursor: 'pointer' }}>Ver todas</div>
          </div>
          {novedades.slice(0, 3).map(n => (
            <div key={n.id} style={{
              background: '#fff', borderRadius: '12px', padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: '10px',
              marginBottom: '8px', border: '0.5px solid #c8e6d4'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a4a2e' }}>{getNombreTrabajador(n.trabajador_id)}</div>
                <div style={{ fontSize: '11px', color: '#7aaa8e', marginTop: '2px' }}>{n.descripcion || 'Sin descripción'}</div>
              </div>
              <button onClick={() => cambiarEstadoNovedad(n.id, 'aprobado')} style={{
                background: '#d1f5e0', color: '#1a7a4a', border: 'none',
                borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', marginRight: '6px'
              }}>✓</button>
              <button onClick={() => cambiarEstadoNovedad(n.id, 'rechazado')} style={{
                background: '#ffe4e4', color: '#e53e3e', border: 'none',
                borderRadius: '8px', padding: '5px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
              }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* BOTTOM NAV */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff', borderTop: '0.5px solid #c8e6d4',
        display: 'flex', justifyContent: 'space-around', padding: '10px 0 14px'
      }}>
        {navItems.map((n, i) => (
          <div key={i} onClick={() => navigate(n.path)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', minWidth: '50px', position: 'relative'
          }}>
            {n.label === 'Novedades' && novedades.length > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '4px',
                background: '#f97316', color: '#fff', fontSize: '9px', fontWeight: '700',
                borderRadius: '10px', padding: '1px 4px'
              }}>{novedades.length}</span>
            )}
            <i className={`ti ${n.icon}`} style={{ fontSize: '22px', color: i === 0 ? '#1a7a4a' : '#9abcaa' }} aria-hidden="true" />
            <span style={{ fontSize: '10px', color: i === 0 ? '#1a7a4a' : '#9abcaa', fontWeight: i === 0 ? '700' : '400' }}>{n.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
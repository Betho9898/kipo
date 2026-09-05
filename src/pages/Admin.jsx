import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Admin() {
  const navigate = useNavigate()
  const [areas, setAreas] = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nuevaArea, setNuevaArea] = useState({ nombre: '', color: '#1a7a4a' })
  const colores = ['#1a7a4a', '#f97316', '#0d9488', '#65a30d', '#7c3aed', '#db2777']

  useEffect(() => {
    cargarAreas()
  }, [])

  const cargarAreas = async () => {
    const { data } = await supabase.from('areas').select('*')
    if (data) setAreas(data)
  }

  const crearArea = async () => {
    if (!nuevaArea.nombre) return
    await supabase.from('areas').insert([nuevaArea])
    setNuevaArea({ nombre: '', color: '#1a7a4a' })
    setMostrarForm(false)
    cargarAreas()
  }

  const eliminarArea = async (id) => {
  await supabase.from('areas').delete().eq('id', id)
  cargarAreas()
}

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

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
            <text x="65" y="42" textAnchor="middle" fontFamily="Nunito,sans-serif" fontSize="22" fontWeight="900" fill="#ffffff" letterSpacing="2">kipo</text>
          </svg>
          <button onClick={handleLogout} style={{
            background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: '20px',
            padding: '6px 14px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
          }}>Salir</button>
        </div>
        <div style={{ marginTop: '10px' }}>
          <p style={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}>Panel de administración</p>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px' }}>Gestiona tu equipo desde aquí</span>
        </div>
      </div>

      {/* CARDS RESUMEN */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '16px' }}>
        {[
          { label: 'Trabajadores', value: '18', sub: '4 áreas activas' },
          { label: 'Activos hoy', value: '15', sub: '3 ausentes' },
          { label: 'Novedades', value: '5', sub: 'por aprobar', orange: true },
          { label: 'Incapacidades', value: '2', sub: 'activas', red: true },
        ].map((c, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: '14px', padding: '14px', border: '0.5px solid #c8e6d4' }}>
            <div style={{ fontSize: '10px', color: '#4a7a5e', fontWeight: '700', marginBottom: '5px', textTransform: 'uppercase' }}>{c.label}</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: c.orange ? '#f97316' : c.red ? '#e53e3e' : '#1a4a2e' }}>{c.value}</div>
            <div style={{ fontSize: '10px', color: '#7aaa8e', marginTop: '2px' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ÁREAS */}
      {/* ACCESO RÁPIDO */}
<div style={{ padding: '0 16px', marginBottom: '16px' }}>
  <div onClick={() => navigate('/trabajadores')} style={{
    background: '#fff', borderRadius: '12px', padding: '13px 14px',
    display: 'flex', alignItems: 'center', gap: '12px',
    border: '0.5px solid #c8e6d4', cursor: 'pointer'
  }}>
    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#e8f7ef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👥</div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a4a2e' }}>Gestionar trabajadores</div>
      <div style={{ fontSize: '11px', color: '#7aaa8e', marginTop: '2px' }}>Crear, editar o eliminar cuentas</div>
    </div>
    <span style={{ color: '#c8e6d4' }}>›</span>
  </div>
</div>
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#4a7a5e', textTransform: 'uppercase' }}>Áreas</div>
          <div onClick={() => setMostrarForm(!mostrarForm)} style={{ fontSize: '12px', color: '#f97316', fontWeight: '700', cursor: 'pointer' }}>
            {mostrarForm ? '✕ Cancelar' : '+ Nueva área'}
          </div>
        </div>

        {/* FORMULARIO NUEVA ÁREA */}
        {mostrarForm && (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', border: '0.5px solid #c8e6d4' }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a7a5e', display: 'block', marginBottom: '6px' }}>Nombre del área</label>
              <input
                value={nuevaArea.nombre}
                onChange={e => setNuevaArea({ ...nuevaArea, nombre: e.target.value })}
                placeholder="Ej: Recursos Humanos"
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '0.5px solid #c8e6d4', fontSize: '13px', outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a7a5e', display: 'block', marginBottom: '8px' }}>Color</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {colores.map(c => (
                  <div key={c} onClick={() => setNuevaArea({ ...nuevaArea, color: c })} style={{
                    width: '28px', height: '28px', borderRadius: '50%', background: c, cursor: 'pointer',
                    border: nuevaArea.color === c ? '3px solid #1a4a2e' : '2px solid transparent'
                  }} />
                ))}
              </div>
            </div>
            <button onClick={crearArea} style={{
              width: '100%', padding: '12px',
              background: 'linear-gradient(135deg, #1a7a4a, #f97316)',
              color: '#fff', border: 'none', borderRadius: '10px',
              fontSize: '13px', fontWeight: '700', cursor: 'pointer'
            }}>Crear área</button>
          </div>
        )}

        {areas.map((a, i) => (
          <div key={a.id} style={{
            background: '#fff', borderRadius: '12px', padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '8px', border: '0.5px solid #c8e6d4', cursor: 'pointer'
          }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: a.color || colores[i % colores.length], flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: '#1a4a2e' }}>{a.nombre}</div>
            <button onClick={(e) => { e.stopPropagation(); eliminarArea(a.id) }} style={{
  background: '#ffe4e4', color: '#e53e3e', border: 'none',
  borderRadius: '8px', padding: '4px 10px', fontSize: '12px',
  fontWeight: '700', cursor: 'pointer'
}}>✕</button>
          </div>
        ))}
      </div>

      {/* REPORTES */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: '#4a7a5e', textTransform: 'uppercase', marginBottom: '10px' }}>Reportes</div>
        {[
          { titulo: 'Informe semanal', desc: 'Asistencia y horas por área', bg: '#e8f7ef', icon: '📊' },
          { titulo: 'Horas extra', desc: 'Reporte del mes actual', bg: '#fff0e6', icon: '⏱️' },
          { titulo: 'Colillas masivas', desc: 'Subir para todos los trabajadores', bg: '#e0f7f4', icon: '📄' },
        ].map((r, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: '12px', padding: '13px 14px',
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '8px', border: '0.5px solid #c8e6d4', cursor: 'pointer'
          }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{r.icon}</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a4a2e' }}>{r.titulo}</div>
              <div style={{ fontSize: '11px', color: '#7aaa8e', marginTop: '2px' }}>{r.desc}</div>
            </div>
            <span style={{ marginLeft: 'auto', color: '#c8e6d4' }}>›</span>
          </div>
        ))}
      </div>

    </div>
  )
}
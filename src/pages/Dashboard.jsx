import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Dashboard() {
  const navigate = useNavigate()
  const [trabajador, setTrabajador] = useState(null)
  const [novedades, setNovedades] = useState([])
  const [tiposNovedad, setTiposNovedad] = useState([])
  const [colillas, setColillas] = useState([])
  const [turnosSemana, setTurnosSemana] = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nuevaNovedad, setNuevaNovedad] = useState({ tipo_novedad_id: '', descripcion: '', fecha_inicio: '', fecha_fin: '' })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/'); return }

    const { data: trab } = await supabase
      .from('trabajadores')
      .select('*')
      .eq('email', user.email)
      .single()

    if (trab) {
      setTrabajador(trab)
      const [n, t, c] = await Promise.all([
        supabase.from('novedades').select('*').eq('trabajador_id', trab.id),
        supabase.from('tipos_novedad').select('*'),
        supabase.from('colillas').select('*').eq('trabajador_id', trab.id)
      ])
      if (n.data) setNovedades(n.data)
      if (t.data) setTiposNovedad(t.data)
      if (c.data) setColillas(c.data)
        // Turnos de la semana actual
const hoy = new Date()
const lunes = new Date(hoy)
lunes.setDate(hoy.getDate() - hoy.getDay() + 1)
const domingo = new Date(lunes)
domingo.setDate(lunes.getDate() + 6)
const { data: turnData } = await supabase
  .from('turnos')
  .select('*')
  .eq('trabajador_id', trab.id)
  .gte('fecha', lunes.toISOString().split('T')[0])
  .lte('fecha', domingo.toISOString().split('T')[0])
  .order('fecha', { ascending: true })
if (turnData) setTurnosSemana(turnData)
    }
  }

  const solicitarNovedad = async () => {
    if (!nuevaNovedad.tipo_novedad_id || !trabajador) return
    await supabase.from('novedades').insert([{
      trabajador_id: trabajador.id,
      tipo_novedad_id: parseInt(nuevaNovedad.tipo_novedad_id),
      descripcion: nuevaNovedad.descripcion,
      fecha_inicio: nuevaNovedad.fecha_inicio || null,
      fecha_fin: nuevaNovedad.fecha_fin || null,
      estado: 'pendiente'
    }])
    setNuevaNovedad({ tipo_novedad_id: '', descripcion: '', fecha_inicio: '', fecha_fin: '' })
    setMostrarForm(false)
    cargarDatos()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const coloresEstado = {
    pendiente: { bg: '#fff0e6', color: '#c2500a', label: 'Pendiente' },
    aprobado: { bg: '#d1f5e0', color: '#1a7a4a', label: 'Aprobado' },
    rechazado: { bg: '#ffe4e4', color: '#e53e3e', label: 'Rechazado' }
  }

  const getNombreTipo = (id) => {
    const t = tiposNovedad.find(t => t.id === id)
    return t ? t.nombre : 'Novedad'
  }

 const inputStyle = {
    width: '100%', padding: '10px', borderRadius: '10px',
    border: '1.5px solid #4a7a5e', fontSize: '13px', outline: 'none'
  }

  const labelStyle = {
    fontSize: '11px', fontWeight: '700', color: '#4a7a5e',
    display: 'block', marginBottom: '6px'
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
            <text x="65" y="42" textAnchor="middle" fontFamily="Nunito,sans-serif" fontSize="22" fontWeight="900" fill="#ffffff" letterSpacing="2">kipu</text>
          </svg>
          <button onClick={handleLogout} style={{
            background: 'rgba(255,255,255,0.22)', border: 'none', borderRadius: '20px',
            padding: '6px 14px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
          }}>Salir</button>
        </div>
        <div style={{ marginTop: '10px' }}>
          <p style={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}>
            Hola, {trabajador?.nombre || 'Trabajador'} 👋
          </p>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px' }}>
            {trabajador?.rol || 'Trabajador'}
          </span>
        </div>
      </div>

      {/* CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '16px' }}>
        <div style={{ background: '#fff', borderRadius: '14px', padding: '14px', border: '0.5px solid #c8e6d4' }}>
          <div style={{ fontSize: '10px', color: '#4a7a5e', fontWeight: '700', marginBottom: '5px', textTransform: 'uppercase' }}>Novedades</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#f97316' }}>{novedades.filter(n => n.estado === 'pendiente').length}</div>
          <div style={{ fontSize: '10px', color: '#7aaa8e', marginTop: '2px' }}>pendientes</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '14px', padding: '14px', border: '0.5px solid #c8e6d4' }}>
          <div style={{ fontSize: '10px', color: '#4a7a5e', fontWeight: '700', marginBottom: '5px', textTransform: 'uppercase' }}>Colillas</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a4a2e' }}>{colillas.length}</div>
          <div style={{ fontSize: '10px', color: '#7aaa8e', marginTop: '2px' }}>disponibles</div>
        </div>
      </div>

      {/* NOVEDADES */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#4a7a5e', textTransform: 'uppercase' }}>Mis novedades</div>
          <div onClick={() => setMostrarForm(!mostrarForm)} style={{ fontSize: '12px', color: '#f97316', fontWeight: '700', cursor: 'pointer' }}>
            {mostrarForm ? '✕ Cancelar' : '+ Solicitar'}
          </div>
        </div>

        {/* FORMULARIO */}
        {mostrarForm && (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '16px 20px', marginBottom: '16px', border: '0.5px solid #c8e6d4' }}>
            
            {/* Tipo */}
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Tipo de novedad</label>
              <select
                value={nuevaNovedad.tipo_novedad_id}
                onChange={e => setNuevaNovedad({ ...nuevaNovedad, tipo_novedad_id: e.target.value })}
                style={{ ...inputStyle, background: '#fff' }}
              >
                <option value="">Seleccionar tipo</option>
                {tiposNovedad.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>

            {/* Fechas */}
<div style={{ display: 'flex', gap: '16px', marginBottom: '14px' }}>
  <div style={{ flex: 1 }}>
    <label style={labelStyle}>Desde</label>
    <input
      type="date"
      value={nuevaNovedad.fecha_inicio}
      onChange={e => setNuevaNovedad({ ...nuevaNovedad, fecha_inicio: e.target.value })}
      style={{ width: '90%', padding: '8px', borderRadius: '10px', border: '1.5px solid #4a7a5e', fontSize: '12px', outline: 'none', background: '#fff' }}
    />
  </div>
  <div style={{ flex: 1 }}>
    <label style={labelStyle}>Hasta</label>
    <input
      type="date"
      value={nuevaNovedad.fecha_fin}
      onChange={e => setNuevaNovedad({ ...nuevaNovedad, fecha_fin: e.target.value })}
      style={{ width: '90%', padding: '8px', borderRadius: '10px', border: '1.5px solid #4a7a5e', fontSize: '12px', outline: 'none', background: '#fff' }}
    />
  </div>
</div>

            {/* Descripción */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Descripción</label>
              <textarea
                value={nuevaNovedad.descripcion}
                onChange={e => setNuevaNovedad({ ...nuevaNovedad, descripcion: e.target.value })}
                placeholder="Explica tu solicitud..."
                rows={3}
                style={{ ...inputStyle, resize: 'none' }}
              />
            </div>

            <button onClick={solicitarNovedad} style={{
              width: '100%', padding: '12px',
              background: 'linear-gradient(135deg, #1a7a4a, #f97316)',
              color: '#fff', border: 'none', borderRadius: '10px',
              fontSize: '13px', fontWeight: '700', cursor: 'pointer'
            }}>Enviar solicitud</button>
          </div>
        )}

        {/* LISTA NOVEDADES */}
        {novedades.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px', color: '#7aaa8e', fontSize: '13px' }}>
            No tienes novedades — dale a + Solicitar
          </div>
        )}

        {novedades.map(n => (
          <div key={n.id} style={{
            background: '#fff', borderRadius: '12px', padding: '14px',
            marginBottom: '8px', border: '0.5px solid #c8e6d4'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a4a2e' }}>{getNombreTipo(n.tipo_novedad_id)}</div>
              <span style={{
                fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px',
                background: coloresEstado[n.estado]?.bg || '#f0f0f0',
                color: coloresEstado[n.estado]?.color || '#666'
              }}>{coloresEstado[n.estado]?.label}</span>
            </div>
            {(n.fecha_inicio || n.fecha_fin) && (
              <div style={{ fontSize: '11px', color: '#4a7a5e', marginBottom: '4px' }}>
                📅 {n.fecha_inicio || '?'} → {n.fecha_fin || '?'}
              </div>
            )}
            {n.descripcion && (
              <div style={{ fontSize: '12px', color: '#4a7a5e', marginBottom: '4px' }}>{n.descripcion}</div>
            )}
            {n.comentario && (
              <div style={{ fontSize: '11px', color: '#7aaa8e', fontStyle: 'italic', marginTop: '6px', padding: '8px', background: '#f0f7f2', borderRadius: '8px' }}>
                💬 Admin: {n.comentario}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* TURNOS */}
<div style={{ padding: '0 16px', marginBottom: '16px' }}>
  <div style={{ fontSize: '11px', fontWeight: '700', color: '#4a7a5e', textTransform: 'uppercase', marginBottom: '10px' }}>Mis turnos esta semana</div>
  {turnosSemana.length === 0 ? (
    <div style={{ textAlign: 'center', padding: '20px', color: '#7aaa8e', fontSize: '13px' }}>
      No tienes turnos programados esta semana
    </div>
  ) : (
    turnosSemana.map((t, i) => {
      const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
      const fecha = new Date(t.fecha + 'T00:00:00')
      const dia = dias[fecha.getDay() === 0 ? 6 : fecha.getDay() - 1]
      return (
        <div key={t.id} style={{
          background: '#fff', borderRadius: '12px', padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: '12px',
          marginBottom: '8px', border: '1.5px solid #7abf9a'
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e8f7ef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-calendar" style={{ fontSize: '20px', color: '#1a7a4a' }} aria-hidden="true" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a4a2e' }}>{dia} {t.fecha}</div>
            <div style={{ fontSize: '12px', color: '#4a7a5e', marginTop: '2px' }}>{t.hora_inicio} – {t.hora_fin}</div>
          </div>
          <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', background: '#d1f5e0', color: '#1a7a4a' }}>Programado</span>
        </div>
      )
    })
  )}
</div>
     {/* COLILLAS */}
      {colillas.length > 0 && (
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#4a7a5e', textTransform: 'uppercase', marginBottom: '10px' }}>Colillas de pago</div>
          {colillas.map(c => (
            <div key={c.id} style={{
              background: '#fff', borderRadius: '12px', padding: '13px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '8px', border: '0.5px solid #c8e6d4'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e8f7ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="ti ti-file-invoice" style={{ fontSize: '18px', color: '#1a7a4a' }} aria-hidden="true" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a4a2e' }}>{c.periodo}</div>
                  <div style={{ fontSize: '11px', color: '#7aaa8e' }}>Disponible</div>
                </div>
              </div>
              <a href={c.archivo_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#f97316', fontWeight: '700', textDecoration: 'none' }}>Ver ↗</a>
            </div>
          ))}
        </div>
      )}

      {/* BOTTOM NAV */}
<div style={{
  position: 'fixed', bottom: 0, left: 0, right: 0,
  background: '#fff', borderTop: '1.5px solid #7abf9a',
  display: 'flex', justifyContent: 'space-around', padding: '10px 0 14px'
}}>
  {[
          { icon: 'ti-home', label: 'Inicio', path: '/dashboard' },
          { icon: 'ti-clipboard-list', label: 'Novedades', path: '/novedades-trabajador' },
          { icon: 'ti-file-text', label: 'Colillas', path: '/colillas-trabajador' },
          { icon: 'ti-calendar', label: 'Turnos', path: '/turnos-trabajador' },
          { icon: 'ti-user', label: 'Perfil', path: '/perfil-trabajador' },
        ].map((n, i) => (
          <div key={i} onClick={() => navigate(n.path)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <i className={`ti ${n.icon}`} style={{ fontSize: '22px', color: i === 0 ? '#1a7a4a' : '#4a7a5e' }} aria-hidden="true" />
            <span style={{ fontSize: '10px', color: i === 0 ? '#1a7a4a' : '#4a7a5e', fontWeight: i === 0 ? '700' : '400' }}>{n.label}</span>
          </div>
        ))}
</div>
    </div>
  )
}
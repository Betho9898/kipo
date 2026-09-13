import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function NovedadesTrabajador() {
  const navigate = useNavigate()
  const [trabajador, setTrabajador] = useState(null)
  const [novedades, setNovedades] = useState([])
  const [tiposNovedad, setTiposNovedad] = useState([])
  const [cambiosRecibidos, setCambiosRecibidos] = useState([])
  const [cambiosEnviados, setCambiosEnviados] = useState([])
  const [turnos, setTurnos] = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nuevaNovedad, setNuevaNovedad] = useState({ tipo_novedad_id: '', descripcion: '', fecha_inicio: '', fecha_fin: '' })
  const [tab, setTab] = useState('novedades')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/'); return }

    const { data: trabData } = await supabase.from('trabajadores').select('*').eq('email', user.email)
    const trab = trabData?.[0]
    if (!trab) return
    setTrabajador(trab)

    const [n, t, cr, ce, tu] = await Promise.all([
      supabase.from('novedades').select('*').eq('trabajador_id', trab.id).order('created_at', { ascending: false }),
      supabase.from('tipos_novedad').select('*'),
      supabase.from('cambios_turno').select('*').eq('receptor_id', trab.id),
      supabase.from('cambios_turno').select('*').eq('solicitante_id', trab.id),
      supabase.from('turnos').select('*')
    ])
    if (n.data) setNovedades(n.data)
    if (t.data) setTiposNovedad(t.data)
    if (cr.data) setCambiosRecibidos(cr.data)
    if (ce.data) setCambiosEnviados(ce.data)
    if (tu.data) setTurnos(tu.data)
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

  const responderCambio = async (id, acepta) => {
    await supabase.from('cambios_turno').update({
      receptor_acepto: acepta,
      estado: acepta ? 'pendiente_admin' : 'rechazado',
      fecha_receptor: new Date().toISOString()
    }).eq('id', id)
    setMensaje(acepta ? '✅ Solicitud aceptada — pasa al administrador' : '✅ Solicitud rechazada')
    setTimeout(() => setMensaje(''), 3000)
    cargarDatos()
  }

  const getNombreTipo = (id) => {
    const t = tiposNovedad.find(t => t.id === id)
    return t ? t.nombre : 'Novedad'
  }

  const getTurno = (id) => turnos.find(t => t.id === id)

  const coloresEstado = {
    pendiente: { bg: '#fff0e6', color: '#c2500a', label: 'Pendiente' },
    aprobado: { bg: '#d1f5e0', color: '#1a7a4a', label: 'Aprobado' },
    rechazado: { bg: '#ffe4e4', color: '#e53e3e', label: 'Rechazado' },
    pendiente_admin: { bg: '#e0f7f4', color: '#0d9488', label: 'En revisión admin' }
  }

  const inputStyle = { width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #4a7a5e', fontSize: '13px', outline: 'none', background: '#fff', boxSizing: 'border-box' }
  const labelStyle = { fontSize: '11px', fontWeight: '700', color: '#4a7a5e', display: 'block', marginBottom: '6px' }

  const pendientesRecibidos = cambiosRecibidos.filter(c => c.estado === 'pendiente').length

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
          {tab === 'novedades' && (
            <button onClick={() => setMostrarForm(!mostrarForm)} style={{
              background: 'rgba(255,255,255,0.22)', border: 'none', borderRadius: '20px',
              padding: '6px 14px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
            }}>{mostrarForm ? '✕ Cancelar' : '+ Solicitar'}</button>
          )}
        </div>
        <div style={{ marginTop: '10px' }}>
          <p style={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}>Mis novedades</p>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px' }}>{novedades.length} solicitudes · {pendientesRecibidos > 0 ? `${pendientesRecibidos} cambios de turno pendientes` : ''}</span>
        </div>
      </div>

      {/* MENSAJE */}
      {mensaje && (
        <div style={{ margin: '12px 16px 0', padding: '10px 14px', borderRadius: '10px', background: '#e8f7ef', fontSize: '13px', fontWeight: '600', color: '#1a7a4a' }}>
          {mensaje}
        </div>
      )}

      {/* TABS */}
      <div style={{ display: 'flex', gap: '6px', padding: '16px 16px 0' }}>
        {[
          { id: 'novedades', label: 'Novedades' },
          { id: 'recibidos', label: `Cambios recibidos ${pendientesRecibidos > 0 ? `(${pendientesRecibidos})` : ''}` },
          { id: 'enviados', label: 'Enviados' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '8px 4px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: tab === t.id ? '#1a7a4a' : '#fff',
            color: tab === t.id ? '#fff' : '#4a7a5e',
            fontSize: '10px', fontWeight: '700',
            border: tab === t.id ? 'none' : '1px solid #a8d5b8'
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>

        {/* TAB NOVEDADES */}
        {tab === 'novedades' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Pendientes', value: novedades.filter(n => n.estado === 'pendiente').length, color: '#f97316' },
                { label: 'Aprobadas', value: novedades.filter(n => n.estado === 'aprobado').length, color: '#1a7a4a' },
                { label: 'Rechazadas', value: novedades.filter(n => n.estado === 'rechazado').length, color: '#e53e3e' },
              ].map((c, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: '14px', padding: '12px', border: '1.5px solid #7abf9a', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#4a7a5e', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{c.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: c.color }}>{c.value}</div>
                </div>
              ))}
            </div>

            {mostrarForm && (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '16px', border: '1.5px solid #7abf9a' }}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={labelStyle}>Tipo de novedad</label>
                  <select value={nuevaNovedad.tipo_novedad_id} onChange={e => setNuevaNovedad({ ...nuevaNovedad, tipo_novedad_id: e.target.value })} style={{ ...inputStyle, background: '#fff' }}>
                    <option value="">Seleccionar tipo</option>
                    {tiposNovedad.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Desde</label>
                    <input type="date" value={nuevaNovedad.fecha_inicio} onChange={e => setNuevaNovedad({ ...nuevaNovedad, fecha_inicio: e.target.value })} style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Hasta</label>
                    <input type="date" value={nuevaNovedad.fecha_fin} onChange={e => setNuevaNovedad({ ...nuevaNovedad, fecha_fin: e.target.value })} style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={labelStyle}>Descripción</label>
                  <textarea value={nuevaNovedad.descripcion} onChange={e => setNuevaNovedad({ ...nuevaNovedad, descripcion: e.target.value })} placeholder="Explica tu solicitud..." rows={3} style={{ ...inputStyle, resize: 'none' }} />
                </div>
                <button onClick={solicitarNovedad} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #1a7a4a, #f97316)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Enviar solicitud</button>
              </div>
            )}

            {novedades.length === 0 && <div style={{ textAlign: 'center', padding: '30px', color: '#7aaa8e', fontSize: '13px' }}>No tienes novedades — dale a + Solicitar</div>}

            {novedades.map(n => (
              <div key={n.id} style={{ background: '#fff', borderRadius: '12px', padding: '14px', marginBottom: '8px', border: '1.5px solid #7abf9a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a4a2e' }}>{getNombreTipo(n.tipo_novedad_id)}</div>
                  <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', background: coloresEstado[n.estado]?.bg, color: coloresEstado[n.estado]?.color }}>
                    {coloresEstado[n.estado]?.label}
                  </span>
                </div>
                {(n.fecha_inicio || n.fecha_fin) && <div style={{ fontSize: '11px', color: '#4a7a5e', marginBottom: '4px' }}>📅 {n.fecha_inicio} → {n.fecha_fin}</div>}
                {n.descripcion && <div style={{ fontSize: '12px', color: '#4a7a5e' }}>{n.descripcion}</div>}
                {n.comentario && <div style={{ fontSize: '11px', color: '#7aaa8e', fontStyle: 'italic', marginTop: '6px', padding: '8px', background: '#f0f7f2', borderRadius: '8px' }}>💬 Admin: {n.comentario}</div>}
              </div>
            ))}
          </div>
        )}

        {/* TAB CAMBIOS RECIBIDOS */}
        {tab === 'recibidos' && (
          <div>
            {cambiosRecibidos.length === 0 && <div style={{ textAlign: 'center', padding: '30px', color: '#7aaa8e', fontSize: '13px' }}>No tienes solicitudes de cambio recibidas</div>}
            {cambiosRecibidos.map(c => {
              const turnoSol = getTurno(c.turno_solicitante_id)
              const turnoRec = getTurno(c.turno_receptor_id)
              return (
                <div key={c.id} style={{ background: '#fff', borderRadius: '12px', padding: '14px', marginBottom: '8px', border: '1.5px solid #7abf9a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a4a2e' }}>🔄 Solicitud de cambio</div>
                      <div style={{ fontSize: '11px', color: '#7aaa8e', marginTop: '2px' }}>Te quiere cambiar el turno</div>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', background: coloresEstado[c.estado]?.bg || '#f0f0f0', color: coloresEstado[c.estado]?.color || '#666' }}>
                      {coloresEstado[c.estado]?.label || c.estado}
                    </span>
                  </div>
                  {turnoSol && <div style={{ fontSize: '11px', color: '#4a7a5e', marginBottom: '4px' }}>📅 Su turno: {turnoSol.fecha} · {turnoSol.hora_inicio}-{turnoSol.hora_fin}</div>}
                  {turnoRec && <div style={{ fontSize: '11px', color: '#4a7a5e', marginBottom: '8px' }}>📅 Tu turno: {turnoRec.fecha} · {turnoRec.hora_inicio}-{turnoRec.hora_fin}</div>}
                  {c.mensaje && <div style={{ fontSize: '12px', color: '#7aaa8e', marginBottom: '10px' }}>{c.mensaje}</div>}
                  {c.estado === 'pendiente' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => responderCambio(c.id, true)} style={{ flex: 1, padding: '10px', background: '#d1f5e0', color: '#1a7a4a', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>✓ Aceptar</button>
                      <button onClick={() => responderCambio(c.id, false)} style={{ flex: 1, padding: '10px', background: '#ffe4e4', color: '#e53e3e', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>✕ Rechazar</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* TAB ENVIADOS */}
        {tab === 'enviados' && (
          <div>
            {cambiosEnviados.length === 0 && <div style={{ textAlign: 'center', padding: '30px', color: '#7aaa8e', fontSize: '13px' }}>No has enviado solicitudes de cambio</div>}
            {cambiosEnviados.map(c => {
              const turnoSol = getTurno(c.turno_solicitante_id)
              const turnoRec = getTurno(c.turno_receptor_id)
              return (
                <div key={c.id} style={{ background: '#fff', borderRadius: '12px', padding: '14px', marginBottom: '8px', border: '1.5px solid #7abf9a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a4a2e' }}>🔄 Cambio solicitado</div>
                    <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', background: coloresEstado[c.estado]?.bg || '#f0f0f0', color: coloresEstado[c.estado]?.color || '#666' }}>
                      {coloresEstado[c.estado]?.label || c.estado}
                    </span>
                  </div>
                  {turnoSol && <div style={{ fontSize: '11px', color: '#4a7a5e', marginBottom: '4px' }}>📅 Mi turno: {turnoSol.fecha} · {turnoSol.hora_inicio}-{turnoSol.hora_fin}</div>}
                  {turnoRec && <div style={{ fontSize: '11px', color: '#4a7a5e', marginBottom: '4px' }}>📅 Su turno: {turnoRec.fecha} · {turnoRec.hora_inicio}-{turnoRec.hora_fin}</div>}
                  <div style={{ fontSize: '11px', color: '#7aaa8e', marginTop: '4px' }}>
                    {c.estado === 'pendiente' && '⏳ Esperando respuesta del compañero'}
                    {c.estado === 'pendiente_admin' && '⏳ Compañero aceptó — esperando admin'}
                    {c.estado === 'aprobado' && '✅ Cambio aprobado'}
                    {c.estado === 'rechazado' && '❌ Solicitud rechazada'}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1.5px solid #7abf9a', display: 'flex', justifyContent: 'space-around', padding: '10px 0 14px' }}>
        {[
          { icon: 'ti-home', label: 'Inicio', path: '/dashboard' },
          { icon: 'ti-clipboard-list', label: 'Novedades', path: '/novedades-trabajador', active: true },
          { icon: 'ti-file-text', label: 'Colillas', path: '/colillas-trabajador' },
          { icon: 'ti-calendar', label: 'Turnos', path: '/turnos-trabajador' },
          { icon: 'ti-user', label: 'Perfil', path: '/perfil-trabajador' },
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
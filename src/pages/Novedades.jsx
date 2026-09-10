import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Novedades() {
  const navigate = useNavigate()
  const [tiposNovedad, setTiposNovedad] = useState([])
  const [novedades, setNovedades] = useState([])
  const [trabajadores, setTrabajadores] = useState([])
  const [cambiosTurno, setCambiosTurno] = useState([])
  const [turnos, setTurnos] = useState([])
  const [mostrarFormTipo, setMostrarFormTipo] = useState(false)
  const [nuevoTipo, setNuevoTipo] = useState('')
  const [tab, setTab] = useState('novedades')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate('/')
    })
    cargarTodos()
  }, [])

  const cargarTodos = async () => {
    const [t, n, tr, ct, tu] = await Promise.all([
      supabase.from('tipos_novedad').select('*'),
      supabase.from('novedades').select('*'),
      supabase.from('trabajadores').select('*'),
      supabase.from('cambios_turno').select('*'),
      supabase.from('turnos').select('*')
    ])
    if (t.data) setTiposNovedad(t.data)
    if (n.data) setNovedades(n.data)
    if (tr.data) setTrabajadores(tr.data)
    if (ct.data) setCambiosTurno(ct.data)
    if (tu.data) setTurnos(tu.data)
  }

  const crearTipo = async () => {
    if (!nuevoTipo) return
    await supabase.from('tipos_novedad').insert([{ nombre: nuevoTipo }])
    setNuevoTipo('')
    setMostrarFormTipo(false)
    cargarTodos()
  }

  const eliminarTipo = async (id) => {
    await supabase.from('tipos_novedad').delete().eq('id', id)
    cargarTodos()
  }

  const cambiarEstado = async (id, estado) => {
    await supabase.from('novedades').update({ estado }).eq('id', id)
    cargarTodos()
  }

  const cambiarEstadoCambio = async (id, estado) => {
    await supabase.from('cambios_turno').update({ estado }).eq('id', id)
    cargarTodos()
  }

  const getNombreTrabajador = (id) => {
    const t = trabajadores.find(t => t.id === id)
    return t ? t.nombre : 'Desconocido'
  }

  const getNombreTipo = (id) => {
    const t = tiposNovedad.find(t => t.id === id)
    return t ? t.nombre : 'Sin tipo'
  }

  const getTurno = (id) => {
    return turnos.find(t => t.id === id)
  }

  const coloresEstado = {
    pendiente: { bg: '#fff0e6', color: '#c2500a' },
    aprobado: { bg: '#d1f5e0', color: '#1a7a4a' },
    rechazado: { bg: '#ffe4e4', color: '#e53e3e' }
  }

  const pendientesNovedades = novedades.filter(n => n.estado === 'pendiente').length
  const pendientesCambios = cambiosTurno.filter(c => c.estado === 'pendiente').length

  return (
    <div style={{ background: '#f0f7f2', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'sans-serif' }}>

      {/* TOPBAR */}
      <div style={{
        background: 'linear-gradient(135deg, #1a7a4a 0%, #2eaa6a 60%, #f97316 100%)',
        padding: '14px 16px 20px', borderRadius: '0 0 28px 28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate('/admin')} style={{
            background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: '20px',
            padding: '6px 14px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
          }}>← Volver</button>
        </div>
        <div style={{ marginTop: '10px' }}>
          <p style={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}>Novedades</p>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px' }}>
            {pendientesNovedades + pendientesCambios} pendientes por aprobar
          </span>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '8px', padding: '16px 16px 0' }}>
        {[
          { id: 'novedades', label: `Novedades ${pendientesNovedades > 0 ? `(${pendientesNovedades})` : ''}` },
          { id: 'cambios', label: `Cambios turno ${pendientesCambios > 0 ? `(${pendientesCambios})` : ''}` },
          { id: 'tipos', label: 'Tipos' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '8px 4px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: tab === t.id ? '#1a7a4a' : '#fff',
            color: tab === t.id ? '#fff' : '#4a7a5e',
            fontSize: '11px', fontWeight: '700',
            border: tab === t.id ? 'none' : '1px solid #a8d5b8'
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>

        {/* TAB NOVEDADES */}
        {tab === 'novedades' && (
          <div>
            {novedades.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#7aaa8e', fontSize: '13px' }}>
                No hay solicitudes aún
              </div>
            )}
            {novedades.map(n => (
              <div key={n.id} style={{ background: '#fff', borderRadius: '12px', padding: '14px', marginBottom: '8px', border: '1.5px solid #7abf9a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a4a2e' }}>{getNombreTrabajador(n.trabajador_id)}</div>
                    <div style={{ fontSize: '11px', color: '#7aaa8e', marginTop: '2px' }}>{getNombreTipo(n.tipo_novedad_id)}</div>
                    {(n.fecha_inicio || n.fecha_fin) && (
                      <div style={{ fontSize: '11px', color: '#4a7a5e', marginTop: '2px' }}>📅 {n.fecha_inicio} → {n.fecha_fin}</div>
                    )}
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', background: coloresEstado[n.estado]?.bg || '#f0f0f0', color: coloresEstado[n.estado]?.color || '#666' }}>
                    {n.estado}
                  </span>
                </div>
                {n.descripcion && <div style={{ fontSize: '12px', color: '#4a7a5e', marginBottom: '10px' }}>{n.descripcion}</div>}
                {n.estado === 'pendiente' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => cambiarEstado(n.id, 'aprobado')} style={{ flex: 1, padding: '8px', background: '#d1f5e0', color: '#1a7a4a', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>✓ Aprobar</button>
                    <button onClick={() => cambiarEstado(n.id, 'rechazado')} style={{ flex: 1, padding: '8px', background: '#ffe4e4', color: '#e53e3e', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>✕ Rechazar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB CAMBIOS DE TURNO */}
        {tab === 'cambios' && (
          <div>
            {cambiosTurno.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#7aaa8e', fontSize: '13px' }}>
                No hay solicitudes de cambio de turno
              </div>
            )}
            {cambiosTurno.map(c => {
              const turnoSol = getTurno(c.turno_solicitante_id)
              const turnoRec = getTurno(c.turno_receptor_id)
              return (
                <div key={c.id} style={{ background: '#fff', borderRadius: '12px', padding: '14px', marginBottom: '8px', border: '1.5px solid #7abf9a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a4a2e' }}>
                        🔄 {getNombreTrabajador(c.solicitante_id)} → {getNombreTrabajador(c.receptor_id)}
                      </div>
                      {turnoSol && (
                        <div style={{ fontSize: '11px', color: '#4a7a5e', marginTop: '4px' }}>
                          📅 {turnoSol.fecha} · {turnoSol.hora_inicio}-{turnoSol.hora_fin}
                        </div>
                      )}
                      {turnoRec && (
                        <div style={{ fontSize: '11px', color: '#7aaa8e', marginTop: '2px' }}>
                          ↕ {turnoRec.fecha} · {turnoRec.hora_inicio}-{turnoRec.hora_fin}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', background: coloresEstado[c.estado]?.bg || '#f0f0f0', color: coloresEstado[c.estado]?.color || '#666' }}>
                      {c.estado}
                    </span>
                  </div>
                  {c.mensaje && <div style={{ fontSize: '12px', color: '#4a7a5e', marginBottom: '10px' }}>{c.mensaje}</div>}
                  {c.estado === 'pendiente' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => cambiarEstadoCambio(c.id, 'aprobado')} style={{ flex: 1, padding: '8px', background: '#d1f5e0', color: '#1a7a4a', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>✓ Aprobar</button>
                      <button onClick={() => cambiarEstadoCambio(c.id, 'rechazado')} style={{ flex: 1, padding: '8px', background: '#ffe4e4', color: '#e53e3e', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>✕ Rechazar</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* TAB TIPOS */}
        {tab === 'tipos' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#4a7a5e', textTransform: 'uppercase' }}>Tipos de novedad</div>
              <div onClick={() => setMostrarFormTipo(!mostrarFormTipo)} style={{ fontSize: '12px', color: '#f97316', fontWeight: '700', cursor: 'pointer' }}>
                {mostrarFormTipo ? '✕ Cancelar' : '+ Nuevo tipo'}
              </div>
            </div>

            {mostrarFormTipo && (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', border: '1.5px solid #7abf9a' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a7a5e', display: 'block', marginBottom: '6px' }}>Nombre del tipo</label>
                <input value={nuevoTipo} onChange={e => setNuevoTipo(e.target.value)} placeholder="Ej: Vacaciones, Permiso..." style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #4a7a5e', fontSize: '13px', outline: 'none', marginBottom: '12px', boxSizing: 'border-box' }} />
                <button onClick={crearTipo} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #1a7a4a, #f97316)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>Crear tipo</button>
              </div>
            )}

            {tiposNovedad.map(t => (
              <div key={t.id} style={{ background: '#fff', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', border: '1.5px solid #7abf9a' }}>
                <div style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: '#1a4a2e' }}>{t.nombre}</div>
                <button onClick={() => eliminarTipo(t.id)} style={{ background: '#ffe4e4', color: '#e53e3e', border: 'none', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>✕</button>
              </div>
            ))}

            {tiposNovedad.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#7aaa8e', fontSize: '13px' }}>No hay tipos creados aún</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function TurnosTrabajador() {
  const navigate = useNavigate()
  const [trabajador, setTrabajador] = useState(null)
  const [turnos, setTurnos] = useState([])
  const [turnosEquipo, setTurnosEquipo] = useState([])
  const [compañeros, setCompañeros] = useState([])
  const [semanaInicio, setSemanaInicio] = useState('')
  const [tab, setTab] = useState('miturno')
  const [modalCambio, setModalCambio] = useState(null)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    const hoy = new Date()
    const lunes = new Date(hoy)
    lunes.setDate(hoy.getDate() - (hoy.getDay() === 0 ? 6 : hoy.getDay() - 1))
    setSemanaInicio(lunes.toISOString().split('T')[0])
    cargarDatos(lunes)
  }, [])

  const cargarDatos = async (lunes) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/'); return }

    const { data: trabData } = await supabase.from('trabajadores').select('*').eq('email', user.email)
const trab = trabData?.[0]
if (!trab) return
setTrabajador(trab)

    const domingo = new Date(lunes)
    domingo.setDate(lunes.getDate() + 6)
    const ini = lunes.toISOString().split('T')[0]
    const fin = domingo.toISOString().split('T')[0]

    const [misTurnos, compas, todosTurnos] = await Promise.all([
      supabase.from('turnos').select('*').eq('trabajador_id', trab.id).gte('fecha', ini).lte('fecha', fin).order('fecha'),
      supabase.from('trabajadores').select('*').eq('area_id', trab.area_id),
      supabase.from('turnos').select('*').gte('fecha', ini).lte('fecha', fin)
    ])

    if (misTurnos.data) setTurnos(misTurnos.data)
    if (compas.data) setCompañeros(compas.data)
    if (todosTurnos.data) setTurnosEquipo(todosTurnos.data)
  }

  const cambiarSemana = (dias) => {
    const nueva = new Date(semanaInicio + 'T00:00:00')
    nueva.setDate(nueva.getDate() + dias)
    setSemanaInicio(nueva.toISOString().split('T')[0])
    cargarDatos(nueva)
  }

  const solicitarCambio = async () => {
    if (!modalCambio || !trabajador) return
    const miTurno = turnos.find(t => t.fecha === modalCambio.fecha)
    if (!miTurno) {
      setMensaje('❌ No tienes turno ese día para intercambiar')
      setTimeout(() => setMensaje(''), 3000)
      setModalCambio(null)
      return
    }
    await supabase.from('cambios_turno').insert([{
      solicitante_id: trabajador.id,
      receptor_id: modalCambio.trabajador_id,
      turno_solicitante_id: miTurno.id,
      turno_receptor_id: modalCambio.id,
      estado: 'pendiente',
      mensaje: `Solicitud de cambio de turno del ${miTurno.fecha}`
    }])
    setModalCambio(null)
    setMensaje('✅ Solicitud de cambio enviada')
    setTimeout(() => setMensaje(''), 3000)
  }

  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  const getDia = (fecha) => {
    const d = new Date(fecha + 'T00:00:00')
    return diasSemana[d.getDay() === 0 ? 6 : d.getDay() - 1]
  }

  const formatFecha = (fecha) => {
    const d = new Date(fecha + 'T00:00:00')
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
  }

  const horasTrabajadas = (inicio, fin) => {
    const [h1, m1] = inicio.split(':').map(Number)
    const [h2, m2] = fin.split(':').map(Number)
    return ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60
  }

  const totalHoras = turnos.reduce((acc, t) => acc + horasTrabajadas(t.hora_inicio, t.hora_fin), 0)

  const getTurnoCompañero = (trabajadorId, diaIndex) => {
    if (!semanaInicio) return null
    const fecha = new Date(semanaInicio + 'T00:00:00')
    fecha.setDate(fecha.getDate() + diaIndex)
    const fechaStr = fecha.toISOString().split('T')[0]
    return turnosEquipo.find(t => t.trabajador_id === trabajadorId && t.fecha === fechaStr)
  }

  const coloresTurno = (turno) => {
    if (!turno) return { bg: '#f1f5f9', text: '#94a3b8' }
    const hi = turno.hora_inicio?.substring(0, 5)
    if (hi === '07:00') return { bg: '#d1fae5', text: '#065f46' }
    if (hi === '08:00') return { bg: '#dbeafe', text: '#1e40af' }
    if (hi === '06:00') return { bg: '#ede9fe', text: '#4c1d95' }
    return { bg: '#f0fdf4', text: '#166534' }
  }

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
          <p style={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}>Turnos</p>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px' }}>{turnos.length} turnos · {totalHoras.toFixed(0)}h esta semana</span>
        </div>
      </div>

      {/* MENSAJE */}
      {mensaje && (
        <div style={{ margin: '12px 16px 0', padding: '10px 14px', borderRadius: '10px', background: mensaje.includes('✅') ? '#e8f7ef' : '#ffe4e4', fontSize: '13px', fontWeight: '600', color: mensaje.includes('✅') ? '#1a7a4a' : '#e53e3e' }}>
          {mensaje}
        </div>
      )}

      <div style={{ padding: '16px' }}>

        {/* NAVEGADOR SEMANA */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '12px 16px', marginBottom: '16px', border: '1.5px solid #7abf9a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => cambiarSemana(-7)} style={{ background: '#f0f7f2', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '16px', cursor: 'pointer', color: '#1a7a4a', fontWeight: '700' }}>←</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a4a2e' }}>
              Semana del {semanaInicio ? new Date(semanaInicio + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : ''}
            </div>
          </div>
          <button onClick={() => cambiarSemana(7)} style={{ background: '#f0f7f2', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '16px', cursor: 'pointer', color: '#1a7a4a', fontWeight: '700' }}>→</button>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {[
            { id: 'miturno', label: '📅 Mi turno' },
            { id: 'equipo', label: '👥 Mi equipo' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: tab === t.id ? '#1a7a4a' : '#fff',
              color: tab === t.id ? '#fff' : '#4a7a5e',
              fontSize: '12px', fontWeight: '700',
              border: tab === t.id ? 'none' : '1px solid #a8d5b8'
            }}>{t.label}</button>
          ))}
        </div>

        {/* MI TURNO */}
        {tab === 'miturno' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: '#fff', borderRadius: '14px', padding: '14px', border: '1.5px solid #7abf9a' }}>
                <div style={{ fontSize: '10px', color: '#4a7a5e', fontWeight: '700', marginBottom: '5px', textTransform: 'uppercase' }}>Días trabajados</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a4a2e' }}>{turnos.length}</div>
              </div>
              <div style={{ background: '#fff', borderRadius: '14px', padding: '14px', border: '1.5px solid #7abf9a' }}>
                <div style={{ fontSize: '10px', color: '#4a7a5e', fontWeight: '700', marginBottom: '5px', textTransform: 'uppercase' }}>Total horas</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#0d9488' }}>{totalHoras.toFixed(0)}h</div>
              </div>
            </div>

            {turnos.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#7aaa8e', fontSize: '14px' }}>
                No tienes turnos programados esta semana
              </div>
            )}

            {turnos.map(t => (
              <div key={t.id} style={{
                background: '#fff', borderRadius: '12px', padding: '14px',
                display: 'flex', alignItems: 'center', gap: '12px',
                marginBottom: '8px', border: '1.5px solid #7abf9a'
              }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#e8f7ef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="ti ti-calendar" style={{ fontSize: '22px', color: '#1a7a4a' }} aria-hidden="true" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a4a2e' }}>{getDia(t.fecha)}</div>
                  <div style={{ fontSize: '11px', color: '#7aaa8e', marginTop: '2px' }}>{formatFecha(t.fecha)}</div>
                  <div style={{ fontSize: '12px', color: '#4a7a5e', marginTop: '2px' }}>{t.hora_inicio} – {t.hora_fin}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0d9488' }}>{horasTrabajadas(t.hora_inicio, t.hora_fin)}h</div>
                  <span style={{ fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', background: '#d1f5e0', color: '#1a7a4a' }}>Programado</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EQUIPO */}
        {tab === 'equipo' && (
          <div>
            <p style={{ fontSize: '12px', color: '#7aaa8e', marginBottom: '12px' }}>
              Toca el turno de un compañero para solicitar un cambio
            </p>
            <div style={{ background: '#fff', borderRadius: '14px', border: '1.5px solid #7abf9a', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                <thead>
                  <tr style={{ background: '#1a7a4a' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#fff', fontWeight: '700', minWidth: '90px' }}>Compañero</th>
                    {diasSemana.slice(0, 6).map((d, i) => (
                      <th key={i} style={{ padding: '8px 4px', textAlign: 'center', fontSize: '10px', fontWeight: '700', color: '#fff', minWidth: '55px' }}>{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compañeros.filter(c => c.id !== trabajador?.id).map((comp, ci) => (
                    <tr key={comp.id} style={{ borderBottom: '1px solid #f0f7f2', background: ci % 2 === 0 ? '#fff' : '#f8fdf9' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#1a4a2e' }}>{comp.nombre?.split(' ')[0]}</div>
                      </td>
                      {diasSemana.slice(0, 6).map((_, dIdx) => {
                        const turno = getTurnoCompañero(comp.id, dIdx)
                        const col = coloresTurno(turno)
                        const esMiTurno = comp.id === trabajador?.id
                        return (
                          <td key={dIdx} style={{ padding: '4px', textAlign: 'center' }}>
                            <div
                              onClick={() => turno && !esMiTurno && setModalCambio(turno)}
                              style={{
                                borderRadius: '8px', padding: '5px 3px',
                                background: col.bg,
                                border: `1.5px solid ${col.text}40`,
                                cursor: turno ? 'pointer' : 'default',
                                minHeight: '40px',
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center'
                              }}
                            >
                              {turno ? (
                                <>
                                  <div style={{ fontSize: '9px', fontWeight: '700', color: col.text }}>{turno.hora_inicio?.substring(0, 5)}</div>
                                  <div style={{ fontSize: '8px', color: col.text, opacity: 0.8 }}>{turno.hora_fin?.substring(0, 5)}</div>
                                </>
                              ) : (
                                <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '600' }}>DESC</div>
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CAMBIO */}
      {modalCambio && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px', width: '100%', maxWidth: '480px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: '700', color: '#1a4a2e' }}>🔄 Solicitar cambio de turno</h3>
            <div style={{ background: '#f0f7f2', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#4a7a5e', marginBottom: '4px' }}>Turno a intercambiar:</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a4a2e' }}>{modalCambio.fecha}</div>
              <div style={{ fontSize: '13px', color: '#4a7a5e' }}>{modalCambio.hora_inicio} – {modalCambio.hora_fin}</div>
            </div>
            <p style={{ fontSize: '12px', color: '#7aaa8e', marginBottom: '16px' }}>
              Se enviará una solicitud de cambio al compañero y al administrador para su aprobación.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setModalCambio(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #a8d5b8', background: '#fff', color: '#4a7a5e', fontWeight: '700', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={solicitarCambio} style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #1a7a4a, #f97316)', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>Enviar solicitud</button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1.5px solid #7abf9a', display: 'flex', justifyContent: 'space-around', padding: '10px 0 14px' }}>
        {[
          { icon: 'ti-home', label: 'Inicio', path: '/dashboard' },
          { icon: 'ti-clipboard-list', label: 'Novedades', path: '/novedades-trabajador' },
          { icon: 'ti-file-text', label: 'Colillas', path: '/colillas-trabajador' },
          { icon: 'ti-calendar', label: 'Turnos', path: '/turnos-trabajador', active: true },
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
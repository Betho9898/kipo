import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function getMonthWeeks(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const weeks = []
  let current = new Date(firstDay)
  const dow = current.getDay()
  current.setDate(current.getDate() - (dow === 0 ? 6 : dow - 1))
  while (current <= lastDay) {
    const week = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

function formatDate(d) {
  return d.toISOString().split('T')[0]
}

function colorTurno(tipo) {
  if (!tipo) return { bg: '#f1f5f9', text: '#94a3b8', border: '#e2e8f0' }
  const t = tipo.toLowerCase()
  if (t.includes('mañana') || t.includes('manana')) return { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' }
  if (t.includes('tarde')) return { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' }
  if (t.includes('noche')) return { bg: '#ede9fe', text: '#4c1d95', border: '#c4b5fd' }
  if (t.includes('descanso') || t.includes('libre')) return { bg: '#f1f5f9', text: '#94a3b8', border: '#cbd5e0' }
  if (t.includes('vacacion')) return { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' }
  if (t.includes('incapacidad')) return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' }
  if (t.includes('permiso')) return { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' }
  if (t.includes('cita')) return { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' }
  return { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' }
}

export default function TurnosTrabajador() {
  const today = new Date()
  const [mes, setMes] = useState(today.getMonth())
  const [año, setAño] = useState(today.getFullYear())
  const [tab, setTab] = useState('mi')
  const [misTurnos, setMisTurnos] = useState([])
  const [equipoTurnos, setEquipoTurnos] = useState([])
  const [trabajadores, setTrabajadores] = useState([])
  const [yo, setYo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modalData, setModalData] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [solicitudesRecibidas, setSolicitudesRecibidas] = useState([])
  const [showSolicitudes, setShowSolicitudes] = useState(false)
  const [toast, setToast] = useState('')

  const weeks = getMonthWeeks(año, mes)

  useEffect(() => { init() }, [])
  useEffect(() => {
    if (yo && trabajadores.length > 0) {
      fetchTurnosDirecto(yo, trabajadores, mes, año)
    }
  }, [mes, año])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: trab } = await supabase
      .from('trabajadores').select('*').eq('email', user.email).single()
    setYo(trab)
    const { data: todos } = await supabase.from('trabajadores').select('*')
    setTrabajadores(todos || [])
    setLoading(false)
    if (trab && todos) await fetchTurnosDirecto(trab, todos, today.getMonth(), today.getFullYear())
  }

  async function fetchTurnosDirecto(trabajador, listaTrab, mesActual, añoActual) {
    const start = formatDate(new Date(añoActual, mesActual, 1))
    const end = formatDate(new Date(añoActual, mesActual + 1, 0))
    const { data: mt } = await supabase.from('turnos').select('*')
      .eq('trabajador_id', trabajador.id).gte('fecha', start).lte('fecha', end)
    setMisTurnos(mt || [])
    const compas = listaTrab.filter(t => t.area_id === trabajador.area_id)
    const ids = compas.map(t => t.id)
    if (ids.length > 0) {
      const { data: et } = await supabase.from('turnos').select('*')
        .in('trabajador_id', ids).gte('fecha', start).lte('fecha', end)
      setEquipoTurnos(et || [])
    }
    const { data: sr } = await supabase.from('cambios_turno').select('*')
      .eq('receptor_id', trabajador.id).eq('estado', 'pendiente')
    setSolicitudesRecibidas(sr || [])
  }

  async function enviarSolicitud() {
    if (!modalData) return
    setEnviando(true)
    const fechaStr = formatDate(modalData.diaObj)
    const miTurnoDelDia = misTurnos.find(t => t.fecha === fechaStr)
    await supabase.from('cambios_turno').insert({
      solicitante_id: yo.id,
      receptor_id: modalData.turnoReceptor.trabajador_id,
      turno_solicitante_id: miTurnoDelDia?.id || null,
      turno_receptor_id: modalData.turnoReceptor.id,
      estado: 'pendiente',
      mensaje: mensaje
    })
    setEnviando(false)
    setModalData(null)
    setMensaje('')
    showToast('✅ Solicitud enviada correctamente')
    fetchTurnosDirecto(yo, trabajadores, mes, año)
  }

  async function responderSolicitud(id, respuesta) {
    await supabase.from('cambios_turno').update({ estado: respuesta }).eq('id', id)
    showToast(respuesta === 'aceptado' ? '✅ Cambio aceptado' : '❌ Cambio rechazado')
    fetchTurnosDirecto(yo, trabajadores, mes, año)
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function getNombre(id) {
    const t = trabajadores.find(t => t.id === id)
    return t ? t.nombre : 'Desconocido'
  }

  const companerosArea = trabajadores.filter(t => t.area_id === yo?.area_id)

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center', color: '#4a7a5e' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
        <div style={{ fontWeight: '700', fontFamily: 'Nunito, sans-serif' }}>Cargando turnos...</div>
      </div>
    </div>
  )

  return (
    <div style={{ paddingBottom: '80px', fontFamily: 'Nunito, sans-serif', background: '#f8fafc', minHeight: '100vh' }}>

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          background: '#1a7a4a', color: '#fff', padding: '12px 24px',
          borderRadius: '12px', fontWeight: '700', fontSize: '14px',
          zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>{toast}</div>
      )}

      {/* HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, #1a7a4a 0%, #2eaa6a 60%, #f97316 100%)',
        padding: '24px 20px 16px', color: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900' }}>📅 Turnos</h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', opacity: 0.85 }}>{yo?.nombre}</p>
          </div>
          {solicitudesRecibidas.length > 0 && (
            <button onClick={() => setShowSolicitudes(true)} style={{
              background: '#f97316', border: 'none', borderRadius: '20px',
              color: '#fff', padding: '8px 14px', fontSize: '13px', fontWeight: '700', cursor: 'pointer'
            }}>🔔 {solicitudesRecibidas.length}</button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '8px 12px' }}>
          <button onClick={() => { if (mes === 0) { setMes(11); setAño(a => a - 1) } else setMes(m => m - 1) }}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer', fontWeight: '700' }}>‹</button>
          <span style={{ fontWeight: '800', fontSize: '16px' }}>{MESES[mes]} {año}</span>
          <button onClick={() => { if (mes === 11) { setMes(0); setAño(a => a + 1) } else setMes(m => m + 1) }}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer', fontWeight: '700' }}>›</button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '2px solid #f0f7f2' }}>
        {[['mi', '📅 Mi Horario'], ['equipo', '👥 Mi Equipo']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            flex: 1, padding: '14px', border: 'none', cursor: 'pointer', background: 'transparent',
            color: tab === key ? '#1a7a4a' : '#94a3b8', fontWeight: '700', fontSize: '14px',
            borderBottom: tab === key ? '3px solid #1a7a4a' : '3px solid transparent',
            fontFamily: 'Nunito, sans-serif'
          }}>{label}</button>
        ))}
      </div>

      {/* ── MI HORARIO ── */}
      {tab === 'mi' && (
        <div style={{ padding: '16px' }}>

          {/* LEYENDA */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {[
              { label: 'Mañana', color: '#d1fae5', text: '#065f46' },
              { label: 'Tarde', color: '#fef3c7', text: '#92400e' },
              { label: 'Noche', color: '#ede9fe', text: '#4c1d95' },
              { label: 'Descanso', color: '#f1f5f9', text: '#94a3b8' },
              { label: 'Permiso', color: '#ffedd5', text: '#9a3412' },
              { label: 'Cita', color: '#dbeafe', text: '#1e40af' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: l.color, border: `1px solid ${l.text}` }} />
                <span style={{ fontSize: '10px', color: '#718096', fontWeight: '600' }}>{l.label}</span>
              </div>
            ))}
          </div>

          {/* CALENDARIO */}
          <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

            {/* CABECERA DÍAS */}
            <div style={{ display: 'grid', gridTemplateColumns: '32px repeat(7, 1fr)', background: '#1a7a4a' }}>
              <div style={{ padding: '10px 4px' }} />
              {DIAS.map(d => (
                <div key={d} style={{ padding: '10px 2px', textAlign: 'center', fontSize: '12px', fontWeight: '800', color: '#fff' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* FILAS SEMANAS */}
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'grid', gridTemplateColumns: '32px repeat(7, 1fr)', borderBottom: '1px solid #f0f7f2' }}>
                {/* Número semana */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRight: '1px solid #f0f7f2' }}>
                  <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '700' }}>S{wi + 1}</span>
                </div>
                {/* Días */}
                {week.map((dia, di) => {
                  const turno = misTurnos.find(t => t.fecha === formatDate(dia))
                  const esHoy = formatDate(dia) === formatDate(today)
                  const esMesActual = dia.getMonth() === mes
                  const col = colorTurno(turno?.tipo)
                  return (
                    <div key={di} style={{
                      padding: '6px 2px', minHeight: '80px',
                      background: esHoy ? '#f0fdf4' : '#fff',
                      borderRight: di < 6 ? '1px solid #f0f7f2' : 'none',
                      opacity: esMesActual ? 1 : 0.35,
                      display: 'flex', flexDirection: 'column', alignItems: 'center'
                    }}>
                      {/* NÚMERO */}
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: esHoy ? '#1a7a4a' : 'transparent',
                        color: esHoy ? '#fff' : esMesActual ? '#1a202c' : '#718096',
                        fontSize: '14px', fontWeight: '900',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '4px'
                      }}>
                        {dia.getDate()}
                      </div>
                      {/* TURNO */}
                      {turno && (
                        <div style={{
                          width: '100%', borderRadius: '6px',
                          background: col.bg, border: `1px solid ${col.border}`,
                          padding: '3px 2px', textAlign: 'center'
                        }}>
                          <div style={{ fontSize: '9px', fontWeight: '800', color: col.text }}>
                            {turno.tipo?.substring(0, 4) || '✓'}
                          </div>
                          {turno.hora_inicio && (
                            <div style={{ fontSize: '7px', color: col.text, opacity: 0.8 }}>
                              {turno.hora_inicio.substring(0, 5)}
                            </div>
                          )}
                          {turno.hora_fin && (
                            <div style={{ fontSize: '7px', color: col.text, opacity: 0.8 }}>
                              {turno.hora_fin.substring(0, 5)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* RESUMEN */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#1a7a4a' }}>{misTurnos.length}</div>
              <div style={{ fontSize: '12px', color: '#718096', fontWeight: '600' }}>Días trabajados</div>
            </div>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#f97316' }}>
                {misTurnos.reduce((acc, t) => {
                  if (!t.hora_inicio || !t.hora_fin) return acc
                  const [h1, m1] = t.hora_inicio.split(':').map(Number)
                  const [h2, m2] = t.hora_fin.split(':').map(Number)
                  return acc + ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60
                }, 0).toFixed(0)}h
              </div>
              <div style={{ fontSize: '12px', color: '#718096', fontWeight: '600' }}>Total horas</div>
            </div>
          </div>
        </div>
      )}

      {/* ── MI EQUIPO ── */}
      {tab === 'equipo' && (
        <div style={{ padding: '16px' }}>
          <p style={{ fontSize: '13px', color: '#4a7a5e', marginBottom: '16px', fontWeight: '600', background: '#f0fdf4', padding: '10px 14px', borderRadius: '10px', border: '1px solid #6ee7b7' }}>
            💡 Toca el turno de un compañero para solicitar un cambio
          </p>

          {weeks.map((week, wi) => (
            <div key={wi} style={{ marginBottom: '16px', background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ background: '#1a7a4a', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#a7f3d0' }}>Semana {wi + 1}</span>
                <span style={{ fontSize: '11px', color: '#fff', opacity: 0.8 }}>
                  {week[0].getDate()} – {week[6].getDate()} {MESES[week[6].getMonth()]}
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '11px', color: '#718096', fontWeight: '700', minWidth: '90px', borderBottom: '1px solid #f0f7f2' }}>Asesor</th>
                      {week.map((dia, i) => {
                        const esHoy = formatDate(dia) === formatDate(today)
                        const esMes = dia.getMonth() === mes
                        return (
                          <th key={i} style={{ padding: '8px 4px', textAlign: 'center', fontSize: '11px', fontWeight: '800', borderBottom: '1px solid #f0f7f2', color: esHoy ? '#1a7a4a' : '#1a202c', background: esHoy ? '#f0fdf4' : '#f8fafc', opacity: esMes ? 1 : 0.4 }}>
                            <div style={{ fontSize: '10px', color: esHoy ? '#1a7a4a' : '#718096' }}>{DIAS[i]}</div>
                            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: esHoy ? '#1a7a4a' : 'transparent', color: esHoy ? '#fff' : '#1a202c', fontSize: '13px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px auto 0' }}>
                              {dia.getDate()}
                            </div>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {companerosArea.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                          No hay compañeros en tu área
                        </td>
                      </tr>
                    ) : (
                      companerosArea.map((comp, ci) => (
                        <tr key={comp.id} style={{ borderBottom: '1px solid #f0f7f2', background: ci % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding: '8px 10px', verticalAlign: 'middle' }}>
                            <div style={{ fontSize: '12px', fontWeight: '800', color: comp.id === yo?.id ? '#1a7a4a' : '#1a202c' }}>
                              {comp.id === yo?.id ? '⭐ Yo' : comp.nombre?.split(' ')[0]}
                            </div>
                            <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '600' }}>{comp.cargo}</div>
                          </td>
                          {week.map((dia, di) => {
                            const turno = equipoTurnos.find(t => t.trabajador_id === comp.id && t.fecha === formatDate(dia))
                            const col = colorTurno(turno?.tipo)
                            const esYo = comp.id === yo?.id
                            const esHoy = formatDate(dia) === formatDate(today)
                            const esMes = dia.getMonth() === mes
                            return (
                              <td key={di} style={{ padding: '4px', textAlign: 'center', opacity: esMes ? 1 : 0.3, background: esHoy ? '#f0fdf4' : 'transparent' }}>
                                {turno ? (
                                  <div
                                    onClick={() => { if (!esYo) setModalData({ turnoReceptor: turno, comp, diaObj: dia }) }}
                                    style={{ borderRadius: '8px', padding: '4px 3px', background: col.bg, border: `1.5px ${!esYo ? 'dashed' : 'solid'} ${!esYo ? '#f97316' : col.border}`, cursor: !esYo ? 'pointer' : 'default', transition: 'transform 0.15s' }}
                                    onMouseEnter={e => { if (!esYo) e.currentTarget.style.transform = 'scale(1.08)' }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                                  >
                                    <div style={{ fontSize: '9px', fontWeight: '800', color: col.text }}>{turno.tipo?.substring(0, 3) || '✓'}</div>
                                    <div style={{ fontSize: '8px', color: col.text, opacity: 0.8 }}>{turno.hora_inicio?.substring(0, 5)}</div>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '14px', color: '#e2e8f0' }}>–</div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL SOLICITUD ── */}
      {modalData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '32px' }}>🔄</div>
              <h3 style={{ margin: '8px 0 4px', fontSize: '17px', fontWeight: '900', color: '#1a202c' }}>Solicitar cambio de turno</h3>
              <p style={{ fontSize: '13px', color: '#718096', margin: 0 }}>
                Con <strong>{modalData.comp.nombre}</strong> el{' '}
                <strong>{DIAS[modalData.diaObj.getDay() === 0 ? 6 : modalData.diaObj.getDay() - 1]} {modalData.diaObj.getDate()} de {MESES[modalData.diaObj.getMonth()]}</strong>
              </p>
            </div>
            <div style={{ background: '#f0f7f2', borderRadius: '12px', padding: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#4a7a5e', fontWeight: '700', marginBottom: '4px' }}>Turno a solicitar:</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#1a7a4a' }}>{modalData.turnoReceptor.tipo || 'Turno'}</div>
              {modalData.turnoReceptor.hora_inicio && (
                <div style={{ fontSize: '13px', color: '#4a7a5e', marginTop: '2px' }}>
                  🕐 {modalData.turnoReceptor.hora_inicio.substring(0, 5)} – {modalData.turnoReceptor.hora_fin?.substring(0, 5)}
                </div>
              )}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#4a7a5e', display: 'block', marginBottom: '6px' }}>Mensaje (opcional)</label>
              <textarea value={mensaje} onChange={e => setMensaje(e.target.value)} placeholder="Ej: Tengo una cita médica ese día..." rows={3}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #4a7a5e', fontSize: '13px', fontFamily: 'Nunito, sans-serif', resize: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setModalData(null); setMensaje('') }} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#fff', color: '#718096', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>Cancelar</button>
              <button onClick={enviarSolicitud} disabled={enviando} style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #1a7a4a, #f97316)', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '14px', opacity: enviando ? 0.7 : 1 }}>
                {enviando ? 'Enviando...' : '📨 Enviar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL SOLICITUDES RECIBIDAS ── */}
      {showSolicitudes && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '17px', fontWeight: '900', color: '#1a202c' }}>🔔 Solicitudes recibidas</h3>
            {solicitudesRecibidas.map(sol => (
              <div key={sol.id} style={{ background: '#f0f7f2', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#1a202c', marginBottom: '4px' }}>
                  🔄 {getNombre(sol.solicitante_id)} quiere cambiar turno contigo
                </div>
                {sol.mensaje && <div style={{ fontSize: '12px', color: '#4a7a5e', marginBottom: '10px', fontStyle: 'italic' }}>"{sol.mensaje}"</div>}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => responderSolicitud(sol.id, 'rechazado')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '2px solid #fed7d7', background: '#fff5f5', color: '#e53e3e', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>❌ Rechazar</button>
                  <button onClick={() => responderSolicitud(sol.id, 'aceptado')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #1a7a4a, #2eaa6a)', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>✅ Aceptar</button>
                </div>
              </div>
            ))}
            <button onClick={() => setShowSolicitudes(false)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#fff', color: '#718096', fontWeight: '700', cursor: 'pointer', marginTop: '8px' }}>Cerrar</button>
          </div>
        </div>
      )}

    </div>
  )
}

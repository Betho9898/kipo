import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const DIAS_KEYS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']

export default function Turnos() {
  const navigate = useNavigate()
  const [trabajadores, setTrabajadores] = useState([])
  const [areas, setAreas] = useState([])
  const [turnos, setTurnos] = useState([])
  const [configs, setConfigs] = useState({})
  const [semanaInicio, setSemanaInicio] = useState('')
  const [generando, setGenerando] = useState(false)
  const [vistaArea, setVistaArea] = useState('todas')
  const [tab, setTab] = useState('calendario')
  const [areaConfig, setAreaConfig] = useState(null)
  const [editandoTurno, setEditandoTurno] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate('/')
    })
    cargarDatos()
    const hoy = new Date()
    const lunes = new Date(hoy)
    lunes.setDate(hoy.getDate() - (hoy.getDay() === 0 ? 6 : hoy.getDay() - 1))
    setSemanaInicio(lunes.toISOString().split('T')[0])
  }, [])

  const cargarDatos = async () => {
    const [t, a, tu, cf] = await Promise.all([
      supabase.from('trabajadores').select('*'),
      supabase.from('areas').select('*'),
      supabase.from('turnos').select('*'),
      supabase.from('configuracion_turnos').select('*')
    ])
    if (t.data) setTrabajadores(t.data)
    if (a.data) setAreas(a.data)
    if (tu.data) setTurnos(tu.data)
    if (cf.data) {
      const cfMap = {}
      cf.data.forEach(c => {
        cfMap[c.area_id] = {
          dias_trabajo: JSON.parse(c.dias_trabajo || '[]'),
          turnos: JSON.parse(c.turnos || '[]'),
          dias_rotan: JSON.parse(c.dias_rotan || '[]'),
          tipo_rotacion: c.tipo_rotacion || 'semana',
          sabado_activo: c.sabado_activo || false,
          sabado_cantidad: c.sabado_cantidad || 2,
          sabado_inicio: c.sabado_inicio || '07:00',
          sabado_fin: c.sabado_fin || '13:00'
        }
      })
      setConfigs(cfMap)
    }
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const getColorArea = (idx) => {
    const colores = ['#1a7a4a', '#f97316', '#0d9488', '#7c3aed', '#db2777', '#65a30d']
    return colores[idx % colores.length]
  }

  const guardarConfig = async (areaId, config) => {
    const payload = {
      area_id: areaId,
      dias_trabajo: JSON.stringify(config.dias_trabajo),
      turnos: JSON.stringify(config.turnos),
      dias_rotan: JSON.stringify(config.dias_rotan),
      tipo_rotacion: config.tipo_rotacion,
      sabado_activo: config.sabado_activo,
      sabado_cantidad: config.sabado_cantidad,
      sabado_inicio: config.sabado_inicio,
      sabado_fin: config.sabado_fin
    }
    if (configs[areaId]) {
      await supabase.from('configuracion_turnos').update(payload).eq('area_id', areaId)
    } else {
      await supabase.from('configuracion_turnos').insert(payload)
    }
    await cargarDatos()
    showToast('✅ Configuración guardada')
    setAreaConfig(null)
  }

  const generarTurnos = async () => {
    if (!semanaInicio) return
    setGenerando(true)
    const inicio = new Date(semanaInicio + 'T00:00:00')
    const fin = new Date(inicio)
    fin.setDate(inicio.getDate() + 6)
    const numSemana = Math.ceil((inicio - new Date(inicio.getFullYear(), 0, 1)) / 604800000)
    const turnosNuevos = []

    for (const area of areas) {
      const config = configs[area.id]
      if (!config) continue
      const trabsArea = trabajadores.filter(t => t.area_id === area.id)
      if (trabsArea.length === 0) continue

      for (let i = 0; i < trabsArea.length; i++) {
        const trabajador = trabsArea[i]
        for (let diaIdx = 0; diaIdx < 5; diaIdx++) {
          const diaKey = DIAS_KEYS[diaIdx]
          if (!config.dias_trabajo.includes(diaKey)) continue
          const fecha = new Date(inicio)
          fecha.setDate(inicio.getDate() + diaIdx)
          let horaInicio, horaFin, tipo

          const diasSiempreFijos = ['lun', 'mar']
const esFijo = diasSiempreFijos.includes(diaKey)

if (esFijo) {
  // Lunes y martes siempre usan el primer turno
  const tf = config.turnos[0]
  horaInicio = tf.inicio; horaFin = tf.fin; tipo = tf.nombre
} else {
  // Miércoles, jueves, viernes rotan entre los turnos restantes
  const turnosRotan = config.turnos.slice(1)
  if (turnosRotan.length === 0) {
    const tf = config.turnos[0]
    horaInicio = tf.inicio; horaFin = tf.fin; tipo = tf.nombre
  } else {
    const turnoIdx = (i + diaIdx + numSemana) % turnosRotan.length
    const tc = turnosRotan[turnoIdx]
    horaInicio = tc.inicio; horaFin = tc.fin; tipo = tc.nombre
  }
}

          if (horaInicio && horaFin) {
            turnosNuevos.push({
              trabajador_id: trabajador.id,
              area_id: trabajador.area_id,
              fecha: fecha.toISOString().split('T')[0],
              hora_inicio: horaInicio,
              hora_fin: horaFin,
              tipo: tipo || 'Turno'
            })
          }
        }
      }

      if (config.sabado_activo && config.sabado_cantidad > 0) {
        const fechaSab = new Date(inicio)
        fechaSab.setDate(inicio.getDate() + 5)
        const cantidad = Math.min(config.sabado_cantidad, trabsArea.length)
        const offset = (numSemana * cantidad) % trabsArea.length
        for (let k = 0; k < cantidad; k++) {
          const idx = (offset + k) % trabsArea.length
          turnosNuevos.push({
            trabajador_id: trabsArea[idx].id,
            area_id: trabsArea[idx].area_id,
            fecha: fechaSab.toISOString().split('T')[0],
            hora_inicio: config.sabado_inicio,
            hora_fin: config.sabado_fin,
            tipo: 'Sábado'
          })
        }
      }
    }

    await supabase.from('turnos').delete()
      .gte('fecha', inicio.toISOString().split('T')[0])
      .lte('fecha', fin.toISOString().split('T')[0])
    if (turnosNuevos.length > 0) {
      await supabase.from('turnos').insert(turnosNuevos)
    }
    await cargarDatos()
    setGenerando(false)
    showToast(`✅ ${turnosNuevos.length} turnos generados`)
  }

  const guardarEdicionTurno = async () => {
    if (!editandoTurno) return
    if (editandoTurno.id) {
      await supabase.from('turnos').update({
        hora_inicio: editandoTurno.hora_inicio,
        hora_fin: editandoTurno.hora_fin,
        tipo: editandoTurno.tipo
      }).eq('id', editandoTurno.id)
    } else {
      await supabase.from('turnos').insert({
        trabajador_id: editandoTurno.trabajador_id,
        area_id: editandoTurno.area_id,
        fecha: editandoTurno.fecha,
        hora_inicio: editandoTurno.hora_inicio,
        hora_fin: editandoTurno.hora_fin,
        tipo: editandoTurno.tipo || 'Turno'
      })
    }
    await cargarDatos()
    setEditandoTurno(null)
    showToast('✅ Turno actualizado')
  }

  const getTurno = (trabajadorId, diaIndex) => {
    if (!semanaInicio) return null
    const fecha = new Date(semanaInicio + 'T00:00:00')
    fecha.setDate(fecha.getDate() + diaIndex)
    return turnos.find(t => t.trabajador_id === trabajadorId && t.fecha === fecha.toISOString().split('T')[0])
  }

  const getFechaStr = (diaIndex) => {
    if (!semanaInicio) return ''
    const fecha = new Date(semanaInicio + 'T00:00:00')
    fecha.setDate(fecha.getDate() + diaIndex)
    return fecha.toISOString().split('T')[0]
  }

  const colorTurno = (turno) => {
    if (!turno) return { bg: '#f1f5f9', text: '#94a3b8' }
    if (turno.tipo === 'Sábado') return { bg: '#fce7f3', text: '#9d174d' }
    const hi = turno.hora_inicio?.substring(0, 5)
    const hf = turno.hora_fin?.substring(0, 5)
    if (hi === '07:00' && hf === '17:00') return { bg: '#d1fae5', text: '#065f46' }
    if (hi === '07:00' && hf === '17:00') return { bg: '#fef3c7', text: '#92400e' }
    if (hi === '08:00' && hf === '17:00') return { bg: '#dbeafe', text: '#1e40af' }
    if (hi === '06:00') return { bg: '#ede9fe', text: '#4c1d95' }
    return { bg: '#f0fdf4', text: '#166534' }
  }

  const areasFiltradas = vistaArea === 'todas' ? areas : areas.filter(a => a.id === parseInt(vistaArea))

  const diasConFecha = DIAS_SEMANA.map((d, i) => {
    if (!semanaInicio) return { label: d, num: '' }
    const fecha = new Date(semanaInicio + 'T00:00:00')
    fecha.setDate(fecha.getDate() + i)
    return { label: d, num: fecha.getDate() }
  })

  return (
    <div style={{ background: '#f0f7f2', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'Nunito, sans-serif' }}>

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
        padding: '20px 16px 24px', borderRadius: '0 0 28px 28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <button onClick={() => navigate('/admin')} style={{
            background: 'rgba(255,255,255,0.22)', border: 'none', borderRadius: '20px',
            padding: '6px 14px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
          }}>← Volver</button>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '17px', fontWeight: '900' }}>📅 Turnos</h2>
          <div style={{ width: '70px' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '8px 12px' }}>
          <button onClick={() => {
            const d = new Date(semanaInicio + 'T00:00:00')
            d.setDate(d.getDate() - 7)
            setSemanaInicio(d.toISOString().split('T')[0])
          }} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer', fontWeight: '700' }}>‹</button>
          <div style={{ color: '#fff', fontWeight: '800', fontSize: '15px' }}>
            {semanaInicio ? (() => {
              const ini = new Date(semanaInicio + 'T00:00:00')
              const fin = new Date(semanaInicio + 'T00:00:00')
              fin.setDate(fin.getDate() + 6)
              return `${ini.getDate()} – ${fin.getDate()} ${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][fin.getMonth()]} ${fin.getFullYear()}`
            })() : ''}
          </div>
          <button onClick={() => {
            const d = new Date(semanaInicio + 'T00:00:00')
            d.setDate(d.getDate() + 7)
            setSemanaInicio(d.toISOString().split('T')[0])
          }} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer', fontWeight: '700' }}>›</button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>

        {/* TABS */}
        <div style={{ display: 'flex', background: '#fff', borderRadius: '12px', padding: '4px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {[['calendario', '📅 Calendario'], ['configurar', '⚙️ Configurar'], ['generar', '⚡ Generar']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: '10px 4px', border: 'none', borderRadius: '10px', cursor: 'pointer',
              background: tab === key ? 'linear-gradient(135deg, #1a7a4a, #2eaa6a)' : 'transparent',
              color: tab === key ? '#fff' : '#4a7a5e',
              fontWeight: '700', fontSize: '11px', fontFamily: 'Nunito, sans-serif'
            }}>{label}</button>
          ))}
        </div>

        {/* ── CALENDARIO ── */}
        {tab === 'calendario' && (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
              <button onClick={() => setVistaArea('todas')} style={{
                padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', flexShrink: 0,
                background: vistaArea === 'todas' ? '#1a7a4a' : '#fff',
                color: vistaArea === 'todas' ? '#fff' : '#4a7a5e',
                fontSize: '12px', fontWeight: '700', boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
              }}>Todas</button>
              {areas.map((a, i) => (
                <button key={a.id} onClick={() => setVistaArea(String(a.id))} style={{
                  padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', flexShrink: 0,
                  background: vistaArea === String(a.id) ? getColorArea(i) : '#fff',
                  color: vistaArea === String(a.id) ? '#fff' : '#4a7a5e',
                  fontSize: '12px', fontWeight: '700', boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                }}>{a.nombre}</button>
              ))}
            </div>

            {/* LEYENDA */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {[
                { label: '7am-5pm', bg: '#d1fae5', text: '#065f46' },
                { label: '7am-4pm', bg: '#fef3c7', text: '#92400e' },
                { label: '8am-5pm', bg: '#dbeafe', text: '#1e40af' },
                { label: 'Sábado', bg: '#fce7f3', text: '#9d174d' },
                { label: 'Descanso', bg: '#f1f5f9', text: '#94a3b8' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: l.bg, border: `1px solid ${l.text}` }} />
                  <span style={{ fontSize: '10px', color: '#718096', fontWeight: '600' }}>{l.label}</span>
                </div>
              ))}
            </div>

            {/* TABLA POR ÁREA */}
            {areasFiltradas.map((area, areaIdx) => {
              const trabsArea = trabajadores.filter(t => t.area_id === area.id)
              if (trabsArea.length === 0) return null
              return (
                <div key={area.id} style={{ marginBottom: '20px', background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <div style={{ background: getColorArea(areaIdx), padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: '900', color: '#fff' }}>📍 {area.nombre}</span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>{trabsArea.length} personas</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '580px' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', color: '#718096', fontWeight: '700', minWidth: '100px', borderBottom: '1px solid #f0f7f2' }}>
                            Trabajador
                          </th>
                          {diasConFecha.map((d, i) => (
                            <th key={i} style={{
                              padding: '8px 4px', textAlign: 'center', fontSize: '10px',
                              fontWeight: '800', borderBottom: '1px solid #f0f7f2',
                              color: i === 6 ? '#e53e3e' : i === 5 ? '#9d174d' : '#718096',
                              minWidth: '60px',
                              background: i === 6 ? '#fff5f5' : i === 5 ? '#fdf2f8' : '#f8fafc'
                            }}>
                              <div>{d.label}</div>
                              <div style={{ fontSize: '14px', fontWeight: '900', color: i === 6 ? '#e53e3e' : '#1a202c' }}>{d.num}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {trabsArea.map((trab, ti) => (
                          <tr key={trab.id} style={{ borderBottom: '1px solid #f0f7f2', background: ti % 2 === 0 ? '#fff' : '#fafafa' }}>
                            <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                              <div style={{ fontSize: '12px', fontWeight: '800', color: '#1a202c' }}>{trab.nombre?.split(' ')[0]}</div>
                              <div style={{ fontSize: '9px', color: '#94a3b8' }}>{trab.cargo}</div>
                            </td>
                            {DIAS_SEMANA.map((_, dIdx) => {
                              const turno = getTurno(trab.id, dIdx)
                              const esDomingo = dIdx === 6
                              const esSabado = dIdx === 5
                              const esDescanso = !turno && (esDomingo || esSabado)
                              const col = colorTurno(turno)
                              const fechaStr = getFechaStr(dIdx)

                              return (
                                <td key={dIdx} style={{
                                  padding: '4px', textAlign: 'center',
                                  background: esDomingo ? '#fff5f5' : esSabado && !turno ? '#fdf2f8' : 'transparent'
                                }}>
                                  <div
                                    onClick={() => {
                                      if (esDomingo) return
                                      setEditandoTurno(turno ? { ...turno } : {
                                        trabajador_id: trab.id,
                                        area_id: trab.area_id,
                                        fecha: fechaStr,
                                        hora_inicio: '07:00',
                                        hora_fin: '17:00',
                                        tipo: 'Mañana'
                                      })
                                    }}
                                    style={{
                                      borderRadius: '8px', padding: '5px 3px',
                                      background: esDomingo ? '#fee2e2' : esDescanso ? '#f1f5f9' : col.bg,
                                      border: `1.5px solid ${esDomingo ? '#fca5a5' : esDescanso ? '#e2e8f0' : col.text + '40'}`,
                                      cursor: esDomingo ? 'default' : 'pointer',
                                      minHeight: '44px',
                                      display: 'flex', flexDirection: 'column',
                                      alignItems: 'center', justifyContent: 'center',
                                      transition: 'transform 0.1s'
                                    }}
                                    onMouseEnter={e => { if (!esDomingo) e.currentTarget.style.transform = 'scale(1.05)' }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                                  >
                                    {esDomingo ? (
                                      <div style={{ fontSize: '9px', fontWeight: '800', color: '#e53e3e' }}>DESC</div>
                                    ) : turno ? (
                                      <>
                                        <div style={{ fontSize: '9px', fontWeight: '800', color: col.text }}>{turno.hora_inicio?.substring(0, 5)}</div>
                                        <div style={{ fontSize: '8px', color: col.text, opacity: 0.8 }}>{turno.hora_fin?.substring(0, 5)}</div>
                                        {turno.tipo && <div style={{ fontSize: '7px', color: col.text, opacity: 0.7, marginTop: '1px' }}>{turno.tipo?.substring(0, 3)}</div>}
                                      </>
                                    ) : (
                                      <div style={{ fontSize: '9px', fontWeight: '800', color: '#94a3b8' }}>DESC</div>
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
              )
            })}
          </>
        )}

        {/* ── CONFIGURAR ── */}
        {tab === 'configurar' && (
          <div>
            <p style={{ fontSize: '13px', color: '#4a7a5e', marginBottom: '16px', fontWeight: '600' }}>
              ⚙️ Configura los turnos por área
            </p>
            {areas.map((area, areaIdx) => {
              const config = configs[area.id] || {
                dias_trabajo: ['lun', 'mar', 'mie', 'jue', 'vie'],
                turnos: [{ nombre: 'Turno A', inicio: '07:00', fin: '17:00' }],
                dias_rotan: ['mie', 'jue', 'vie'],
                tipo_rotacion: 'semana',
                sabado_activo: false,
                sabado_cantidad: 2,
                sabado_inicio: '07:00',
                sabado_fin: '13:00'
              }
              const isOpen = areaConfig?.id === area.id
              return (
                <div key={area.id} style={{ background: '#fff', borderRadius: '16px', marginBottom: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <div style={{ background: getColorArea(areaIdx), padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '900', color: '#fff' }}>📍 {area.nombre}</span>
                    <button onClick={() => setAreaConfig(isOpen ? null : { id: area.id, ...config })}
                      style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: '10px', color: '#fff', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                      {isOpen ? 'Cerrar' : '✏️ Editar'}
                    </button>
                  </div>

                  {/* Resumen */}
                  {!isOpen && (
                    <div style={{ padding: '12px 16px' }}>
                      {configs[area.id] ? (
                        <>
                          <div style={{ fontSize: '11px', color: '#4a7a5e', fontWeight: '600' }}>
                            📅 Días: {configs[area.id].dias_trabajo.map(d => DIAS_SEMANA[DIAS_KEYS.indexOf(d)]).join(', ')}
                          </div>
                          <div style={{ fontSize: '11px', color: '#4a7a5e', fontWeight: '600', marginTop: '4px' }}>
                            🔄 Turnos: {configs[area.id].turnos.map(t => `${t.nombre} (${t.inicio}-${t.fin})`).join(' | ')}
                          </div>
                          {configs[area.id].sabado_activo && (
                            <div style={{ fontSize: '11px', color: '#9d174d', fontWeight: '600', marginTop: '4px' }}>
                              🗓️ Sáb: {configs[area.id].sabado_cantidad} personas · {configs[area.id].sabado_inicio}-{configs[area.id].sabado_fin}
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ fontSize: '11px', color: '#f97316', fontWeight: '600' }}>⚠️ Sin configuración</div>
                      )}
                    </div>
                  )}

                  {/* Editor */}
                  {isOpen && (
                    <div style={{ padding: '16px' }}>

                      {/* DÍAS LUN-VIE */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#4a7a5e', marginBottom: '8px' }}>📅 Días de trabajo:</div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {DIAS_KEYS.slice(0, 5).map((key, i) => (
                            <button key={key} onClick={() => {
                              const dias = areaConfig.dias_trabajo.includes(key)
                                ? areaConfig.dias_trabajo.filter(d => d !== key)
                                : [...areaConfig.dias_trabajo, key]
                              setAreaConfig({ ...areaConfig, dias_trabajo: dias })
                            }} style={{
                              padding: '8px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                              background: areaConfig.dias_trabajo.includes(key) ? '#1a7a4a' : '#f0f7f2',
                              color: areaConfig.dias_trabajo.includes(key) ? '#fff' : '#4a7a5e',
                              fontSize: '13px', fontWeight: '700'
                            }}>{DIAS_SEMANA[i]}</button>
                          ))}
                        </div>
                      </div>

                      {/* TURNOS */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#4a7a5e', marginBottom: '8px' }}>🕐 Turnos disponibles:</div>
                        {areaConfig.turnos.map((turno, ti) => (
                          <div key={ti} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center', background: '#f8fafc', padding: '8px', borderRadius: '10px' }}>
                            <input value={turno.nombre} onChange={e => {
                              const t = [...areaConfig.turnos]; t[ti].nombre = e.target.value
                              setAreaConfig({ ...areaConfig, turnos: t })
                            }} placeholder="Nombre" style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1.5px solid #4a7a5e', fontSize: '12px', fontFamily: 'Nunito, sans-serif' }} />
                            <input type="time" value={turno.inicio} onChange={e => {
                              const t = [...areaConfig.turnos]; t[ti].inicio = e.target.value
                              setAreaConfig({ ...areaConfig, turnos: t })
                            }} style={{ width: '100px', padding: '8px', borderRadius: '8px', border: '1.5px solid #4a7a5e', fontSize: '12px' }} />
                            <span style={{ color: '#718096', fontWeight: '700' }}>–</span>
                            <input type="time" value={turno.fin} onChange={e => {
                              const t = [...areaConfig.turnos]; t[ti].fin = e.target.value
                              setAreaConfig({ ...areaConfig, turnos: t })
                            }} style={{ width: '100px', padding: '8px', borderRadius: '8px', border: '1.5px solid #4a7a5e', fontSize: '12px' }} />
                            <button onClick={() => setAreaConfig({ ...areaConfig, turnos: areaConfig.turnos.filter((_, idx) => idx !== ti) })}
                              style={{ background: '#fee2e2', border: 'none', borderRadius: '8px', color: '#e53e3e', padding: '8px 10px', cursor: 'pointer', fontWeight: '700' }}>✕</button>
                          </div>
                        ))}
                        <button onClick={() => setAreaConfig({ ...areaConfig, turnos: [...areaConfig.turnos, { nombre: 'Turno', inicio: '07:00', fin: '17:00' }] })}
                          style={{ padding: '8px 16px', borderRadius: '10px', border: '2px dashed #4a7a5e', background: 'transparent', color: '#4a7a5e', fontSize: '12px', fontWeight: '700', cursor: 'pointer', width: '100%', marginTop: '4px' }}>
                          + Agregar turno
                        </button>
                      </div>

                                      {/* TIPO ROTACIÓN */}
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#4a7a5e', marginBottom: '8px' }}>⚙️ ¿Cómo rotan?</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {[['semana', '🔄 Por semana', 'Todos cambian cada semana'], ['dia', '📅 Por día', 'Cambia dentro de la semana']].map(([val, label, desc]) => (
                            <button key={val} onClick={() => setAreaConfig({ ...areaConfig, tipo_rotacion: val })} style={{
                              flex: 1, padding: '10px 8px', borderRadius: '10px',
                              border: `2px solid ${areaConfig.tipo_rotacion === val ? '#1a7a4a' : '#e2e8f0'}`,
                              background: areaConfig.tipo_rotacion === val ? '#f0fdf4' : '#fff',
                              color: areaConfig.tipo_rotacion === val ? '#1a7a4a' : '#718096',
                              fontSize: '11px', fontWeight: '700', cursor: 'pointer', textAlign: 'center'
                            }}>
                              <div>{label}</div>
                              <div style={{ fontSize: '9px', fontWeight: '400', marginTop: '2px', opacity: 0.8 }}>{desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* SÁBADO */}
                      <div style={{ marginBottom: '20px', background: '#fdf2f8', borderRadius: '12px', padding: '14px', border: '1px solid #f9a8d4' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#9d174d' }}>🗓️ ¿Trabajan sábado?</div>
                          <button onClick={() => setAreaConfig({ ...areaConfig, sabado_activo: !areaConfig.sabado_activo })} style={{
                            padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                            background: areaConfig.sabado_activo ? '#db2777' : '#e2e8f0',
                            color: areaConfig.sabado_activo ? '#fff' : '#718096',
                            fontSize: '12px', fontWeight: '700'
                          }}>{areaConfig.sabado_activo ? '✅ Sí' : '❌ No'}</button>
                        </div>

                        {areaConfig.sabado_activo && (
                          <>
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ fontSize: '11px', fontWeight: '700', color: '#9d174d', marginBottom: '8px' }}>¿Cuántos trabajan cada sábado? (rota cada semana)</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <button onClick={() => setAreaConfig({ ...areaConfig, sabado_cantidad: Math.max(1, areaConfig.sabado_cantidad - 1) })}
                                  style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: '#db2777', color: '#fff', fontSize: '20px', cursor: 'pointer', fontWeight: '700' }}>−</button>
                                <span style={{ fontSize: '28px', fontWeight: '900', color: '#9d174d', minWidth: '40px', textAlign: 'center' }}>{areaConfig.sabado_cantidad}</span>
                                <button onClick={() => setAreaConfig({ ...areaConfig, sabado_cantidad: areaConfig.sabado_cantidad + 1 })}
                                  style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: '#db2777', color: '#fff', fontSize: '20px', cursor: 'pointer', fontWeight: '700' }}>+</button>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '11px', fontWeight: '700', color: '#9d174d', marginBottom: '6px' }}>Hora entrada:</div>
                                <input type="time" value={areaConfig.sabado_inicio} onChange={e => setAreaConfig({ ...areaConfig, sabado_inicio: e.target.value })}
                                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1.5px solid #db2777', fontSize: '13px', boxSizing: 'border-box' }} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '11px', fontWeight: '700', color: '#9d174d', marginBottom: '6px' }}>Hora salida:</div>
                                <input type="time" value={areaConfig.sabado_fin} onChange={e => setAreaConfig({ ...areaConfig, sabado_fin: e.target.value })}
                                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1.5px solid #db2777', fontSize: '13px', boxSizing: 'border-box' }} />
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      <button onClick={() => guardarConfig(area.id, areaConfig)} style={{
                        width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                        background: 'linear-gradient(135deg, #1a7a4a, #2eaa6a)',
                        color: '#fff', fontWeight: '700', fontSize: '15px', cursor: 'pointer'
                      }}>💾 Guardar configuración</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── GENERAR ── */}
        {tab === 'generar' && (
          <div>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#1a202c', marginBottom: '4px' }}>⚡ Generar turnos</div>
              <div style={{ fontSize: '12px', color: '#718096', marginBottom: '16px' }}>Rotación equitativa según configuración por área</div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#4a7a5e', display: 'block', marginBottom: '6px' }}>Semana a programar:</label>
                <input type="date" value={semanaInicio} onChange={e => setSemanaInicio(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #4a7a5e', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                {areas.map(area => {
                  const cfg = configs[area.id]
                  return (
                    <div key={area.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', marginBottom: '8px', background: cfg ? '#f0fdf4' : '#fff5f5', border: `1px solid ${cfg ? '#6ee7b7' : '#fca5a5'}` }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a202c' }}>{area.nombre}</div>
                        {cfg && <div style={{ fontSize: '10px', color: '#4a7a5e' }}>
                          {cfg.turnos.length} turno(s) · {cfg.dias_rotan.length} días rotan {cfg.sabado_activo ? `· Sáb: ${cfg.sabado_cantidad} personas` : ''}
                        </div>}
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: cfg ? '#1a7a4a' : '#e53e3e' }}>
                        {cfg ? '✅ Lista' : '❌ Sin config'}
                      </span>
                    </div>
                  )
                })}
              </div>

              <button onClick={generarTurnos} disabled={generando} style={{
                width: '100%', padding: '14px',
                background: generando ? '#ccc' : 'linear-gradient(135deg, #1a7a4a, #f97316)',
                color: '#fff', border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: '700', cursor: generando ? 'not-allowed' : 'pointer'
              }}>
                {generando ? '⏳ Generando...' : '⚡ Generar turnos'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL EDITAR TURNO ── */}
      {editandoTurno && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px', width: '100%', maxWidth: '480px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '17px', fontWeight: '900', color: '#1a202c' }}>
              ✏️ {editandoTurno.id ? 'Editar turno' : 'Agregar turno'}
            </h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#4a7a5e', display: 'block', marginBottom: '6px' }}>Tipo de turno</label>
              <select value={editandoTurno.tipo || ''} onChange={e => setEditandoTurno({ ...editandoTurno, tipo: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #4a7a5e', fontSize: '13px', boxSizing: 'border-box', fontFamily: 'Nunito, sans-serif' }}>
                <option value="Mañana">🌅 Mañana</option>
                <option value="Tarde">☀️ Tarde</option>
                <option value="Noche">🌙 Noche</option>
                <option value="Sábado">🗓️ Sábado</option>
                <option value="Permiso">📋 Permiso</option>
                <option value="Incapacidad">🏥 Incapacidad</option>
                <option value="Vacaciones">🌴 Vacaciones</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#4a7a5e', display: 'block', marginBottom: '6px' }}>Hora inicio</label>
                <input type="time" value={editandoTurno.hora_inicio || ''} onChange={e => setEditandoTurno({ ...editandoTurno, hora_inicio: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #4a7a5e', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#4a7a5e', display: 'block', marginBottom: '6px' }}>Hora fin</label>
                <input type="time" value={editandoTurno.hora_fin || ''} onChange={e => setEditandoTurno({ ...editandoTurno, hora_fin: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #4a7a5e', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setEditandoTurno(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#fff', color: '#718096', fontWeight: '700', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={guardarEdicionTurno} style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #1a7a4a, #f97316)', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>💾 Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

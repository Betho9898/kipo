import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export default function Reportes() {
  const navigate = useNavigate()
  const [trabajadores, setTrabajadores] = useState([])
  const [areas, setAreas] = useState([])
  const [novedades, setNovedades] = useState([])
  const [turnos, setTurnos] = useState([])
  const [indicadores, setIndicadores] = useState([])
  const [registros, setRegistros] = useState([])
  const [tab, setTab] = useState('novedades')
  const [mostrarFormInd, setMostrarFormInd] = useState(false)
  const [mostrarFormReg, setMostrarFormReg] = useState(false)
  const [nuevoInd, setNuevoInd] = useState({ nombre: '', area_id: '', meta: '', unidad: '' })
  const [nuevoReg, setNuevoReg] = useState({ indicador_id: '', trabajador_id: '', valor: '', periodo: '', fecha: '' })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate('/')
    })
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    const [t, a, n, tu, ind, reg] = await Promise.all([
      supabase.from('trabajadores').select('*'),
      supabase.from('areas').select('*'),
      supabase.from('novedades').select('*'),
      supabase.from('turnos').select('*'),
      supabase.from('indicadores').select('*'),
      supabase.from('registros_indicadores').select('*')
    ])
    if (t.data) setTrabajadores(t.data)
    if (a.data) setAreas(a.data)
    if (n.data) setNovedades(n.data)
    if (tu.data) setTurnos(tu.data)
    if (ind.data) setIndicadores(ind.data)
    if (reg.data) setRegistros(reg.data)
  }

  const getNombreArea = (id) => areas.find(a => a.id === id)?.nombre || 'Sin área'
  const getNombreTrabajador = (id) => trabajadores.find(t => t.id === id)?.nombre || 'Desconocido'
  const getNombreIndicador = (id) => indicadores.find(i => i.id === id)?.nombre || 'Sin nombre'

  const crearIndicador = async () => {
    if (!nuevoInd.nombre || !nuevoInd.area_id) return
    await supabase.from('indicadores').insert([{
      nombre: nuevoInd.nombre,
      area_id: parseInt(nuevoInd.area_id),
      meta: parseFloat(nuevoInd.meta) || 0,
      unidad: nuevoInd.unidad
    }])
    setNuevoInd({ nombre: '', area_id: '', meta: '', unidad: '' })
    setMostrarFormInd(false)
    cargarDatos()
  }

  const eliminarIndicador = async (id) => {
    await supabase.from('indicadores').delete().eq('id', id)
    cargarDatos()
  }

  const crearRegistro = async () => {
    if (!nuevoReg.indicador_id || !nuevoReg.trabajador_id || !nuevoReg.valor) return
    await supabase.from('registros_indicadores').insert([{
      indicador_id: parseInt(nuevoReg.indicador_id),
      trabajador_id: parseInt(nuevoReg.trabajador_id),
      valor: parseFloat(nuevoReg.valor),
      periodo: nuevoReg.periodo,
      fecha: nuevoReg.fecha || new Date().toISOString().split('T')[0]
    }])
    setNuevoReg({ indicador_id: '', trabajador_id: '', valor: '', periodo: '', fecha: '' })
    setMostrarFormReg(false)
    cargarDatos()
  }

  const exportarNovedades = () => {
    const wb = XLSX.utils.book_new()
    const data = novedades.map(n => ({
      'Trabajador': getNombreTrabajador(n.trabajador_id),
      'Área': getNombreArea(trabajadores.find(t => t.id === n.trabajador_id)?.area_id),
      'Descripción': n.descripcion || '',
      'Estado': n.estado,
      'Fecha inicio': n.fecha_inicio || '',
      'Fecha fin': n.fecha_fin || '',
      'Comentario admin': n.comentario || '',
      'Fecha solicitud': new Date(n.created_at).toLocaleDateString('es-CO')
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, 'Novedades')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([buf]), `Kipu_Novedades_${new Date().toLocaleDateString('es-CO')}.xlsx`)
  }

  const exportarTurnos = () => {
    const wb = XLSX.utils.book_new()
    areas.forEach(area => {
      const turnosArea = turnos.filter(t => t.area_id === area.id)
      if (turnosArea.length === 0) return
      const data = turnosArea.map(t => ({
        'Trabajador': getNombreTrabajador(t.trabajador_id),
        'Fecha': t.fecha,
        'Hora inicio': t.hora_inicio,
        'Hora fin': t.hora_fin,
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(wb, ws, area.nombre.substring(0, 31))
    })
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([buf]), `Kipu_Turnos_${new Date().toLocaleDateString('es-CO')}.xlsx`)
  }

  const exportarIndicadores = () => {
    const wb = XLSX.utils.book_new()
    areas.forEach(area => {
      const indsArea = indicadores.filter(i => i.area_id === area.id)
      if (indsArea.length === 0) return
      const data = []
      indsArea.forEach(ind => {
        const regsInd = registros.filter(r => r.indicador_id === ind.id)
        regsInd.forEach(r => {
          data.push({
            'Indicador': ind.nombre,
            'Meta': ind.meta,
            'Unidad': ind.unidad,
            'Trabajador': getNombreTrabajador(r.trabajador_id),
            'Valor': r.valor,
            '% Cumplimiento': ind.meta > 0 ? `${((r.valor / ind.meta) * 100).toFixed(1)}%` : 'N/A',
            'Período': r.periodo,
            'Fecha': r.fecha
          })
        })
      })
      if (data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(data)
        XLSX.utils.book_append_sheet(wb, ws, area.nombre.substring(0, 31))
      }
    })
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(new Blob([buf]), `Kipu_Indicadores_${new Date().toLocaleDateString('es-CO')}.xlsx`)
  }

  const labelStyle = { fontSize: '11px', fontWeight: '700', color: '#4a7a5e', display: 'block', marginBottom: '6px' }
  const inputStyle = { width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #4a7a5e', fontSize: '13px', outline: 'none', background: '#fff', boxSizing: 'border-box' }

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
        </div>
        <div style={{ marginTop: '10px' }}>
          <p style={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}>Reportes</p>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px' }}>Novedades · Turnos · Indicadores</span>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '8px', padding: '16px 16px 0' }}>
        {[
          { id: 'novedades', label: 'Novedades' },
          { id: 'turnos', label: 'Turnos' },
          { id: 'indicadores', label: 'Indicadores' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            background: tab === t.id ? '#1a7a4a' : '#fff',
            color: tab === t.id ? '#fff' : '#4a7a5e',
            fontSize: '12px', fontWeight: '700',
            border: tab === t.id ? 'none' : '0.5px solid #c8e6d4'
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
                <div key={i} style={{ background: '#fff', borderRadius: '14px', padding: '12px', border: '0.5px solid #c8e6d4', textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#4a7a5e', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{c.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: c.color }}>{c.value}</div>
                </div>
              ))}
            </div>
            <button onClick={exportarNovedades} style={{
              width: '100%', padding: '14px',
              background: 'linear-gradient(135deg, #1a7a4a, #f97316)',
              color: '#fff', border: 'none', borderRadius: '12px',
              fontSize: '14px', fontWeight: '700', cursor: 'pointer'
            }}>⬇ Descargar reporte de novedades en Excel</button>
          </div>
        )}

        {/* TAB TURNOS */}
        {tab === 'turnos' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: '#fff', borderRadius: '14px', padding: '14px', border: '0.5px solid #c8e6d4' }}>
                <div style={{ fontSize: '10px', color: '#4a7a5e', fontWeight: '700', marginBottom: '5px', textTransform: 'uppercase' }}>Total turnos</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#0d9488' }}>{turnos.length}</div>
              </div>
              <div style={{ background: '#fff', borderRadius: '14px', padding: '14px', border: '0.5px solid #c8e6d4' }}>
                <div style={{ fontSize: '10px', color: '#4a7a5e', fontWeight: '700', marginBottom: '5px', textTransform: 'uppercase' }}>Áreas</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a4a2e' }}>{areas.length}</div>
              </div>
            </div>
            {areas.map((a, i) => (
              <div key={a.id} style={{
                background: '#fff', borderRadius: '12px', padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: '10px',
                marginBottom: '8px', border: '0.5px solid #c8e6d4'
              }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: a.color || '#1a7a4a', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a4a2e' }}>{a.nombre}</div>
                  <div style={{ fontSize: '11px', color: '#7aaa8e' }}>{turnos.filter(t => t.area_id === a.id).length} turnos programados</div>
                </div>
              </div>
            ))}
            <button onClick={exportarTurnos} style={{
              width: '100%', padding: '14px', marginTop: '8px',
              background: 'linear-gradient(135deg, #1a7a4a, #f97316)',
              color: '#fff', border: 'none', borderRadius: '12px',
              fontSize: '14px', fontWeight: '700', cursor: 'pointer'
            }}>⬇ Descargar reporte de turnos en Excel</button>
          </div>
        )}

        {/* TAB INDICADORES */}
        {tab === 'indicadores' && (
          <div>
            {/* Botones */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button onClick={() => { setMostrarFormInd(!mostrarFormInd); setMostrarFormReg(false) }} style={{
                flex: 1, padding: '10px', background: mostrarFormInd ? '#ffe4e4' : '#1a7a4a',
                color: '#fff', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
              }}>{mostrarFormInd ? '✕ Cancelar' : '+ Indicador'}</button>
              <button onClick={() => { setMostrarFormReg(!mostrarFormReg); setMostrarFormInd(false) }} style={{
                flex: 1, padding: '10px', background: mostrarFormReg ? '#ffe4e4' : '#f97316',
                color: '#fff', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
              }}>{mostrarFormReg ? '✕ Cancelar' : '+ Registro'}</button>
            </div>

            {/* Form nuevo indicador */}
            {mostrarFormInd && (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '16px', border: '0.5px solid #c8e6d4' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>Nombre del indicador</label>
                  <input value={nuevoInd.nombre} onChange={e => setNuevoInd({ ...nuevoInd, nombre: e.target.value })} placeholder="Ej: Ventas, Llamadas atendidas..." style={inputStyle} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>Área</label>
                  <select value={nuevoInd.area_id} onChange={e => setNuevoInd({ ...nuevoInd, area_id: e.target.value })} style={inputStyle}>
                    <option value="">Seleccionar área</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <label style={labelStyle}>Meta</label>
                    <input type="number" value={nuevoInd.meta} onChange={e => setNuevoInd({ ...nuevoInd, meta: e.target.value })} placeholder="100" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Unidad</label>
                    <input value={nuevoInd.unidad} onChange={e => setNuevoInd({ ...nuevoInd, unidad: e.target.value })} placeholder="%, ventas, llamadas..." style={inputStyle} />
                  </div>
                </div>
                <button onClick={crearIndicador} style={{
                  width: '100%', padding: '12px', background: 'linear-gradient(135deg, #1a7a4a, #f97316)',
                  color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer'
                }}>Crear indicador</button>
              </div>
            )}

            {/* Form nuevo registro */}
            {mostrarFormReg && (
              <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '16px', border: '0.5px solid #c8e6d4' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>Indicador</label>
                  <select value={nuevoReg.indicador_id} onChange={e => setNuevoReg({ ...nuevoReg, indicador_id: e.target.value })} style={inputStyle}>
                    <option value="">Seleccionar indicador</option>
                    {indicadores.map(i => <option key={i.id} value={i.id}>{i.nombre} — {getNombreArea(i.area_id)}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>Trabajador</label>
                  <select value={nuevoReg.trabajador_id} onChange={e => setNuevoReg({ ...nuevoReg, trabajador_id: e.target.value })} style={inputStyle}>
                    <option value="">Seleccionar trabajador</option>
                    {trabajadores.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={labelStyle}>Valor</label>
                    <input type="number" value={nuevoReg.valor} onChange={e => setNuevoReg({ ...nuevoReg, valor: e.target.value })} placeholder="85" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Período</label>
                    <input value={nuevoReg.periodo} onChange={e => setNuevoReg({ ...nuevoReg, periodo: e.target.value })} placeholder="Sep 2026" style={inputStyle} />
                  </div>
                </div>
                <button onClick={crearRegistro} style={{
                  width: '100%', padding: '12px', background: 'linear-gradient(135deg, #1a7a4a, #f97316)',
                  color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer'
                }}>Guardar registro</button>
              </div>
            )}

            {/* Lista indicadores */}
            {indicadores.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px', color: '#7aaa8e', fontSize: '13px' }}>
                No hay indicadores — dale a + Indicador
              </div>
            )}

            {areas.map((area, ai) => {
              const indsArea = indicadores.filter(i => i.area_id === area.id)
              if (indsArea.length === 0) return null
              return (
                <div key={area.id} style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#4a7a5e', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: area.color || '#1a7a4a' }} />
                    {area.nombre}
                  </div>
                  {indsArea.map(ind => {
                    const regsInd = registros.filter(r => r.indicador_id === ind.id)
                    return (
                      <div key={ind.id} style={{ background: '#fff', borderRadius: '12px', padding: '14px', marginBottom: '8px', border: '0.5px solid #c8e6d4' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a4a2e' }}>{ind.nombre}</div>
                            <div style={{ fontSize: '11px', color: '#7aaa8e' }}>Meta: {ind.meta} {ind.unidad}</div>
                          </div>
                          <button onClick={() => eliminarIndicador(ind.id)} style={{
                            background: '#ffe4e4', color: '#e53e3e', border: 'none',
                            borderRadius: '8px', padding: '4px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
                          }}>✕</button>
                        </div>
                        {regsInd.length > 0 && (
                          <div style={{ borderTop: '0.5px solid #c8e6d4', paddingTop: '8px' }}>
                            {regsInd.map(r => {
                              const pct = ind.meta > 0 ? ((r.valor / ind.meta) * 100).toFixed(0) : 0
                              const color = pct >= 100 ? '#1a7a4a' : pct >= 70 ? '#f97316' : '#e53e3e'
                              return (
                                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                  <div style={{ fontSize: '12px', color: '#1a4a2e' }}>{getNombreTrabajador(r.trabajador_id)}</div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ fontSize: '12px', color: '#4a7a5e' }}>{r.valor} {ind.unidad}</div>
                                    <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', background: color + '22', color }}>{pct}%</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}

            {indicadores.length > 0 && (
              <button onClick={exportarIndicadores} style={{
                width: '100%', padding: '14px', marginTop: '8px',
                background: 'linear-gradient(135deg, #1a7a4a, #f97316)',
                color: '#fff', border: 'none', borderRadius: '12px',
                fontSize: '14px', fontWeight: '700', cursor: 'pointer'
              }}>⬇ Descargar indicadores en Excel</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
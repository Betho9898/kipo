import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Vacaciones() {
  const navigate = useNavigate()
  const [vacaciones, setVacaciones] = useState([])
  const [trabajadores, setTrabajadores] = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nueva, setNueva] = useState({ trabajador_id: '', fecha_inicio: '', fecha_fin: '', comentario: '' })
  const [esAdmin, setEsAdmin] = useState(false)
  const [trabajadorActual, setTrabajadorActual] = useState(null)

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
      setTrabajadorActual(trab)
      const esAdminRol = trab.rol === 'admin'
      setEsAdmin(esAdminRol)

      const [v, t] = await Promise.all([
        esAdminRol
          ? supabase.from('vacaciones').select('*').order('created_at', { ascending: false })
          : supabase.from('vacaciones').select('*').eq('trabajador_id', trab.id),
        supabase.from('trabajadores').select('*')
      ])
      if (v.data) setVacaciones(v.data)
      if (t.data) setTrabajadores(t.data)
    }
  }

  const calcularDias = (inicio, fin) => {
    if (!inicio || !fin) return 0
    const d1 = new Date(inicio)
    const d2 = new Date(fin)
    const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1
    return diff > 0 ? diff : 0
  }

  const solicitarVacaciones = async () => {
    if (!nueva.fecha_inicio || !nueva.fecha_fin) return
    const trabajadorId = esAdmin ? parseInt(nueva.trabajador_id) : trabajadorActual.id
    if (!trabajadorId) return

    const dias = calcularDias(nueva.fecha_inicio, nueva.fecha_fin)
    await supabase.from('vacaciones').insert([{
      trabajador_id: trabajadorId,
      fecha_inicio: nueva.fecha_inicio,
      fecha_fin: nueva.fecha_fin,
      dias_solicitados: dias,
      estado: 'pendiente',
      comentario: nueva.comentario
    }])
    setNueva({ trabajador_id: '', fecha_inicio: '', fecha_fin: '', comentario: '' })
    setMostrarForm(false)
    cargarDatos()
  }

  const cambiarEstado = async (id, estado) => {
    await supabase.from('vacaciones').update({ estado }).eq('id', id)
    cargarDatos()
  }

  const eliminar = async (id) => {
    await supabase.from('vacaciones').delete().eq('id', id)
    cargarDatos()
  }

  const getNombreTrabajador = (id) => {
    const t = trabajadores.find(t => t.id === id)
    return t ? t.nombre : 'Trabajador'
  }

  const coloresEstado = {
    pendiente: { bg: '#fff0e6', color: '#c2500a', label: 'Pendiente' },
    aprobado: { bg: '#d1f5e0', color: '#1a7a4a', label: 'Aprobado' },
    rechazado: { bg: '#ffe4e4', color: '#e53e3e', label: 'Rechazado' }
  }

  const labelStyle = { fontSize: '11px', fontWeight: '700', color: '#4a7a5e', display: 'block', marginBottom: '6px' }
  const inputStyle = { width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #4a7a5e', fontSize: '13px', outline: 'none', background: '#fff', boxSizing: 'border-box' }

  const diasSolicitados = calcularDias(nueva.fecha_inicio, nueva.fecha_fin)

  return (
    <div style={{ background: '#f0f7f2', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'sans-serif' }}>

      {/* TOPBAR */}
      <div style={{
        background: 'linear-gradient(135deg, #1a7a4a 0%, #2eaa6a 60%, #f97316 100%)',
        padding: '14px 16px 20px', borderRadius: '0 0 28px 28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => navigate(esAdmin ? '/admin' : '/dashboard')} style={{
            background: 'rgba(255,255,255,0.22)', border: 'none', borderRadius: '20px',
            padding: '6px 14px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
          }}>← Volver</button>
          <button onClick={() => setMostrarForm(!mostrarForm)} style={{
            background: 'rgba(255,255,255,0.22)', border: 'none', borderRadius: '20px',
            padding: '6px 14px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
          }}>{mostrarForm ? '✕ Cancelar' : '+ Solicitar'}</button>
        </div>
        <div style={{ marginTop: '10px' }}>
          <p style={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}>Vacaciones</p>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px' }}>
            {vacaciones.filter(v => v.estado === 'pendiente').length} solicitudes pendientes
          </span>
        </div>
      </div>

      <div style={{ padding: '16px' }}>

        {/* RESUMEN */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Pendientes', value: vacaciones.filter(v => v.estado === 'pendiente').length, color: '#f97316' },
            { label: 'Aprobadas', value: vacaciones.filter(v => v.estado === 'aprobado').length, color: '#1a7a4a' },
            { label: 'Rechazadas', value: vacaciones.filter(v => v.estado === 'rechazado').length, color: '#e53e3e' },
          ].map((c, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '14px', padding: '12px', border: '0.5px solid #c8e6d4', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#4a7a5e', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{c.label}</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* FORMULARIO */}
        {mostrarForm && (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '16px', border: '0.5px solid #c8e6d4' }}>

            {esAdmin && (
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>Trabajador</label>
                <select value={nueva.trabajador_id} onChange={e => setNueva({ ...nueva, trabajador_id: e.target.value })} style={inputStyle}>
                  <option value="">Seleccionar trabajador</option>
                  {trabajadores.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={labelStyle}>Desde</label>
                <input type="date" value={nueva.fecha_inicio} onChange={e => setNueva({ ...nueva, fecha_inicio: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Hasta</label>
                <input type="date" value={nueva.fecha_fin} onChange={e => setNueva({ ...nueva, fecha_fin: e.target.value })} style={inputStyle} />
              </div>
            </div>

            {diasSolicitados > 0 && (
              <div style={{ fontSize: '12px', color: '#1a7a4a', fontWeight: '700', marginBottom: '14px', padding: '8px 12px', background: '#e8f7ef', borderRadius: '8px' }}>
                📅 {diasSolicitados} días solicitados
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Comentario (opcional)</label>
              <textarea
                value={nueva.comentario}
                onChange={e => setNueva({ ...nueva, comentario: e.target.value })}
                placeholder="Motivo o detalles adicionales..."
                rows={2}
                style={{ ...inputStyle, resize: 'none' }}
              />
            </div>

            <button onClick={solicitarVacaciones} style={{
              width: '100%', padding: '12px',
              background: 'linear-gradient(135deg, #1a7a4a, #f97316)',
              color: '#fff', border: 'none', borderRadius: '10px',
              fontSize: '13px', fontWeight: '700', cursor: 'pointer'
            }}>Enviar solicitud</button>
          </div>
        )}

        {/* LISTA */}
        {vacaciones.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7aaa8e', fontSize: '14px' }}>
            No hay solicitudes de vacaciones aún
          </div>
        )}

        {vacaciones.map(v => (
          <div key={v.id} style={{
            background: '#fff', borderRadius: '12px', padding: '14px',
            marginBottom: '8px', border: '0.5px solid #c8e6d4'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                {esAdmin && <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a4a2e' }}>{getNombreTrabajador(v.trabajador_id)}</div>}
                <div style={{ fontSize: '12px', color: '#4a7a5e', marginTop: '2px' }}>
                  📅 {v.fecha_inicio} → {v.fecha_fin}
                </div>
                <div style={{ fontSize: '11px', color: '#7aaa8e', marginTop: '2px' }}>
                  {v.dias_solicitados} días
                </div>
              </div>
              <span style={{
                fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px',
                background: coloresEstado[v.estado]?.bg, color: coloresEstado[v.estado]?.color
              }}>{coloresEstado[v.estado]?.label}</span>
            </div>

            {v.comentario && (
              <div style={{ fontSize: '11px', color: '#4a7a5e', marginBottom: '8px', fontStyle: 'italic' }}>{v.comentario}</div>
            )}

            {esAdmin && v.estado === 'pendiente' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => cambiarEstado(v.id, 'aprobado')} style={{
                  flex: 1, padding: '8px', background: '#d1f5e0', color: '#1a7a4a',
                  border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
                }}>✓ Aprobar</button>
                <button onClick={() => cambiarEstado(v.id, 'rechazado')} style={{
                  flex: 1, padding: '8px', background: '#ffe4e4', color: '#e53e3e',
                  border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
                }}>✕ Rechazar</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
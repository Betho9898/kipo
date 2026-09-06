import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Colillas() {
  const navigate = useNavigate()
  const [colillas, setColillas] = useState([])
  const [trabajadores, setTrabajadores] = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nueva, setNueva] = useState({ trabajador_id: '', quincena: '', mesAnio: '', periodo: '', archivo_url: '' })
  const [subiendo, setSubiendo] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate('/')
    })
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    const [c, t] = await Promise.all([
      supabase.from('colillas').select('*').order('created_at', { ascending: false }),
      supabase.from('trabajadores').select('*')
    ])
    if (c.data) setColillas(c.data)
    if (t.data) setTrabajadores(t.data)
  }

  const getNombreTrabajador = (id) => {
    const t = trabajadores.find(t => t.id === id)
    return t ? t.nombre : 'Trabajador'
  }

  const subirArchivo = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setSubiendo(true)
    const fileName = `${Date.now()}_${file.name}`
    const { data } = await supabase.storage.from('colillas').upload(fileName, file)
    if (data) {
      const { data: urlData } = supabase.storage.from('colillas').getPublicUrl(fileName)
      setNueva(prev => ({ ...prev, archivo_url: urlData.publicUrl }))
    }
    setSubiendo(false)
  }

  const crearColilla = async () => {
    if (!nueva.trabajador_id || !nueva.periodo || !nueva.archivo_url) return
    await supabase.from('colillas').insert([{
      trabajador_id: parseInt(nueva.trabajador_id),
      periodo: nueva.periodo,
      archivo_url: nueva.archivo_url
    }])
    setNueva({ trabajador_id: '', quincena: '', mesAnio: '', periodo: '', archivo_url: '' })
    setMostrarForm(false)
    cargarDatos()
  }

  const eliminarColilla = async (id) => {
    await supabase.from('colillas').delete().eq('id', id)
    cargarDatos()
  }

  const actualizarPeriodo = (quincena, mesAnio) => {
    if (!quincena || !mesAnio) return ''
    const [anio, mes] = mesAnio.split('-')
    const meses = ['','Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
    return `${quincena} quincena ${meses[parseInt(mes)]} ${anio}`
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
          <button onClick={() => setMostrarForm(!mostrarForm)} style={{
            background: 'rgba(255,255,255,0.22)', border: 'none', borderRadius: '20px',
            padding: '6px 14px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
          }}>{mostrarForm ? '✕ Cancelar' : '+ Nueva'}</button>
        </div>
        <div style={{ marginTop: '10px' }}>
          <p style={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}>Colillas de pago</p>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px' }}>{colillas.length} registradas</span>
        </div>
      </div>

      <div style={{ padding: '16px' }}>

        {/* FORMULARIO */}
        {mostrarForm && (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '16px', border: '0.5px solid #c8e6d4', overflow: 'hidden' }}>

            {/* Trabajador */}
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Trabajador</label>
              <select
                value={nueva.trabajador_id}
                onChange={e => setNueva({ ...nueva, trabajador_id: e.target.value })}
                style={inputStyle}
              >
                <option value="">Seleccionar trabajador</option>
                {trabajadores.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>

            {/* Quincena y fecha */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={labelStyle}>Quincena</label>
                <select
                  value={nueva.quincena}
                  onChange={e => {
                    const q = e.target.value
                    setNueva(prev => ({ ...prev, quincena: q, periodo: actualizarPeriodo(q, prev.mesAnio) }))
                  }}
                  style={inputStyle}
                >
                  <option value="">Seleccionar</option>
                  <option value="1ra">1ra quincena</option>
                  <option value="2da">2da quincena</option>
                </select>
              </div>
              <div style={{ overflow: 'hidden' }}>
                <label style={labelStyle}>Mes y año</label>
                <input
                  type="month"
                  value={nueva.mesAnio}
                  onChange={e => {
                    const ma = e.target.value
                    setNueva(prev => ({ ...prev, mesAnio: ma, periodo: actualizarPeriodo(prev.quincena, ma) }))
                  }}
                  style={{ ...inputStyle, maxWidth: '100%' }}
                />
              </div>
            </div>

            {/* Período generado */}
            {nueva.periodo && (
              <div style={{ fontSize: '12px', color: '#1a7a4a', fontWeight: '700', marginBottom: '14px', padding: '8px 12px', background: '#e8f7ef', borderRadius: '8px' }}>
                📅 {nueva.periodo}
              </div>
            )}

            {/* Archivo */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Archivo PDF</label>
              <input
                type="file"
                accept=".pdf"
                onChange={subirArchivo}
                style={{ width: '100%', fontSize: '13px' }}
              />
              {subiendo && <div style={{ fontSize: '12px', color: '#4a7a5e', marginTop: '6px' }}>Subiendo archivo...</div>}
              {nueva.archivo_url && <div style={{ fontSize: '12px', color: '#1a7a4a', marginTop: '6px' }}>✅ Archivo listo</div>}
            </div>

            <button onClick={crearColilla} style={{
              width: '100%', padding: '12px',
              background: 'linear-gradient(135deg, #1a7a4a, #f97316)',
              color: '#fff', border: 'none', borderRadius: '10px',
              fontSize: '13px', fontWeight: '700', cursor: 'pointer'
            }}>Guardar colilla</button>
          </div>
        )}

        {/* LISTA */}
        {colillas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7aaa8e', fontSize: '14px' }}>
            No hay colillas — dale a + Nueva
          </div>
        )}

        {colillas.map(c => (
          <div key={c.id} style={{
            background: '#fff', borderRadius: '12px', padding: '13px 14px',
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '8px', border: '0.5px solid #c8e6d4'
          }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#e8f7ef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ti ti-file-invoice" style={{ fontSize: '20px', color: '#1a7a4a' }} aria-hidden="true" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a4a2e' }}>{getNombreTrabajador(c.trabajador_id)}</div>
              <div style={{ fontSize: '11px', color: '#7aaa8e', marginTop: '2px' }}>{c.periodo}</div>
            </div>
            <a href={c.archivo_url} target="_blank" rel="noreferrer" style={{
              fontSize: '12px', color: '#f97316', fontWeight: '700', textDecoration: 'none', marginRight: '8px'
            }}>Ver ↗</a>
            <button onClick={() => eliminarColilla(c.id)} style={{
              background: '#ffe4e4', color: '#e53e3e', border: 'none',
              borderRadius: '8px', padding: '4px 10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
            }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}
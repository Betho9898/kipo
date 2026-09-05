import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Trabajadores() {
  const navigate = useNavigate()
  const [trabajadores, setTrabajadores] = useState([])
  const [areas, setAreas] = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nuevo, setNuevo] = useState({ nombre: '', email: '', area_id: '', rol: 'trabajador' })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate('/')
    })
    cargarTrabajadores()
    cargarAreas()
  }, [])

  const cargarTrabajadores = async () => {
    const { data } = await supabase.from('trabajadores').select('*')
    if (data) setTrabajadores(data)
  }

  const cargarAreas = async () => {
    const { data } = await supabase.from('areas').select('*')
    if (data) setAreas(data)
  }

  const crearTrabajador = async () => {
    if (!nuevo.nombre || !nuevo.email) return
    const areaId = nuevo.area_id ? parseInt(nuevo.area_id) : null
    const { error } = await supabase.from('trabajadores').insert([{
      nombre: nuevo.nombre,
      email: nuevo.email,
      area_id: areaId,
      rol: nuevo.rol
    }])
    if (!error) {
      setNuevo({ nombre: '', email: '', area_id: '', rol: 'trabajador' })
      setMostrarForm(false)
      cargarTrabajadores()
    } else {
      console.log('Error al crear:', error)
    }
  }

  const eliminarTrabajador = async (id) => {
    await supabase.from('trabajadores').delete().eq('id', id)
    cargarTrabajadores()
  }

  const colores = ['#1a7a4a', '#f97316', '#0d9488', '#65a30d', '#7c3aed', '#db2777']

  const getNombreArea = (area_id) => {
    const area = areas.find(a => a.id === area_id)
    return area ? area.nombre : 'Sin área'
  }

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
          <button onClick={() => setMostrarForm(!mostrarForm)} style={{
            background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: '20px',
            padding: '6px 14px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
          }}>{mostrarForm ? '✕ Cancelar' : '+ Nuevo'}</button>
        </div>
        <div style={{ marginTop: '10px' }}>
          <p style={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}>Trabajadores</p>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px' }}>{trabajadores.length} registrados</span>
        </div>
      </div>

      <div style={{ padding: '16px' }}>

        {/* FORMULARIO */}
        {mostrarForm && (
          <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '16px', border: '0.5px solid #c8e6d4' }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a7a5e', display: 'block', marginBottom: '6px' }}>Nombre completo</label>
              <input
                value={nuevo.nombre}
                onChange={e => setNuevo({ ...nuevo, nombre: e.target.value })}
                placeholder="Juan García"
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '0.5px solid #c8e6d4', fontSize: '13px', outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a7a5e', display: 'block', marginBottom: '6px' }}>Correo</label>
              <input
                value={nuevo.email}
                onChange={e => setNuevo({ ...nuevo, email: e.target.value })}
                placeholder="juan@empresa.com"
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '0.5px solid #c8e6d4', fontSize: '13px', outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a7a5e', display: 'block', marginBottom: '6px' }}>Área</label>
              <select
                value={nuevo.area_id}
                onChange={e => setNuevo({ ...nuevo, area_id: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '0.5px solid #c8e6d4', fontSize: '13px', outline: 'none', background: '#fff' }}
              >
                <option value="">Seleccionar área</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#4a7a5e', display: 'block', marginBottom: '6px' }}>Rol</label>
              <select
                value={nuevo.rol}
                onChange={e => setNuevo({ ...nuevo, rol: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '0.5px solid #c8e6d4', fontSize: '13px', outline: 'none', background: '#fff' }}
              >
                <option value="trabajador">Trabajador</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button onClick={crearTrabajador} style={{
              width: '100%', padding: '12px',
              background: 'linear-gradient(135deg, #1a7a4a, #f97316)',
              color: '#fff', border: 'none', borderRadius: '10px',
              fontSize: '13px', fontWeight: '700', cursor: 'pointer'
            }}>Crear trabajador</button>
          </div>
        )}

        {/* LISTA */}
        {trabajadores.map((t, i) => (
          <div key={t.id} style={{
            background: '#fff', borderRadius: '12px', padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '8px', border: '0.5px solid #c8e6d4'
          }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%',
              background: colores[i % colores.length],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: '700', color: '#fff', flexShrink: 0
            }}>
              {t.nombre.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a4a2e' }}>{t.nombre}</div>
              <div style={{ fontSize: '11px', color: '#7aaa8e', marginTop: '1px' }}>{getNombreArea(t.area_id)} · {t.rol}</div>
            </div>
            <button onClick={() => eliminarTrabajador(t.id)} style={{
              background: '#ffe4e4', color: '#e53e3e', border: 'none',
              borderRadius: '8px', padding: '4px 10px', fontSize: '12px',
              fontWeight: '700', cursor: 'pointer'
            }}>✕</button>
          </div>
        ))}

        {trabajadores.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7aaa8e', fontSize: '14px' }}>
            No hay trabajadores aún — dale a + Nuevo
          </div>
        )}
      </div>
    </div>
  )
}
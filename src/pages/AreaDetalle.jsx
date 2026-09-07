import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabase'

export default function AreaDetalle() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [area, setArea] = useState(null)
  const [trabajadores, setTrabajadores] = useState([])
  const [novedades, setNovedades] = useState([])
  const [turnos, setTurnos] = useState([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate('/')
    })
    cargarDatos()
  }, [id])

  const cargarDatos = async () => {
    const [a, t, n, tu] = await Promise.all([
      supabase.from('areas').select('*').eq('id', id).single(),
      supabase.from('trabajadores').select('*').eq('area_id', id),
      supabase.from('novedades').select('*'),
      supabase.from('turnos').select('*').eq('area_id', id)
    ])
    if (a.data) setArea(a.data)
    if (t.data) setTrabajadores(t.data)
    if (n.data) setNovedades(n.data)
    if (tu.data) setTurnos(tu.data)
  }

  const colores = ['#1a7a4a', '#f97316', '#0d9488', '#65a30d', '#7c3aed', '#db2777']

  const coloresEstado = {
    pendiente: { bg: '#fff0e6', color: '#c2500a' },
    aprobado: { bg: '#d1f5e0', color: '#1a7a4a' },
    rechazado: { bg: '#ffe4e4', color: '#e53e3e' }
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
            background: 'rgba(255,255,255,0.22)', border: 'none', borderRadius: '20px',
            padding: '6px 14px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
          }}>← Volver</button>
          <button onClick={() => navigate('/trabajadores')} style={{
            background: 'rgba(255,255,255,0.22)', border: 'none', borderRadius: '20px',
            padding: '6px 14px', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
          }}>+ Trabajador</button>
        </div>
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: area?.color || '#1a7a4a' }} />
            <p style={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}>{area?.nombre || 'Área'}</p>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px' }}>{trabajadores.length} trabajadores</span>
        </div>
      </div>

      <div style={{ padding: '16px' }}>

        {/* CARDS RESUMEN */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Trabajadores', value: trabajadores.length, color: '#1a4a2e' },
            { label: 'Turnos', value: turnos.length, color: '#0d9488' },
            { label: 'Novedades', value: novedades.filter(n => trabajadores.some(t => t.id === n.trabajador_id) && n.estado === 'pendiente').length, color: '#f97316' },
          ].map((c, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '14px', padding: '12px', border: '1.5px solid #7abf9a', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#4a7a5e', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{c.label}</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* TRABAJADORES */}
        <div style={{ fontSize: '11px', fontWeight: '700', color: '#4a7a5e', textTransform: 'uppercase', marginBottom: '10px' }}>Trabajadores</div>
        
        {trabajadores.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px', color: '#7aaa8e', fontSize: '13px' }}>
            No hay trabajadores en esta área
          </div>
        )}

        {trabajadores.map((t, i) => {
          const novsT = novedades.filter(n => n.trabajador_id === t.id)
          const turnsT = turnos.filter(tu => tu.trabajador_id === t.id)
          return (
            <div key={t.id} style={{
              background: '#fff', borderRadius: '14px', padding: '14px',
              marginBottom: '10px', border: '1.5px solid #7abf9a'
            }}>
              {/* Header trabajador */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: area?.color || colores[i % colores.length],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '15px', fontWeight: '700', color: '#fff', flexShrink: 0
                }}>
                  {t.nombre.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a4a2e' }}>{t.nombre}</div>
                  <div style={{ fontSize: '11px', color: '#7aaa8e', marginTop: '2px' }}>{t.email} · {t.rol}</div>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div style={{ background: '#f0f7f2', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#0d9488' }}>{turnsT.length}</div>
                  <div style={{ fontSize: '9px', color: '#4a7a5e', fontWeight: '600' }}>TURNOS</div>
                </div>
                <div style={{ background: '#f0f7f2', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#f97316' }}>{novsT.filter(n => n.estado === 'pendiente').length}</div>
                  <div style={{ fontSize: '9px', color: '#4a7a5e', fontWeight: '600' }}>NOVEDADES</div>
                </div>
                <div style={{ background: '#f0f7f2', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a7a4a' }}>{novsT.filter(n => n.estado === 'aprobado').length}</div>
                  <div style={{ fontSize: '9px', color: '#4a7a5e', fontWeight: '600' }}>APROBADAS</div>
                </div>
              </div>

              {/* Novedades recientes */}
              {novsT.length > 0 && (
                <div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#4a7a5e', textTransform: 'uppercase', marginBottom: '6px' }}>Novedades recientes</div>
                  {novsT.slice(0, 2).map(n => (
                    <div key={n.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '0.5px solid #f0f7f2' }}>
                      <div style={{ fontSize: '12px', color: '#1a4a2e' }}>{n.descripcion || 'Sin descripción'}</div>
                      <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '20px', background: coloresEstado[n.estado]?.bg, color: coloresEstado[n.estado]?.color }}>
                        {n.estado}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function ColillasTrabajador() {
  const navigate = useNavigate()
  const [trabajador, setTrabajador] = useState(null)
  const [colillas, setColillas] = useState([])

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/'); return }

    const { data: trab } = await supabase.from('trabajadores').select('*').eq('email', user.email).single()
    if (trab) {
      setTrabajador(trab)
      const { data: c } = await supabase.from('colillas').select('*').eq('trabajador_id', trab.id).order('created_at', { ascending: false })
      if (c) setColillas(c)
    }
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
          <p style={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}>Mis colillas</p>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px' }}>{colillas.length} disponibles</span>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {colillas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7aaa8e', fontSize: '14px' }}>
            No tienes colillas disponibles aún
          </div>
        )}

        {colillas.map(c => (
          <div key={c.id} style={{
            background: '#fff', borderRadius: '12px', padding: '13px 14px',
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '8px', border: '1.5px solid #7abf9a'
          }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#e8f7ef', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ti ti-file-invoice" style={{ fontSize: '22px', color: '#1a7a4a' }} aria-hidden="true" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a4a2e' }}>{c.periodo}</div>
              <div style={{ fontSize: '11px', color: '#7aaa8e', marginTop: '2px' }}>
                {new Date(c.created_at).toLocaleDateString('es-CO')}
              </div>
            </div>
            <a href={c.archivo_url} target="_blank" rel="noreferrer" style={{
              background: 'linear-gradient(135deg, #1a7a4a, #f97316)',
              color: '#fff', textDecoration: 'none', borderRadius: '8px',
              padding: '8px 12px', fontSize: '12px', fontWeight: '700'
            }}>Ver ↗</a>
          </div>
        ))}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1.5px solid #7abf9a', display: 'flex', justifyContent: 'space-around', padding: '10px 0 14px' }}>
        {[
          { icon: 'ti-home', label: 'Inicio', path: '/dashboard' },
          { icon: 'ti-clipboard-list', label: 'Novedades', path: '/novedades-trabajador' },
          { icon: 'ti-file-text', label: 'Colillas', path: '/colillas-trabajador', active: true },
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
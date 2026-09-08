import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function TurnosTrabajador() {
  const navigate = useNavigate()
  const [trabajador, setTrabajador] = useState(null)
  const [turnos, setTurnos] = useState([])
  const [semanaInicio, setSemanaInicio] = useState('')

  useEffect(() => {
    const hoy = new Date()
    const lunes = new Date(hoy)
    lunes.setDate(hoy.getDate() - hoy.getDay() + 1)
    setSemanaInicio(lunes.toISOString().split('T')[0])
    cargarDatos(lunes)
  }, [])

  const cargarDatos = async (lunes) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/'); return }

    const { data: trab } = await supabase.from('trabajadores').select('*').eq('email', user.email).single()
    if (trab) {
      setTrabajador(trab)
      const domingo = new Date(lunes)
      domingo.setDate(lunes.getDate() + 6)
      const { data: t } = await supabase
        .from('turnos')
        .select('*')
        .eq('trabajador_id', trab.id)
        .gte('fecha', lunes.toISOString().split('T')[0])
        .lte('fecha', domingo.toISOString().split('T')[0])
        .order('fecha', { ascending: true })
      if (t) setTurnos(t)
    }
  }

  const cambiarSemana = (dias) => {
    const nueva = new Date(semanaInicio)
    nueva.setDate(nueva.getDate() + dias)
    setSemanaInicio(nueva.toISOString().split('T')[0])
    cargarDatos(nueva)
  }

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

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
          <p style={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}>Mis turnos</p>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px' }}>{turnos.length} turnos · {totalHoras.toFixed(0)} horas esta semana</span>
        </div>
      </div>

      <div style={{ padding: '16px' }}>

        {/* NAVEGADOR DE SEMANA */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '12px 16px', marginBottom: '16px', border: '1.5px solid #7abf9a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => cambiarSemana(-7)} style={{ background: '#f0f7f2', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '16px', cursor: 'pointer', color: '#1a7a4a', fontWeight: '700' }}>←</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a4a2e' }}>Semana del {new Date(semanaInicio + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</div>
          </div>
          <button onClick={() => cambiarSemana(7)} style={{ background: '#f0f7f2', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '16px', cursor: 'pointer', color: '#1a7a4a', fontWeight: '700' }}>→</button>
        </div>

        {/* CARDS RESUMEN */}
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

        {/* LISTA DE TURNOS */}
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
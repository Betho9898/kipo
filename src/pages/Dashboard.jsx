import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div style={{ background: '#f0f7f2', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'sans-serif' }}>
      
      {/* TOPBAR */}
      <div style={{
        background: 'linear-gradient(135deg, #1a7a4a 0%, #2eaa6a 60%, #f97316 100%)',
        padding: '14px 16px 20px',
        borderRadius: '0 0 28px 28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <svg viewBox="0 0 130 58" style={{ width: '110px', height: '48px' }} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="cg2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0.15 }} />
              </linearGradient>
            </defs>
            <rect x="8" y="28" width="114" height="26" rx="13" fill="rgba(255,255,255,0.22)" />
            <circle cx="28" cy="30" r="14" fill="rgba(255,255,255,0.22)" />
            <circle cx="62" cy="20" r="20" fill="rgba(255,255,255,0.22)" />
            <circle cx="100" cy="27" r="16" fill="rgba(255,255,255,0.22)" />
            <text x="65" y="42" textAnchor="middle" fontFamily="Nunito,sans-serif" fontSize="22" fontWeight="900" fill="#ffffff" letterSpacing="2">kipu</text>
          </svg>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)', border: '2px solid rgba(255,255,255,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: '700', color: '#fff'
          }}>JG</div>
        </div>
        <div style={{ marginTop: '10px' }}>
          <p style={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}>Hola, Juan García 👋</p>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px' }}>Servicio al cliente · Lunes 4 sep 2026</span>
        </div>
      </div>

      {/* CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '16px' }}>
        {[
          { label: 'Turno hoy', value: '8–5pm', sub: 'Sede norte' },
          { label: 'Horas mes', value: '142', sub: 'de 160 programadas' },
          { label: 'Novedades', value: '2', sub: 'pendientes', orange: true },
          { label: 'Colillas', value: '3', sub: 'disponibles' },
        ].map((c, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: '14px', padding: '14px',
            border: '0.5px solid #c8e6d4'
          }}>
            <div style={{ fontSize: '10px', color: '#4a7a5e', fontWeight: '700', marginBottom: '5px', textTransform: 'uppercase' }}>{c.label}</div>
            <div style={{ fontSize: '22px', fontWeight: '700', color: c.orange ? '#f97316' : '#1a4a2e' }}>{c.value}</div>
            <div style={{ fontSize: '10px', color: '#7aaa8e', marginTop: '2px' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* NOVEDADES */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: '#4a7a5e', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '10px' }}>Solicitar novedad</div>
        {[
          { title: 'Vacaciones', desc: 'Solicitar días de descanso', color: '#e8f7ef', iconColor: '#1a7a4a' },
          { title: 'Permiso', desc: 'Permiso por horas o días', color: '#fff0e6', iconColor: '#f97316' },
          { title: 'Cambio de turno', desc: 'Intercambio con compañero', color: '#e0f7f4', iconColor: '#0d9488' },
          { title: 'Horas extra', desc: 'Reportar tiempo adicional', color: '#f0f9e8', iconColor: '#65a30d' },
        ].map((n, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: '12px', padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: '12px',
            marginBottom: '8px', border: '0.5px solid #c8e6d4', cursor: 'pointer'
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: n.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <span style={{ fontSize: '20px', color: n.iconColor }}>✦</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a4a2e' }}>{n.title}</div>
              <div style={{ fontSize: '11px', color: '#7aaa8e', marginTop: '2px' }}>{n.desc}</div>
            </div>
            <span style={{ color: '#c8e6d4', fontSize: '18px' }}>›</span>
          </div>
        ))}
      </div>

      {/* COLILLAS */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: '#4a7a5e', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '10px' }}>Colillas de pago</div>
        {['Agosto 2026', 'Julio 2026'].map((mes, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: '12px', padding: '13px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '8px', border: '0.5px solid #c8e6d4'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e8f7ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#1a7a4a', fontSize: '18px' }}>📄</span>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a4a2e' }}>{mes}</div>
                <div style={{ fontSize: '11px', color: '#7aaa8e' }}>Disponible</div>
              </div>
            </div>
            <span style={{ fontSize: '12px', color: '#f97316', fontWeight: '700', cursor: 'pointer' }}>Ver ↗</span>
          </div>
        ))}
      </div>

      {/* BOTTOM NAV */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff', borderTop: '0.5px solid #c8e6d4',
        display: 'flex', justifyContent: 'space-around', padding: '10px 0 14px'
      }}>
        {[
          { icon: '🏠', label: 'Inicio', active: true },
          { icon: '📅', label: 'Turnos' },
          { icon: '📄', label: 'Colillas' },
          { icon: '🔔', label: 'Novedades' },
          { icon: '👤', label: 'Perfil' },
        ].map((n, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <span style={{ fontSize: '20px' }}>{n.icon}</span>
            <span style={{ fontSize: '10px', color: n.active ? '#1a7a4a' : '#9abcaa', fontWeight: n.active ? '700' : '400' }}>{n.label}</span>
          </div>
        ))}
      </div>

    </div>
  )
}
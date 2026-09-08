import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tipoLogin, setTipoLogin] = useState('trabajador')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    const { data: trab } = await supabase
      .from('trabajadores')
      .select('rol')
      .eq('email', email)
      .single()

    if (tipoLogin === 'admin') {
      if (trab?.rol === 'admin') {
        navigate('/admin')
      } else {
        await supabase.auth.signOut()
        setError('No tienes permisos de administrador')
        setLoading(false)
      }
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a7a4a 0%, #2eaa6a 60%, #f97316 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: '#fff', borderRadius: '24px', padding: '32px 24px',
        width: '100%', maxWidth: '360px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <svg viewBox="0 0 130 58" style={{ width: '140px', height: '62px' }} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#1a7a4a' }} />
                <stop offset="60%" style={{ stopColor: '#2eaa6a' }} />
                <stop offset="100%" style={{ stopColor: '#f97316' }} />
              </linearGradient>
            </defs>
            <rect x="8" y="28" width="114" height="26" rx="13" fill="url(#cg)" />
            <circle cx="28" cy="30" r="14" fill="url(#cg)" />
            <circle cx="62" cy="20" r="20" fill="url(#cg)" />
            <circle cx="100" cy="27" r="16" fill="url(#cg)" />
            <text x="65" y="42" textAnchor="middle" fontFamily="Nunito,sans-serif" fontSize="22" fontWeight="900" fill="#ffffff" letterSpacing="2">kipu</text>
          </svg>
          <p style={{ color: '#4a7a5e', fontSize: '14px', marginTop: '8px' }}>Gestión de equipos de trabajo</p>
        </div>

        {/* SELECTOR DE TIPO */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button
            onClick={() => setTipoLogin('trabajador')}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: tipoLogin === 'trabajador' ? 'linear-gradient(135deg, #1a7a4a, #2eaa6a)' : '#f0f7f2',
              color: tipoLogin === 'trabajador' ? '#fff' : '#4a7a5e',
              fontSize: '13px', fontWeight: '700'
            }}>
            👤 Trabajador
          </button>
          <button
            onClick={() => setTipoLogin('admin')}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: tipoLogin === 'admin' ? 'linear-gradient(135deg, #1a7a4a, #f97316)' : '#f0f7f2',
              color: tipoLogin === 'admin' ? '#fff' : '#4a7a5e',
              fontSize: '13px', fontWeight: '700'
            }}>
            ⚙️ Admin
          </button>
        </div>

        {error && (
          <div style={{ background: '#ffe4e4', color: '#e53e3e', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#4a7a5e', display: 'block', marginBottom: '6px' }}>Correo</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #4a7a5e', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#4a7a5e', display: 'block', marginBottom: '6px' }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #4a7a5e', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '14px',
            background: 'linear-gradient(135deg, #1a7a4a, #f97316)',
            color: '#fff', border: 'none', borderRadius: '12px',
            fontSize: '15px', fontWeight: '700', cursor: 'pointer',
            opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <span
              onClick={async () => {
                if (!email) { alert('Escribe tu correo primero'); return }
                await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: 'https://kipo-virid.vercel.app/reset-password'
                })
                alert('Te enviamos un correo para recuperar tu contraseña')
              }}
              style={{ fontSize: '13px', color: '#f97316', fontWeight: '700', cursor: 'pointer' }}
            >
              ¿Olvidaste tu contraseña?
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Turnos() {
  const navigate = useNavigate()
  const [trabajadores, setTrabajadores] = useState([])
  const [areas, setAreas] = useState([])
  const [turnos, setTurnos] = useState([])
  const [semanaInicio, setSemanaInicio] = useState('')
  const [generando, setGenerando] = useState(false)
  const [vistaArea, setVistaArea] = useState('todas')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate('/')
    })
    cargarDatos()
    const hoy = new Date()
    const lunes = new Date(hoy)
    lunes.setDate(hoy.getDate() - hoy.getDay() + 1)
    setSemanaInicio(lunes.toISOString().split('T')[0])
  }, [])

  const cargarDatos = async () => {
    const [t, a, tu] = await Promise.all([
      supabase.from('trabajadores').select('*'),
      supabase.from('areas').select('*'),
      supabase.from('turnos').select('*')
    ])
    if (t.data) setTrabajadores(t.data)
    if (a.data) setAreas(a.data)
    if (tu.data) setTurnos(tu.data)
  }

  const getNombreArea = (id) => {
    const a = areas.find(a => a.id === id)
    return a ? a.nombre.toLowerCase() : ''
  }

  const generarTurnos = async () => {
    if (!semanaInicio) return
    setGenerando(true)

    const inicio = new Date(semanaInicio + 'T00:00:00')
    const turnosNuevos = []

    // Agrupar trabajadores por área
    const trabajadoresPorArea = {}
    for (const t of trabajadores) {
      const area = getNombreArea(t.area_id)
      if (!trabajadoresPorArea[area]) trabajadoresPorArea[area] = []
      trabajadoresPorArea[area].push(t)
    }

    for (const trabajador of trabajadores) {
      const area = getNombreArea(trabajador.area_id)
      const esMilestone = area.includes('milestone')
      const esSAC = area.includes('servicio')
      
      // Índice del trabajador en su área para rotar
      const compañeros = trabajadoresPorArea[area] || []
      const idx = compañeros.findIndex(c => c.id === trabajador.id)

      // Días: 0=Lun, 1=Mar, 2=Mié, 3=Jue, 4=Vie, 5=Sáb, 6=Dom
      const diasTrabajo = esSAC ? [0,1,2,3,4,5] : [0,1,2,3,4]
      
      // Descanso compensatorio para SAC (rotativo)
      const descansoSAC = esSAC ? (2 + (idx % 3)) : -1 // Mié, Jue o Vie rotando

      for (const dia of diasTrabajo) {
        if (esSAC && dia === descansoSAC) continue // día de descanso compensatorio

        const fecha = new Date(inicio)
        fecha.setDate(inicio.getDate() + dia)

        let horaInicio, horaFin

        if (esMilestone) {
          // Lun/Mar
          if (dia === 0 || dia === 1) {
            if ((idx + dia) % 2 === 0) { horaInicio = '06:00'; horaFin = '16:00' }
            else { horaInicio = '07:00'; horaFin = '17:00' }
          }
          // Mié/Jue/Vie
          if (dia >= 2 && dia <= 4) {
            if ((idx + dia) % 2 === 0) { horaInicio = '06:00'; horaFin = '15:00' }
            else { horaInicio = '07:00'; horaFin = '16:00' }
          }
          // Sáb para Milestone = descanso (no se agrega)
          if (dia === 5) continue
        } else {
          // Lun/Mar: fijo 7-5
          if (dia === 0 || dia === 1) {
            horaInicio = '07:00'; horaFin = '17:00'
          }
          // Mié/Jue/Vie: alterno
          if (dia >= 2 && dia <= 4) {
            if ((idx + dia) % 2 === 0) { horaInicio = '07:00'; horaFin = '16:00' }
            else { horaInicio = '08:00'; horaFin = '17:00' }
          }
          // Sáb para SAC
          if (dia === 5) {
            horaInicio = '07:00'; horaFin = '13:00'
          }
        }

        if (horaInicio && horaFin) {
          turnosNuevos.push({
            trabajador_id: trabajador.id,
            area_id: trabajador.area_id,
            fecha: fecha.toISOString().split('T')[0],
            hora_inicio: horaInicio,
            hora_fin: horaFin
          })
        }
      }
    }

    // Borrar turnos de esa semana
    const fin = new Date(inicio)
    fin.setDate(inicio.getDate() + 6)
    await supabase.from('turnos').delete()
      .gte('fecha', inicio.toISOString().split('T')[0])
      .lte('fecha', fin.toISOString().split('T')[0])

    await supabase.from('turnos').insert(turnosNuevos)
    await cargarDatos()
    setGenerando(false)
  }

  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  const coloresArea = ['#1a7a4a', '#f97316', '#0d9488', '#65a30d', '#7c3aed', '#db2777']

  const trabajadoresFiltrados = vistaArea === 'todas'
    ? trabajadores
    : trabajadores.filter(t => t.area_id === parseInt(vistaArea))

  const getTurnoTrabajador = (trabajadorId, diaIndex) => {
    if (!semanaInicio) return null
    const fecha = new Date(semanaInicio + 'T00:00:00')
    fecha.setDate(fecha.getDate() + diaIndex)
    const fechaStr = fecha.toISOString().split('T')[0]
    return turnos.find(t => t.trabajador_id === trabajadorId && t.fecha === fechaStr)
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
        </div>
        <div style={{ marginTop: '10px' }}>
          <p style={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}>Horarios y turnos</p>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px' }}>Generación automática semanal equitativa</span>
        </div>
      </div>

      <div style={{ padding: '16px' }}>

        {/* SELECTOR SEMANA */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '16px', border: '0.5px solid #c8e6d4' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#4a7a5e', marginBottom: '8px', textTransform: 'uppercase' }}>Semana a programar</div>
          <input
            type="date"
            value={semanaInicio}
            onChange={e => setSemanaInicio(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #4a7a5e', fontSize: '13px', outline: 'none', marginBottom: '12px', boxSizing: 'border-box', background: '#fff' }}
          />
          <button onClick={generarTurnos} disabled={generando} style={{
            width: '100%', padding: '12px',
            background: generando ? '#ccc' : 'linear-gradient(135deg, #1a7a4a, #f97316)',
            color: '#fff', border: 'none', borderRadius: '10px',
            fontSize: '13px', fontWeight: '700', cursor: generando ? 'not-allowed' : 'pointer'
          }}>
            {generando ? 'Generando...' : '⚡ Generar turnos automáticamente'}
          </button>
        </div>

        {/* FILTRO POR ÁREA */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          <button onClick={() => setVistaArea('todas')} style={{
            padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', flexShrink: 0,
            background: vistaArea === 'todas' ? '#1a7a4a' : '#fff',
            color: vistaArea === 'todas' ? '#fff' : '#4a7a5e',
            fontSize: '12px', fontWeight: '700'
          }}>Todas</button>
          {areas.map((a, i) => (
            <button key={a.id} onClick={() => setVistaArea(String(a.id))} style={{
              padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', flexShrink: 0,
              background: vistaArea === String(a.id) ? coloresArea[i % coloresArea.length] : '#fff',
              color: vistaArea === String(a.id) ? '#fff' : '#4a7a5e',
              fontSize: '12px', fontWeight: '700'
            }}>{a.nombre}</button>
          ))}
        </div>

        {/* TABLA */}
        {turnos.length > 0 && semanaInicio && (
          <div style={{ background: '#fff', borderRadius: '14px', border: '0.5px solid #c8e6d4', overflow: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px repeat(7, 1fr)', background: '#1a7a4a', padding: '10px 12px', minWidth: '600px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#fff' }}>Trabajador</div>
              {diasSemana.map(d => (
                <div key={d} style={{ fontSize: '11px', fontWeight: '700', color: '#fff', textAlign: 'center' }}>{d}</div>
              ))}
            </div>

            {trabajadoresFiltrados.map((t, i) => (
              <div key={t.id} style={{
                display: 'grid', gridTemplateColumns: '120px repeat(7, 1fr)',
                padding: '10px 12px', borderBottom: '0.5px solid #c8e6d4',
                background: i % 2 === 0 ? '#fff' : '#f8fdf9',
                minWidth: '600px'
              }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#1a4a2e' }}>{t.nombre.split(' ')[0]}</div>
                  <div style={{ fontSize: '9px', color: '#7aaa8e' }}>{getNombreArea(t.area_id)}</div>
                </div>
                {diasSemana.map((_, dIdx) => {
                  const turno = getTurnoTrabajador(t.id, dIdx)
                  const esDom = dIdx === 6
                  return (
                    <div key={dIdx} style={{ textAlign: 'center' }}>
                      {esDom ? (
                        <div style={{ fontSize: '9px', color: '#9abcaa', fontWeight: '600' }}>DESC</div>
                      ) : turno ? (
                        <div style={{ fontSize: '9px', color: '#1a7a4a', fontWeight: '600', lineHeight: '1.4' }}>
                          {turno.hora_inicio}<br />{turno.hora_fin}
                        </div>
                      ) : (
                        <div style={{ fontSize: '9px', color: '#f97316', fontWeight: '600' }}>DESC</div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {turnos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7aaa8e', fontSize: '14px' }}>
            Selecciona una semana y genera los turnos automáticamente
          </div>
        )}
      </div>
    </div>
  )
}
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Trabajadores from './pages/Trabajadores'
import Novedades from './pages/Novedades'
import Colillas from './pages/Colillas'
import Turnos from './pages/Turnos'
import Reportes from './pages/Reportes'
import Config from './pages/Config'
import AreaDetalle from './pages/AreaDetalle'
import NovedadesTrabajador from './pages/NovedadesTrabajador'
import ColillasTrabajador from './pages/ColillasTrabajador'
import TurnosTrabajador from './pages/TurnosTrabajador'
import PerfilTrabajador from './pages/PerfilTrabajador'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/trabajadores" element={<Trabajadores />} />
        <Route path="/novedades" element={<Novedades />} />
        <Route path="/colillas" element={<Colillas />} />
        <Route path="/turnos" element={<Turnos />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/config" element={<Config />} />
        <Route path="/area/:id" element={<AreaDetalle />} />
        <Route path="/novedades-trabajador" element={<NovedadesTrabajador />} />
        <Route path="/colillas-trabajador" element={<ColillasTrabajador />} />
        <Route path="/turnos-trabajador" element={<TurnosTrabajador />} />
        <Route path="/perfil-trabajador" element={<PerfilTrabajador />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Trabajadores from './pages/Trabajadores'
import Novedades from './pages/Novedades'
import Colillas from './pages/Colillas'
import Turnos from './pages/Turnos'

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
      </Routes>
    </BrowserRouter>
  )
}

export default App
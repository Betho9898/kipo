import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'
import Trabajadores from './pages/Trabajadores'
import Novedades from './pages/Novedades'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/trabajadores" element={<Trabajadores />} />
        <Route path="/novedades" element={<Novedades />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
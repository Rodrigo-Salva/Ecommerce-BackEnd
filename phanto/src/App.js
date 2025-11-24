import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import DetalleProducto from './pages/DetalleProducto';
import Carrito from './pages/Carrito';
import Categorias from './pages/Categorias';
import ProductosPorCategoria from './pages/ProductosPorCategoria';
import Login from './pages/Login';
import Register from './pages/Register';
import HistorialPedidos from './pages/HistorialPedidos'; // <--- Importa el historial aquí

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/producto/:slugOrId" element={<DetalleProducto />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/categoria/:slug" element={<ProductosPorCategoria />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/historial" element={<HistorialPedidos />} /> {/* <--- Agregar ruta */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;

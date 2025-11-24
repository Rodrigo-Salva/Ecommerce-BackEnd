import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validaciones
    if (
      !formData.username ||
      !formData.email ||
      !formData.first_name ||
      !formData.last_name ||
      !formData.password ||
      !formData.password2
    ) {
      setError('Por favor completa todos los campos');
      setLoading(false);
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Por favor ingresa un email válido');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.password2) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      const result = await register(
        formData.username,
        formData.email,
        formData.password,
        formData.password2,
        formData.first_name,
        formData.last_name
      );
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Error al crear la cuenta');
      }
    } catch {
      setError('Fallo de red o backend');
    }
    setLoading(false);
  };

  return (
    <div className="register-page">
      <div className="register-container fade-in">
        <div className="register-left">
          {/* ...benefits... (sin cambios)... */}
        </div>
        <div className="register-right">
          <div className="register-form-container">
            {/* ...logo-link y textos... */}
            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-group">
                <label htmlFor="username">Usuario</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Tu usuario único"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="first_name">Nombre</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="Tus nombres"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="last_name">Apellidos</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Tus apellidos"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="password">Contraseña</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password2">Confirmar Contraseña</label>
                <input
                  type="password"
                  id="password2"
                  name="password2"
                  value={formData.password2}
                  onChange={handleChange}
                  placeholder="Repite tu contraseña"
                  required
                />
              </div>
              <button type="submit" className="btn-register-submit" disabled={loading}>
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </button>
            </form>
            {error && <div className="error-message">{error}</div>}
            {/* ...resto sin cambios... */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

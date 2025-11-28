// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { API_URL } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // LOGIN
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/users/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Enviamos email como username para que Django lo acepte
        body: JSON.stringify({ username: email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.tokens.access);
        localStorage.setItem('refreshToken', data.tokens.refresh);
        
        const userData = {
          id: data.user.id,
          nombre: data.user.first_name || data.user.username,
          email: data.user.email,
          ...data.user
        };

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        window.dispatchEvent(new Event('storage'));
        return { success: true };
      } else {
        return { success: false, error: data.detail || 'Credenciales inválidas' };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  // REGISTRO REAL (Nuevo)
  const register = async (userData) => {
    try {
      const response = await fetch(`${API_URL}/api/users/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        // Auto-login después del registro
        if (data.tokens) {
            localStorage.setItem('token', data.tokens.access);
            localStorage.setItem('refreshToken', data.tokens.refresh);
            
            const newUser = {
                id: data.user.id,
                nombre: data.user.first_name,
                email: data.user.email
            };
            setUser(newUser);
            localStorage.setItem('user', JSON.stringify(newUser));
            window.dispatchEvent(new Event('storage'));
        }
        return { success: true };
      } else {
        // Capturar errores específicos del backend (ej: "email ya existe")
        const errorMsg = Object.values(data).flat().join(', ') || 'Error al registrarse';
        return { success: false, error: errorMsg };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión al servidor' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.clear();
    window.dispatchEvent(new Event('storage'));
  };

  const value = { user, login, register, logout, loading, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

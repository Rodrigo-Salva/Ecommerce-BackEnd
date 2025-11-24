import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Chequea si hay sesión activa al cargar la app
    const fetchUser = async () => {
      try {
        const resp = await fetch('http://127.0.0.1:8000/api/users/me/', {
          credentials: 'include',
        });
        if (resp.ok) {
          const data = await resp.json();
          setUser(data.user || data);
          localStorage.setItem('user', JSON.stringify(data.user || data));
        } else {
          setUser(null);
          localStorage.removeItem('user');
        }
      } catch {
        setUser(null);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Login robusto: NO permitir datos vacíos ni llamada sin datos
  const login = async (email, password) => {
    if (!email || !password) {
      return { success: false, error: 'Por favor completa todos los campos.' };
    }
    try {
      const response = await fetch('http://127.0.0.1:8000/api/users/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      if (!response.ok) throw new Error('Credenciales inválidas');
      const data = await response.json();
      setUser(data.user || data);
      localStorage.setItem('user', JSON.stringify(data.user || data));
      return { success: true };
    } catch (error) {
      setUser(null);
      localStorage.removeItem('user');
      return { success: false, error: error.message };
    }
  };

  const register = async (username, email, password, password2, first_name, last_name) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/users/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, password, password2, first_name, last_name }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: JSON.stringify(errorData) };
      }
      const data = await response.json();
      setUser(data.user);
      return { success: true };
    } catch (error) {
      setUser(null);
      return { success: false, error: 'Fallo de registro' };
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('user');
    await fetch('http://127.0.0.1:8000/api/users/logout/', {
      method: 'POST',
      credentials: 'include',
    });
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

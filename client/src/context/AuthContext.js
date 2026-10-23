import { createContext, useState, useContext, useEffect } from 'react';
import socket from '../socket';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser && localStorage.getItem('token')) return storedUser;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user || !token) {
      socket.disconnect();
      return;
    }
    socket.auth = { token };
    socket.connect();
    return () => socket.disconnect();
  }, [user]);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

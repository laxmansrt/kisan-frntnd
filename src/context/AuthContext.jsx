import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [farmer, setFarmer] = useState(() => {
    try { return JSON.parse(localStorage.getItem('farmer')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  function login(farmerData, jwt) {
    setFarmer(farmerData);
    setToken(jwt);
    localStorage.setItem('farmer', JSON.stringify(farmerData));
    localStorage.setItem('token', jwt);
  }

  function logout() {
    setFarmer(null);
    setToken(null);
    localStorage.removeItem('farmer');
    localStorage.removeItem('token');
  }

  const apiFetch = useCallback(async (path, opts = {}) => {
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(path, { ...opts, headers });
    if (res.status === 401) { logout(); throw new Error('Session expired'); }
    return res;
  }, [token]);

  return (
    <AuthContext.Provider value={{ farmer, token, login, logout, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

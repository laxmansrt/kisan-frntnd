import { createContext, useContext, useState } from 'react';

const OfficerAuthContext = createContext(null);

export function OfficerAuthProvider({ children }) {
  const [officer, setOfficer] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('officer')); } catch { return null; }
  });
  const [token, setToken] = useState(() => sessionStorage.getItem('officer_token'));

  function login(officerData, jwt) {
    setOfficer(officerData);
    setToken(jwt);
    sessionStorage.setItem('officer', JSON.stringify(officerData));
    sessionStorage.setItem('officer_token', jwt);
  }

  function logout() {
    setOfficer(null);
    setToken(null);
    sessionStorage.removeItem('officer');
    sessionStorage.removeItem('officer_token');
  }

  async function apiFetch(path, opts = {}) {
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(path, { ...opts, headers });
    if (res.status === 401) { logout(); throw new Error('Session expired'); }
    return res;
  }

  return (
    <OfficerAuthContext.Provider value={{ officer, token, login, logout, apiFetch }}>
      {children}
    </OfficerAuthContext.Provider>
  );
}

export function useOfficerAuth() {
  return useContext(OfficerAuthContext);
}

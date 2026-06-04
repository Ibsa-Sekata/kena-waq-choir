import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AdminProfile } from '../types';

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  token: string | null;
  admin: AdminProfile | null;
  isAuthenticated: boolean;
  login: (token: string, profile: AdminProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

function loadFromStorage(): { token: string | null; admin: AdminProfile | null } {
  try {
    const token = localStorage.getItem('adminToken');
    const profileRaw = localStorage.getItem('adminProfile');
    const admin: AdminProfile | null = profileRaw ? JSON.parse(profileRaw) : null;
    return { token, admin };
  } catch {
    return { token: null, admin: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { token: storedToken, admin: storedAdmin } = loadFromStorage();

  const [token, setToken] = useState<string | null>(storedToken);
  const [admin, setAdmin] = useState<AdminProfile | null>(storedAdmin);

  const login = useCallback((newToken: string, profile: AdminProfile) => {
    localStorage.setItem('adminToken', newToken);
    localStorage.setItem('adminProfile', JSON.stringify(profile));
    setToken(newToken);
    setAdmin(profile);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminProfile');
    setToken(null);
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        admin,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export default AuthContext;

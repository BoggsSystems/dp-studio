import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isNewInviteUser: boolean;
  inviteError: string | null;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setIsNewInviteUser: (val: boolean) => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, fullName?: string) => Promise<void>;
  loginAsDemo: (email?: string, name?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('dp_studio_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('dp_studio_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isNewInviteUser, setIsNewInviteUser] = useState<boolean>(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    // 1. If ?invite=token is in the URL, we skip automatic silent accept so CompleteInviteModal can prompt for password
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('invite');

    if (inviteToken) {
      // Clear previous cached workspace state
      localStorage.removeItem('dp_studio_catalog_products');
      localStorage.removeItem('dp_studio_projects');
      localStorage.removeItem('dp_studio_project');
      setIsLoading(false);
      return;
    }

    // 2. Normal token validation
    if (token) {
      const savedUserStr = localStorage.getItem('dp_studio_user');
      if (savedUserStr) {
        try {
          const parsedUser = JSON.parse(savedUserStr);
          if (parsedUser && parsedUser.id) {
            setUser(parsedUser);
            setIsLoading(false);
            return;
          }
        } catch {}
      }

      if (token.startsWith('demo_token_')) {
        const isRos = token.includes('ros');
        const fallbackUser: User = {
          id: isRos ? 'usr_ros' : 'usr_creator',
          email: isRos ? 'ros@opportunity-system.com' : 'creator@opportunity-system.com',
          fullName: isRos ? 'Ros' : 'Studio Creator',
          role: 'PUBLISHER',
        };
        setUser(fallbackUser);
        localStorage.setItem('dp_studio_user', JSON.stringify(fallbackUser));
        setIsLoading(false);
        return;
      }

      api.getMe(token)
        .then((userData) => {
          if (userData) {
            setUser(userData);
            localStorage.setItem('dp_studio_user', JSON.stringify(userData));
          } else {
            logout();
          }
        })
        .catch(() => logout())
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    if (res.token && res.user) {
      localStorage.setItem('dp_studio_token', res.token);
      localStorage.setItem('dp_studio_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
  };

  const register = async (email: string, pass: string, fullName?: string) => {
    const res = await api.register(email, pass, fullName);
    if (res.token && res.user) {
      localStorage.setItem('dp_studio_token', res.token);
      localStorage.setItem('dp_studio_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
  };

  const loginAsDemo = (email = 'creator@opportunity-system.com', name = 'Studio Creator') => {
    const demoUser: User = {
      id: 'usr_demo_' + Date.now(),
      email,
      fullName: name,
      role: 'PUBLISHER',
    };
    const demoToken = 'demo_token_' + Date.now();
    localStorage.setItem('dp_studio_token', demoToken);
    localStorage.setItem('dp_studio_user', JSON.stringify(demoUser));
    setToken(demoToken);
    setUser(demoUser);
  };

  const logout = () => {
    localStorage.removeItem('dp_studio_token');
    localStorage.removeItem('dp_studio_user');
    localStorage.removeItem('dp_studio_catalog_products');
    localStorage.removeItem('dp_studio_projects');
    localStorage.removeItem('dp_studio_project');
    setToken(null);
    setUser(null);
    setIsNewInviteUser(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isNewInviteUser,
        inviteError,
        setToken,
        setUser,
        setIsNewInviteUser,
        login,
        register,
        loginAsDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

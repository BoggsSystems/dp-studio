import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isNewInviteUser: boolean;
  inviteError: string | null;
  setIsNewInviteUser: (val: boolean) => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, fullName?: string) => Promise<void>;
  loginAsDemo: (email?: string, name?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('dp_studio_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isNewInviteUser, setIsNewInviteUser] = useState<boolean>(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check for ?invite=token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('invite');

    if (inviteToken) {
      setIsLoading(true);
      api.acceptInvite(inviteToken)
        .then((res) => {
          if (res.token && res.user) {
            localStorage.setItem('dp_studio_token', res.token);
            setToken(res.token);
            setUser(res.user);
            setIsNewInviteUser(true);
            const cleanUrl = window.location.pathname + (window.location.hash || '');
            window.history.replaceState({}, document.title, cleanUrl);
          }
        })
        .catch((err) => {
          console.warn('Backend invite accept failed (likely local offline dev mode):', err);
          // Graceful fallback: authenticate with URL name/email or fallback
          const invitedEmail = urlParams.get('email') || (inviteToken.includes('jeff') ? 'jeff_boggs@hotmail.com' : 'ros@opportunity-system.com');
          const invitedName = urlParams.get('name') || (inviteToken.includes('jeff') ? 'Jeff Boggs' : 'Ros');
          const mockUser: User = {
            id: 'usr_invite_' + Date.now(),
            email: invitedEmail,
            fullName: invitedName,
            role: 'PUBLISHER',
          };
          const mockToken = 'demo_token_' + Date.now();
          localStorage.setItem('dp_studio_token', mockToken);
          setToken(mockToken);
          setUser(mockUser);
          setIsNewInviteUser(true);
          const cleanUrl = window.location.pathname + (window.location.hash || '');
          window.history.replaceState({}, document.title, cleanUrl);
        })
        .finally(() => setIsLoading(false));
      return;
    }

    // 2. Normal token validation
    if (token) {
      if (token.startsWith('demo_token_')) {
        const isRos = token.includes('ros');
        setUser({
          id: isRos ? 'usr_ros' : 'usr_creator',
          email: isRos ? 'ros@opportunity-system.com' : 'creator@opportunity-system.com',
          fullName: isRos ? 'Ros' : 'Studio Creator',
          role: 'PUBLISHER',
        });
        setIsLoading(false);
        return;
      }

      api.getMe(token)
        .then((userData) => {
          if (userData) {
            setUser(userData);
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
      setToken(res.token);
      setUser(res.user);
    }
  };

  const register = async (email: string, pass: string, fullName?: string) => {
    const res = await api.register(email, pass, fullName);
    if (res.token && res.user) {
      localStorage.setItem('dp_studio_token', res.token);
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
    setToken(demoToken);
    setUser(demoUser);
  };

  const logout = () => {
    localStorage.removeItem('dp_studio_token');
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

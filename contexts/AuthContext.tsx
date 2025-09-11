'use client';

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react';
import { User } from '../types';
import * as authService from '../services/authService';

/**
 * @interface AuthContextType
 * @description Define a forma do contexto de autenticação.
 */
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

/**
 * @constant AuthContext
 * @description Contexto React para gerenciar o estado de autenticação.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * @component AuthProvider
 * @description Provedor de contexto que gerencia o estado de autenticação (usuário, status de login, etc.)
 * e fornece funções de login e logout para seus componentes filhos.
 * @param {{ children: ReactNode }} props - Propriedades do componente.
 * @returns {React.ReactElement} O provedor de contexto de autenticação.
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionUser = authService.getSession();
        if (sessionUser) {
          setUser(sessionUser);
        }
      } catch (error) {
        console.error('Session check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    const loggedInUser = await authService.login(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * @hook useAuth
 * @description Hook customizado para acessar o contexto de autenticação.
 * @returns {AuthContextType} O estado e as funções do contexto de autenticação.
 * @throws {Error} Se o hook for usado fora de um `AuthProvider`.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

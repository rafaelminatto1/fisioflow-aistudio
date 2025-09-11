import { User, Role } from '../types';
import { mockUsers } from '../data/mockData';

const SESSION_KEY = 'fisioflow_user_session';

/**
 * Realiza o login de um usuário (mock).
 * Em uma aplicação real, a senha seria hasheada e comparada no backend.
 * @param {string} email - O email do usuário.
 * @param {string} password - A senha do usuário.
 * @returns {Promise<User>} O objeto do usuário se o login for bem-sucedido.
 * @throws {Error} Se as credenciais forem inválidas.
 */
export const login = (email: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    const user = mockUsers.find(u => u.email === email);
    // In a real app, you would hash and compare the password
    if (user && password === 'password123') {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
      resolve(user);
    } else {
      reject(new Error('Credenciais inválidas.'));
    }
  });
};

/**
 * Realiza o logout do usuário, removendo a sessão do sessionStorage.
 */
export const logout = (): void => {
  sessionStorage.removeItem(SESSION_KEY);
};

/**
 * Obtém a sessão do usuário do sessionStorage.
 * @returns {User | null} O objeto do usuário se a sessão existir, caso contrário, nulo.
 */
export const getSession = (): User | null => {
  const userJson = sessionStorage.getItem(SESSION_KEY);
  if (userJson) {
    return JSON.parse(userJson) as User;
  }
  return null;
};

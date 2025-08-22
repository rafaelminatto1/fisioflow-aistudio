
import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Stethoscope, Loader } from 'lucide-react';
import { Role } from '../types';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('roberto@fisioflow.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = ReactRouterDOM.useNavigate();
  const location = ReactRouterDOM.useLocation();
  
  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login(email, password);
      
      // Redirect based on role
      let destination = from === '/' ? '/dashboard' : from;
      if (user.role === Role.Patient) {
        destination = from === '/' ? '/portal/dashboard' : from;
      } else if (user.role === Role.EducadorFisico) {
        destination = from === '/' ? '/partner/dashboard' : from;
      }
        
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Falha no login. Verifique suas credenciais.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg">
        <div className="text-center">
            <Stethoscope className="w-12 h-12 text-sky-500 mx-auto" />
            <h1 className="mt-4 text-3xl font-bold text-slate-800">Fisio<span className="text-sky-500">Flow</span></h1>
            <p className="mt-2 text-sm text-slate-500">Bem-vindo! Faça login para continuar.</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-sky-500 focus:border-sky-500 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-sky-500 focus:border-sky-500 focus:z-10 sm:text-sm"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-center text-red-600">{error}</p>}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-sky-500 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-sky-300"
              disabled={isLoading}
            >
              {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : 'Entrar'}
            </button>
          </div>
        </form>
         <div className="text-center text-xs text-slate-400 space-y-1">
            <p>Use <code className="bg-slate-100 p-1 rounded">ana.costa@example.com</code> para login de paciente.</p>
            <p>Use <code className="bg-slate-100 p-1 rounded">juliana@fisioflow.com</code> para login de educador físico.</p>
             <p>Use <code className="bg-slate-100 p-1 rounded">admin@fisioflow.com</code> para login de admin.</p>
         </div>
      </div>
    </div>
  );
};

export default LoginPage;
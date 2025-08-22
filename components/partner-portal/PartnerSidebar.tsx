
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { LayoutGrid, Users, LogOut, Stethoscope, Activity, DollarSign } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const PartnerSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = ReactRouterDOM.useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const navItems = [
    { to: '/partner/dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { to: '/partner/clients', icon: Users, label: 'Meus Clientes' },
    { to: '/partner/exercises', icon: Activity, label: 'Exercícios' },
    { to: '/partner/financials', icon: DollarSign, label: 'Financeiro' },
  ];

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="flex items-center justify-center p-4 border-b border-slate-200 h-16">
        <Stethoscope className="w-8 h-8 text-teal-500" />
        <span className="text-xl font-bold text-slate-800 ml-2">Fisio<span className="text-teal-500">Flow</span></span>
      </div>
      <div className="p-4 text-center bg-slate-50 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-500 uppercase">Portal do Parceiro</h3>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {navItems.map((item) => (
          <ReactRouterDOM.NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center p-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-teal-50 text-teal-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <item.icon className="w-6 h-6 mr-3" />
            <span>{item.label}</span>
          </ReactRouterDOM.NavLink>
        ))}
      </nav>
      {user && (
         <div className="p-4 border-t border-slate-200">
            <div className="p-3 rounded-lg bg-slate-100">
                <div className="flex items-center">
                    <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full" />
                    <div className="ml-3">
                        <p className="text-sm font-semibold text-slate-700">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.role}</p>
                    </div>
                     <button onClick={handleLogout} title="Sair" className="ml-auto p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default PartnerSidebar;
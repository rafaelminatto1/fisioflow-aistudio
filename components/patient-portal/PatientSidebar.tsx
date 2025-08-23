
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { LayoutGrid, NotebookText, LogOut, Stethoscope, TrendingUp, ShoppingCart, Ticket, Calendar, FileText, Dumbbell, Bell, Flame } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';

const NavLinkComponent = ({ to, icon: Icon, label, badgeCount }: { to: string, icon: React.ElementType, label: string, badgeCount?: number }) => (
    <ReactRouterDOM.NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center p-3 rounded-lg transition-colors duration-200 ${
          isActive
            ? 'bg-teal-50 text-teal-600 font-semibold'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`
      }
    >
        <Icon className="w-6 h-6 mr-3" />
        <span className="flex-1">{label}</span>
        {badgeCount && badgeCount > 0 ? (
            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                {badgeCount > 9 ? '9+' : badgeCount}
            </span>
        ) : null}
    </ReactRouterDOM.NavLink>
);

const PatientSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = ReactRouterDOM.useNavigate();
  const { unreadCount } = useNotifications(user?.id);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const navItems = [
    { to: '/portal/dashboard', icon: LayoutGrid, label: 'Início' },
    { to: '/portal/appointments', icon: Calendar, label: 'Meus Agendamentos' },
    { to: '/portal/meu-progresso', icon: TrendingUp, label: 'Meu Progresso' },
    { to: '/portal/my-exercises', icon: Dumbbell, label: 'Meus Exercícios' },
    { to: '/portal/notifications', icon: Bell, label: 'Notificações', badgeCount: unreadCount },
    { to: '/portal/pain-diary', icon: NotebookText, label: 'Diário de Dor' },
    { to: '/portal/gamification', icon: Flame, label: 'Meu Engajamento' },
    { to: '/portal/documents', icon: FileText, label: 'Meus Documentos' },
    { to: '/portal/partner-services', icon: ShoppingCart, label: 'Serviços da Parceria' },
    { to: '/portal/my-vouchers', icon: Ticket, label: 'Meus Vouchers' },
  ];

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="flex items-center justify-center p-4 border-b border-slate-200 h-16">
        <Stethoscope className="w-8 h-8 text-teal-500" />
        <span className="text-xl font-bold text-slate-800 ml-2">Fisio<span className="text-teal-500">Flow</span></span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        {navItems.map(({ to, icon, label, badgeCount }) => (
          <NavLinkComponent
            key={to}
            to={to}
            icon={icon}
            label={label}
            badgeCount={badgeCount}
          />
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

export default PatientSidebar;
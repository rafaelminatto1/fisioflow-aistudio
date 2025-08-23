
import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { LayoutGrid, Users, Calendar, Stethoscope, ChevronLeft, ChevronRight, BarChart3, ShieldCheck, Cog, Library, AreaChart, LogOut, FilePlus, FileClock, Dumbbell, AlertTriangle, Activity, Users2, Mail, BookMarked, ClipboardList, PieChart, DollarSign, SlidersHorizontal, FilePenLine, Bell, BrainCircuit, MessageSquare, Handshake, Package, Ticket } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

const NavLinkComponent = ({ to, icon: Icon, label, isCollapsed, badgeCount }: { to: string, icon: React.ElementType, label: string, isCollapsed: boolean, badgeCount?: number }) => (
    <ReactRouterDOM.NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center p-3 rounded-lg transition-colors duration-200 ${
          isActive
            ? 'bg-slate-800 text-sky-400 font-semibold'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        } ${isCollapsed ? 'justify-center' : ''}`
      }
      title={isCollapsed ? label : undefined}
    >
        <div className="relative w-full flex items-center">
            <Icon className={`w-6 h-6 shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && <span className="truncate flex-1">{label}</span>}
            
            {!isCollapsed && badgeCount && badgeCount > 0 ? (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                    {badgeCount > 9 ? '9+' : badgeCount}
                </span>
            ) : null}

             {isCollapsed && badgeCount && badgeCount > 0 ? (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 ring-2 ring-slate-900"></span>
            ) : null}
        </div>
    </ReactRouterDOM.NavLink>
);

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = ReactRouterDOM.useNavigate();
  const { unreadCount } = useNotifications(user?.id);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const topNavItems = [
    { to: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { to: '/clinical-analytics', icon: PieChart, label: 'Dashboard Clínico' },
    { to: '/patients', icon: Users, label: 'Pacientes' },
    { to: '/agenda', icon: Calendar, label: 'Agenda' },
    { to: '/events', icon: Ticket, label: 'Eventos' },
    { to: '/acompanhamento', icon: Activity, label: 'Acompanhamento' },
    { to: '/notifications', icon: Bell, label: 'Notificações', badgeCount: unreadCount },
    { to: '/whatsapp', icon: MessageSquare, label: 'WhatsApp' },
    { to: '/groups', icon: Users2, label: 'Grupos' },
    { to: '/tasks', icon: ClipboardList, label: 'Quadro de Tarefas' },
    { to: '/avaliacoes', icon: FilePenLine, label: 'Avaliações' },
    { to: '/exercises', icon: Dumbbell, label: 'Exercícios' },
    { to: '/materials', icon: BookMarked, label: 'Materiais Clínicos' },
    { to: '/gerar-laudo', icon: FilePlus, label: 'Gerar Laudo' },
    { to: '/gerar-evolucao', icon: FileClock, label: 'Gerar Evolução' },
    { to: '/gerar-hep', icon: Dumbbell, label: 'Gerar Plano (HEP)' },
    { to: '/analise-risco', icon: AlertTriangle, label: 'Análise de Risco' },
    { to: '/email-inativos', icon: Mail, label: 'Email para Inativos' },
    { to: '/mentoria', icon: BrainCircuit, label: 'Mentoria' },
  ];

  const bottomNavItems = [
    { to: '/inventory', icon: Package, label: 'Insumos' },
    { to: '/financials', icon: DollarSign, label: 'Controle Financeiro' },
    { to: '/partnerships', icon: Handshake, label: 'Parcerias' },
    { to: '/reports', icon: BarChart3, label: 'Relatórios' },
    { to: '/knowledge-base', icon: Library, label: 'Base de Conhecimento' },
    { to: '/ia-economica', icon: AreaChart, label: 'IA Econômica' },
    { to: '/ai-settings', icon: SlidersHorizontal, label: 'Configurações de IA' },
    { to: '/agenda-settings', icon: SlidersHorizontal, label: 'Config. Agenda' },
    { to: '/audit-log', icon: ShieldCheck, label: 'Trilha de Auditoria' },
    { to: '/settings', icon: Cog, label: 'Configurações' },
  ];

  return (
    <div className={`transition-all duration-300 ease-in-out bg-slate-900 border-r border-slate-800 flex flex-col ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-between p-4 border-b border-slate-800 h-16 shrink-0">
        {!isCollapsed && <Stethoscope className="w-8 h-8 text-sky-500" />}
        {!isCollapsed && <span className="text-xl font-bold text-slate-50">Fisio<span className="text-sky-500">Flow</span></span>}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 rounded-full text-slate-400 hover:bg-slate-800">
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {topNavItems.map((item) => <NavLinkComponent key={item.to} to={item.to} icon={item.icon} label={item.label} isCollapsed={isCollapsed} badgeCount={item.badgeCount} />)}
        
        {!isCollapsed && (
            <div className="pt-2 pb-1 px-3">
                <div className="border-t border-slate-700/60"></div>
            </div>
        )}

        {bottomNavItems.map((item) => <NavLinkComponent key={item.to} to={item.to} icon={item.icon} label={item.label} isCollapsed={isCollapsed} />)}
      </nav>

      {user && (
         <div className="p-2 border-t border-slate-800 shrink-0">
            {isCollapsed ? (
                <button onClick={handleLogout} title="Sair" className="w-full p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors duration-200">
                    <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full mx-auto" />
                </button>
            ) : (
                <button onClick={handleLogout} title="Sair" className="w-full p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors duration-200">
                    <div className="flex items-center">
                        <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full" />
                        <div className="ml-3 text-left flex-1">
                            <p className="text-sm font-semibold text-slate-100 truncate">{user.name}</p>
                            <p className="text-xs text-slate-400 truncate">{user.role}</p>
                        </div>
                        <div className="ml-2 p-2 rounded-md bg-slate-700 text-slate-300">
                            <LogOut className="w-5 h-5" />
                        </div>
                    </div>
                </button>
            )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
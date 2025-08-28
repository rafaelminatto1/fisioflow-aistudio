import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutGrid,
  Users,
  Calendar,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  ShieldCheck,
  Cog,
  Library,
  AreaChart,
  LogOut,
  FilePlus,
  FileClock,
  Dumbbell,
  AlertTriangle,
  Mail,
  BrainCircuit,
  ClipboardList,
  PieChart,
  DollarSign,
  SlidersHorizontal,
  Bell,
  MessageSquare,
  Handshake,
  Package,
  Ticket,
  Activity,
  Users2,
  BookMarked,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';

const NavLinkComponent = ({
  to,
  icon: Icon,
  label,
  isCollapsed,
  badgeCount,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  isCollapsed: boolean;
  badgeCount?: number;
}) => {
  const pathname = usePathname();
  const isActive = pathname === to;

  return (
    <Link
      href={to}
      className={`flex items-center p-2.5 rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-sky-500/10 text-sky-400 font-semibold'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      } ${isCollapsed ? 'justify-center' : ''}`}
      title={isCollapsed ? label : undefined}
    >
      <div className='relative flex items-center w-full'>
        <Icon className={`w-5 h-5 shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
        {!isCollapsed && (
          <span className='truncate flex-1 text-sm'>{label}</span>
        )}

        {!isCollapsed && badgeCount && badgeCount > 0 ? (
          <span className='ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white'>
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        ) : null}

        {isCollapsed && badgeCount && badgeCount > 0 ? (
          <span className='absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-slate-900'></span>
        ) : null}
      </div>
    </Link>
  );
};

const NavGroup: React.FC<{
  title: string;
  isCollapsed: boolean;
  children: React.ReactNode;
}> = ({ title, isCollapsed, children }) => (
  <div>
    {!isCollapsed && (
      <h3 className='px-3 pt-4 pb-2 text-xs font-semibold uppercase text-slate-500 tracking-wider'>
        {title}
      </h3>
    )}
    <div className='space-y-1'>{children}</div>
  </div>
);

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const { unreadCount } = useNotifications(user?.id);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const mainNav = [
    { to: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { to: '/clinical-analytics', icon: PieChart, label: 'Dashboard Clínico' },
    { to: '/patients', icon: Users, label: 'Pacientes' },
    { to: '/agenda', icon: Calendar, label: 'Agenda' },
    { to: '/acompanhamento', icon: Activity, label: 'Acompanhamento' },
    {
      to: '/notifications',
      icon: Bell,
      label: 'Notificações',
      badgeCount: unreadCount,
    },
    { to: '/tasks', icon: ClipboardList, label: 'Quadro de Tarefas' },
  ];

  const aiToolsNav = [
    { to: '/gerar-laudo', icon: FilePlus, label: 'Gerar Laudo' },
    { to: '/gerar-evolucao', icon: FileClock, label: 'Gerar Evolução' },
    { to: '/gerar-hep', icon: Dumbbell, label: 'Gerar Plano (HEP)' },
    { to: '/analise-risco', icon: AlertTriangle, label: 'Análise de Risco' },
  ];

  const managementNav = [
    { to: '/groups', icon: Users2, label: 'Grupos' },
    { to: '/exercises', icon: Dumbbell, label: 'Exercícios' },
    { to: '/materials', icon: BookMarked, label: 'Materiais Clínicos' },
    { to: '/financials', icon: DollarSign, label: 'Financeiro' },
    { to: '/inventory', icon: Package, label: 'Insumos' },
    { to: '/partnerships', icon: Handshake, label: 'Parcerias' },
    { to: '/events', icon: Ticket, label: 'Eventos' },
    { to: '/whatsapp', icon: MessageSquare, label: 'WhatsApp' },
    { to: '/email-inativos', icon: Mail, label: 'Email para Inativos' },
    { to: '/mentoria', icon: BrainCircuit, label: 'Mentoria' },
    { to: '/reports', icon: BarChart3, label: 'Relatórios' },
    { to: '/knowledge-base', icon: Library, label: 'Base de Conhecimento' },
    { to: '/ia-economica', icon: AreaChart, label: 'IA Econômica' },
    {
      to: '/agenda-settings',
      icon: SlidersHorizontal,
      label: 'Config. Agenda',
    },
    { to: '/ai-settings', icon: SlidersHorizontal, label: 'Config. IA' },
    { to: '/audit-log', icon: ShieldCheck, label: 'Auditoria' },
    { to: '/settings', icon: Cog, label: 'Configurações' },
  ];

  return (
    <div
      className={`transition-all duration-300 ease-in-out bg-slate-900 border-r border-slate-800 flex flex-col ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      <div className='flex items-center p-4 border-b border-slate-800 h-16 shrink-0'>
        {!isCollapsed && <Stethoscope className='w-8 h-8 text-sky-400' />}
        {!isCollapsed && (
          <span className='text-xl font-bold text-slate-50 ml-2'>
            Fisio<span className='text-sky-400'>Flow</span>
          </span>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-full text-slate-400 hover:bg-slate-800 ${isCollapsed ? 'ml-auto' : 'ml-auto'}`}
        >
          {isCollapsed ? (
            <ChevronRight className='w-5 h-5' />
          ) : (
            <ChevronLeft className='w-5 h-5' />
          )}
        </button>
      </div>

      <nav className='flex-1 px-3 py-4 space-y-1 overflow-y-auto'>
        <NavGroup title='Principal' isCollapsed={isCollapsed}>
          {mainNav.map(item => (
            <NavLinkComponent
              key={item.to}
              {...item}
              isCollapsed={isCollapsed}
            />
          ))}
        </NavGroup>
        <NavGroup title='Ferramentas IA' isCollapsed={isCollapsed}>
          {aiToolsNav.map(item => (
            <NavLinkComponent
              key={item.to}
              {...item}
              isCollapsed={isCollapsed}
            />
          ))}
        </NavGroup>
        <NavGroup title='Gestão' isCollapsed={isCollapsed}>
          {managementNav.map(item => (
            <NavLinkComponent
              key={item.to}
              {...item}
              isCollapsed={isCollapsed}
            />
          ))}
        </NavGroup>
      </nav>

      {user && (
        <div className='p-3 border-t border-slate-800 shrink-0'>
          <div className='flex items-center w-full p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors duration-200'>
            <Image
              src={user.avatarUrl}
              alt={user.name}
              width={36}
              height={36}
              className='w-9 h-9 rounded-full shrink-0'
            />
            {!isCollapsed && (
              <div className='ml-3 text-left flex-1 overflow-hidden'>
                <p className='text-sm font-semibold text-slate-100 truncate'>
                  {user.name}
                </p>
                <p className='text-xs text-slate-400 truncate'>{user.role}</p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                title='Sair'
                className='ml-2 p-2 rounded-md text-slate-500 hover:text-white'
              >
                <LogOut className='w-5 h-5' />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;

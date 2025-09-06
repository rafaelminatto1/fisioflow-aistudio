'use client';

import React, { useState, useEffect } from 'react';
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
import { useSession, signOut } from 'next-auth/react';
// import { useNotifications } from '../hooks/useNotifications';
import { ThemeToggle, FloatingThemeToggle } from './ui/theme-toggle';
import { cn } from '@/lib/utils';

<<<<<<< HEAD:src/components/Sidebar.tsx
const NavLinkComponent = ({ to, icon: Icon, label, isCollapsed, badgeCount }: { to: string, icon: React.ElementType, label: string, isCollapsed: boolean, badgeCount?: number }) => {
    const pathname = usePathname();
    const isActive = pathname === to;
    const [isHovered, setIsHovered] = useState(false);
    
    return (
        <Link
          href={to}
          className={cn(
            "group relative flex items-center p-2.5 rounded-lg transition-all duration-300 ease-out",
            "hover:scale-[1.02] hover:shadow-lg hover:shadow-sky-500/10",
            isActive
              ? 'bg-gradient-to-r from-sky-500/20 to-sky-400/10 text-sky-400 font-semibold shadow-lg shadow-sky-500/20 border border-sky-500/20'
              : 'text-slate-400 hover:bg-gradient-to-r hover:from-slate-800/80 hover:to-slate-700/40 hover:text-white hover:border-slate-600/50',
            isCollapsed ? 'justify-center' : '',
            "border border-transparent"
          )}
          title={isCollapsed ? label : undefined}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
            {/* Active indicator */}
            {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-sky-400 to-sky-500 rounded-r-full animate-pulse" />
            )}
            
            <div className="relative flex items-center w-full z-10">
                <div className={cn(
                    "relative transition-all duration-300",
                    isHovered && !isCollapsed && "transform translate-x-1"
                )}>
                    <Icon className={cn(
                        "w-5 h-5 shrink-0 transition-all duration-300",
                        isCollapsed ? '' : 'mr-3',
                        isActive && "drop-shadow-lg",
                        isHovered && "scale-110"
                    )} />
                    
                    {/* Icon glow effect for active state */}
                    {isActive && (
                        <Icon className="absolute inset-0 w-5 h-5 shrink-0 text-sky-400/30 blur-sm animate-pulse" />
                    )}
                </div>
                
                {!isCollapsed && (
                    <span className={cn(
                        "truncate flex-1 text-sm transition-all duration-300",
                        isHovered && "transform translate-x-1"
                    )}>
                        {label}
                    </span>
                )}
                
                {/* Badge for notifications */}
                {!isCollapsed && badgeCount && badgeCount > 0 && (
                    <span className={cn(
                        "ml-auto flex h-5 w-5 items-center justify-center rounded-full",
                        "bg-gradient-to-r from-red-500 to-red-600 text-xs font-medium text-white",
                        "shadow-lg shadow-red-500/30 animate-pulse",
                        "transition-transform duration-300",
                        isHovered && "scale-110"
                    )}>
                        {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                )}

                {/* Collapsed badge indicator */}
                {isCollapsed && badgeCount && badgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-red-500 to-red-600 ring-2 ring-slate-900 animate-pulse shadow-lg shadow-red-500/50" />
                )}
            </div>
            
            {/* Hover effect overlay */}
            <div className={cn(
                "absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300",
                "bg-gradient-to-r from-transparent via-white/5 to-transparent",
                isHovered && "opacity-100"
            )} />
        </Link>
    );
};

const NavGroup: React.FC<{ title: string; isCollapsed: boolean; children: React.ReactNode }> = ({ title, isCollapsed, children }) => {
    const [isGroupHovered, setIsGroupHovered] = useState(false);
    
    return (
        <div 
            className="transition-all duration-300"
            onMouseEnter={() => setIsGroupHovered(true)}
            onMouseLeave={() => setIsGroupHovered(false)}
        >
            {!isCollapsed && (
                <div className="relative px-3 pt-4 pb-2">
                    <h3 className={cn(
                        "text-xs font-semibold uppercase tracking-wider transition-all duration-300",
                        "text-slate-500 hover:text-slate-400",
                        isGroupHovered && "text-slate-400 transform translate-x-1"
                    )}>
                        {title}
                    </h3>
                    {/* Animated underline */}
                    <div className={cn(
                        "absolute bottom-1 left-3 h-px bg-gradient-to-r from-sky-500/50 to-transparent transition-all duration-500",
                        isGroupHovered ? "w-12 opacity-100" : "w-0 opacity-0"
                    )} />
                </div>
            )}
            <div className="space-y-1">
                {children}
            </div>
        </div>
    );
};
=======
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
>>>>>>> 0a044a4fefabf8a04dc73a6184972379c66221b3:components/Sidebar.tsx

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  // const { unreadCount } = useNotifications(session?.user?.id);
  const unreadCount = 0; // Temporary fix

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
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
<<<<<<< HEAD:src/components/Sidebar.tsx
    <>
      <div className={cn(
        "transition-all duration-500 ease-out bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800",
        "border-r border-slate-700/50 flex flex-col shadow-2xl backdrop-blur-sm",
        isCollapsed ? 'w-20' : 'w-64'
      )}>
      <div className="relative flex items-center p-4 border-b border-slate-700/50 h-16 shrink-0 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
        {/* Logo and brand */}
        <div className={cn(
          "flex items-center transition-all duration-500 ease-out",
          isCollapsed ? "opacity-0 scale-75" : "opacity-100 scale-100"
        )}>
          <div className="relative">
            <Stethoscope className="w-8 h-8 text-sky-400 drop-shadow-lg" />
            <Stethoscope className="absolute inset-0 w-8 h-8 text-sky-400/30 blur-sm animate-pulse" />
          </div>
          <span className="text-xl font-bold text-slate-50 ml-2">
            Fisio<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-sky-300">Flow</span>
          </span>
        </div>
        
        {/* Theme toggle and collapse button */}
        <div className="ml-auto flex items-center gap-1">
          {!isCollapsed && (
            <ThemeToggle variant="compact" />
          )}
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className={cn(
              "p-2 rounded-lg text-slate-400 transition-all duration-300 ease-out",
              "hover:bg-slate-700/50 hover:text-sky-400 hover:scale-110",
              "focus:outline-none focus:ring-2 focus:ring-sky-500/50",
              "group relative overflow-hidden"
            )}
            title={isCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
          >
            <div className="relative z-10">
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5" />
              ) : (
                <ChevronLeft className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-0.5" />
              )}
            </div>
            {/* Button hover effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>
        
        {/* Header glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-sky-500/5 to-transparent opacity-50" />
      </div>
      
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent hover:scrollbar-thumb-slate-600">
        <div className="relative">
          <NavGroup title="Principal" isCollapsed={isCollapsed}>
              {mainNav.map(item => <NavLinkComponent key={item.to} {...item} isCollapsed={isCollapsed} />)}
          </NavGroup>
          {/* Subtle separator */}
          <div className="mx-3 my-4 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
        </div>
        <div className="relative">
          <NavGroup title="Ferramentas IA" isCollapsed={isCollapsed}>
              {aiToolsNav.map(item => <NavLinkComponent key={item.to} {...item} isCollapsed={isCollapsed} />)}
          </NavGroup>
          {/* Subtle separator */}
          <div className="mx-3 my-4 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
        </div>
        <div className="relative">
          <NavGroup title="Gestão" isCollapsed={isCollapsed}>
              {managementNav.map(item => <NavLinkComponent key={item.to} {...item} isCollapsed={isCollapsed} />)}
          </NavGroup>
        </div>
      </nav>

      {session?.user && (
        <div className="relative p-4 border-t border-slate-700/50 mt-auto bg-gradient-to-t from-slate-800/30 to-transparent">
          <div className={cn(
            "flex items-center transition-all duration-300 ease-out",
            "hover:bg-slate-800/30 rounded-xl p-2 -m-2 group"
          )}>
            {/* Avatar with status indicator */}
            <div className="relative">
              <div className={cn(
                "w-10 h-10 bg-gradient-to-br from-sky-500 to-sky-600 rounded-full",
                "flex items-center justify-center text-white font-semibold",
                "shadow-lg ring-2 ring-sky-500/20 transition-all duration-300",
                "group-hover:ring-sky-400/40 group-hover:shadow-sky-500/25"
              )}>
                {session.user.name?.charAt(0) || 'U'}
              </div>
              {/* Online status indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse" />
            </div>
            
            {!isCollapsed && (
              <>
                {/* User info */}
                <div className="flex-1 min-w-0 ml-3">
                  <p className={cn(
                    "text-sm font-medium text-slate-50 truncate transition-colors duration-200",
                    "group-hover:text-white"
                  )}>
                    {session.user.name}
                  </p>
                  <p className={cn(
                    "text-xs text-slate-400 truncate transition-colors duration-200",
                    "group-hover:text-slate-300"
                  )}>
                    {session.user.email}
                  </p>
                </div>
                
                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className={cn(
                    "p-2 text-slate-400 rounded-lg transition-all duration-200 ease-out",
                    "hover:text-red-400 hover:bg-red-500/10 hover:scale-110",
                    "focus:outline-none focus:ring-2 focus:ring-red-500/50",
                    "group/logout relative overflow-hidden"
                  )}
                  title="Sair"
                >
                  <LogOut className="w-4 h-4 relative z-10 transition-transform duration-200 group-hover/logout:rotate-12" />
                  {/* Button hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-transparent opacity-0 group-hover/logout:opacity-100 transition-opacity duration-200" />
                </button>
              </>
            )}
          </div>
          
          {/* Footer glow effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-sky-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
=======
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
>>>>>>> 0a044a4fefabf8a04dc73a6184972379c66221b3:components/Sidebar.tsx
        </div>
      )}
      </div>
      
      {/* Floating theme toggle when sidebar is collapsed */}
      {isCollapsed && <FloatingThemeToggle />}
    </>
  );
};

export default Sidebar;

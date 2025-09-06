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
import { useNotifications } from '../hooks/useNotifications';
import { ThemeToggle, FloatingThemeToggle } from './ui/theme-toggle';
import { cn } from '@/lib/utils';

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

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const { unreadCount } = useNotifications(session?.user?.id);

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
      <>
        <div className={cn(
          "transition-all duration-500 ease-in-out bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800",
          "border-r border-slate-700/50 flex flex-col relative overflow-hidden",
          "shadow-2xl shadow-slate-900/50",
          isCollapsed ? "w-20" : "w-72"
        )}>
          {/* Background pattern overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.03),transparent_50%)] pointer-events-none" />
          
          {/* Header with logo and collapse button */}
          <div className={cn(
            "flex items-center border-b border-slate-700/30 h-16 shrink-0 relative",
            "bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-sm",
            isCollapsed ? "px-3 justify-center" : "px-6 justify-between"
          )}>
            {/* Logo section */}
            <div className={cn(
              "flex items-center transition-all duration-500 ease-out",
              isCollapsed ? "opacity-0 scale-75" : "opacity-100 scale-100"
            )}>
              <div className="relative">
                <Stethoscope className="w-8 h-8 text-sky-400 drop-shadow-lg" />
                {/* Logo glow effect */}
                <Stethoscope className="absolute inset-0 w-8 h-8 text-sky-400/30 blur-sm animate-pulse" />
              </div>
              {!isCollapsed && (
                <span className={cn(
                  "text-xl font-bold ml-3 transition-all duration-500 ease-out",
                  "bg-gradient-to-r from-slate-50 to-slate-200 bg-clip-text text-transparent"
                )}>
                  Fisio<span className="bg-gradient-to-r from-sky-400 to-sky-500 bg-clip-text text-transparent">Flow</span>
                </span>
              )}
            </div>

            {/* Theme toggle button */}
            {!isCollapsed && (
              <ThemeToggle variant="compact" />
            )}

            {/* Collapse button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                "p-2 rounded-xl transition-all duration-300 ease-out relative group",
                "text-slate-400 hover:text-sky-400 hover:bg-slate-800/50",
                "hover:scale-110 hover:shadow-lg hover:shadow-sky-500/20",
                "focus:outline-none focus:ring-2 focus:ring-sky-500/50",
                isCollapsed ? "mx-auto" : "ml-2"
              )}
              title={isCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
            >
              <div className="relative">
                {isCollapsed ? (
                  <ChevronRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5" />
                ) : (
                  <ChevronLeft className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-0.5" />
                )}
                {/* Button glow effect */}
                <div className="absolute inset-0 bg-sky-400/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
              </div>
            </button>
          </div>

          {/* Navigation */}
          <nav className={cn(
            "flex-1 py-6 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600",
            "hover:scrollbar-thumb-slate-500 transition-colors duration-300",
            isCollapsed ? "px-2" : "px-4"
          )}>
            <NavGroup title="Principal" isCollapsed={isCollapsed}>
              {mainNav.map((item) => (
                <NavLinkComponent
                  key={item.to}
                  {...item}
                  isCollapsed={isCollapsed}
                />
              ))}
            </NavGroup>
            
            <NavGroup title="Ferramentas IA" isCollapsed={isCollapsed}>
              {aiToolsNav.map((item) => (
                <NavLinkComponent
                  key={item.to}
                  {...item}
                  isCollapsed={isCollapsed}
                />
              ))}
            </NavGroup>
            
            <NavGroup title="Gestão" isCollapsed={isCollapsed}>
              {managementNav.map((item) => (
                <NavLinkComponent
                  key={item.to}
                  {...item}
                  isCollapsed={isCollapsed}
                />
              ))}
            </NavGroup>
          </nav>

          {/* User section */}
          {session?.user && (
            <div className={cn(
              "border-t border-slate-700/30 shrink-0 relative",
              "bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-sm",
              isCollapsed ? "p-3" : "p-4"
            )}>
              <div className={cn(
                "group flex items-center w-full rounded-xl transition-all duration-300 ease-out",
                "text-slate-300 hover:bg-slate-800/50 hover:text-white",
                "hover:shadow-lg hover:shadow-slate-900/50 relative overflow-hidden",
                isCollapsed ? "p-2 justify-center" : "p-3"
              )}>
                {/* User avatar with enhanced styling */}
                <div className="relative">
                  <div className={cn(
                    "bg-gradient-to-br from-sky-500 to-sky-600 rounded-full",
                    "flex items-center justify-center text-white font-semibold",
                    "shadow-lg ring-2 ring-slate-700 group-hover:ring-sky-500/50",
                    "group-hover:scale-105 transition-all duration-300 ease-out",
                    isCollapsed ? "w-8 h-8" : "w-10 h-10"
                  )}>
                    {session.user.name?.charAt(0) || 'U'}
                  </div>
                  {/* Avatar glow effect */}
                  <div className="absolute inset-0 rounded-full bg-sky-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                </div>
                
                {!isCollapsed && (
                  <>
                    <div className="ml-3 text-left flex-1 overflow-hidden">
                      <p className={cn(
                        "text-sm font-semibold transition-all duration-300 ease-out",
                        "text-slate-100 group-hover:text-white truncate"
                      )}>
                        {session.user.name}
                      </p>
                      <p className={cn(
                        "text-xs transition-all duration-300 ease-out",
                        "text-slate-400 group-hover:text-slate-300 truncate"
                      )}>
                        {session.user.email}
                      </p>
                    </div>
                    
                    {/* Logout button */}
                    <button
                      onClick={handleLogout}
                      title="Sair"
                      className={cn(
                        "ml-2 p-2 rounded-lg transition-all duration-300 ease-out",
                        "text-slate-500 hover:text-red-400 hover:bg-red-500/10",
                        "hover:scale-110 hover:shadow-lg hover:shadow-red-500/20",
                        "focus:outline-none focus:ring-2 focus:ring-red-500/50"
                      )}
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </>
                )}
                
                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              </div>
              
              {/* Footer glow effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-sky-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
            </div>
          )}
        </div>
        
        {/* Floating theme toggle when sidebar is collapsed */}
        {isCollapsed && <FloatingThemeToggle />}
      </>
  );
};

export default Sidebar;

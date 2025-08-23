// src/components/layout/Sidebar.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
    LayoutGrid, Users, Calendar, BarChart3, ShieldCheck, Cog, LogOut, Stethoscope, 
    ChevronLeft, ChevronRight, PieChart, Ticket, Activity, Bell, MessageSquare, 
    Users2, ClipboardList, FilePenLine, Dumbbell, BookMarked, FilePlus, FileClock, 
    AlertTriangle, Mail, BrainCircuit, Package, DollarSign, Handshake, Library, AreaChart, SlidersHorizontal 
} from 'lucide-react';

const NavLink = ({ href, icon: Icon, label, isCollapsed }: { href: string, icon: React.ElementType, label: string, isCollapsed: boolean }) => {
    const pathname = usePathname();
    const isActive = pathname === href;

    return (
        <Link
          href={href}
          className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
              isActive
                ? 'bg-slate-800 text-sky-400 font-semibold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            } ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? label : undefined}
        >
            <Icon className={`w-6 h-6 shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && <span className="truncate">{label}</span>}
        </Link>
    );
};

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session } = useSession();
  const user = session?.user;

  const topNavItems = [
    { href: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
    { href: '/dashboard/clinical-analytics', icon: PieChart, label: 'Dashboard Clínico' },
    { href: '/dashboard/pacientes', icon: Users, label: 'Pacientes' },
    { href: '/dashboard/agenda', icon: Calendar, label: 'Agenda' },
    // Add other routes as they are migrated
  ];
  
  const bottomNavItems = [
    { href: '/dashboard/reports', icon: BarChart3, label: 'Relatórios' },
    { href: '/dashboard/audit-log', icon: ShieldCheck, label: 'Trilha de Auditoria' },
    { href: '/dashboard/settings', icon: Cog, label: 'Configurações' },
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
        {topNavItems.map((item) => <NavLink key={item.href} {...item} isCollapsed={isCollapsed} />)}
        
        {!isCollapsed && (
            <div className="pt-2 pb-1 px-3">
                <div className="border-t border-slate-700/60"></div>
            </div>
        )}

        {bottomNavItems.map((item) => <NavLink key={item.href} {...item} isCollapsed={isCollapsed} />)}
      </nav>

      {user && (
         <div className="p-2 border-t border-slate-800 shrink-0">
            {isCollapsed ? (
                <button onClick={() => signOut()} title="Sair" className="w-full p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors duration-200">
                    <img src={user.avatarUrl || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.name || 'Avatar'} className="w-10 h-10 rounded-full mx-auto" />
                </button>
            ) : (
                <div className="p-2">
                    <div className="flex items-center">
                        <img src={user.avatarUrl || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.name || 'Avatar'} className="w-10 h-10 rounded-full" />
                        <div className="ml-3 text-left flex-1">
                            <p className="text-sm font-semibold text-slate-100 truncate">{user.name}</p>
                            <p className="text-xs text-slate-400 capitalize">{String(user.role).toLowerCase()}</p>
                        </div>
                        <button onClick={() => signOut()} title="Sair" className="ml-2 p-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
}

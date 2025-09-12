'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Dumbbell,
  FileText,
  DollarSign,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Activity,
  Heart,
  Zap
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pacientes', href: '/pacientes', icon: Users },
  { name: 'Agenda', href: '/agenda', icon: Calendar },
  { name: 'Exercícios', href: '/exercicios', icon: Dumbbell },
  { name: 'Prescrições', href: '/prescricoes', icon: FileText },
  { name: 'Financeiro', href: '/financeiro', icon: DollarSign },
  { name: 'Mensagens', href: '/mensagens', icon: MessageSquare },
  { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
  { name: 'IA Analytics', href: '/ia-analytics', icon: Zap },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
];

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobile}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-lg border border-gray-200"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleMobile}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed left-0 top-0 h-full z-40 bg-white border-r border-gray-200 transition-all duration-300 shadow-lg
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <motion.div
            initial={false}
            animate={{ opacity: isCollapsed ? 0 : 1 }}
            className="flex items-center space-x-3"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-gray-900">FisioFlow</h1>
                <p className="text-xs text-gray-500">AI Studio</p>
              </div>
            )}
          </motion.div>
          
          {/* Collapse Button - Desktop */}
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <item.icon
                  className={`
                    w-5 h-5 transition-colors
                    ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}
                  `}
                />
                {!isCollapsed && (
                  <motion.span
                    initial={false}
                    animate={{ opacity: isCollapsed ? 0 : 1 }}
                    className="font-medium"
                  >
                    {item.name}
                  </motion.span>
                )}
                
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-gray-200">
          {!isCollapsed && (
            <motion.div
              initial={false}
              animate={{ opacity: isCollapsed ? 0 : 1 }}
              className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Dr. Ana Silva</p>
                <p className="text-xs text-gray-500">Fisioterapeuta</p>
              </div>
            </motion.div>
          )}
          
          <button
            className={`
              w-full mt-3 flex items-center space-x-3 px-3 py-2.5 rounded-lg 
              text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="font-medium">Sair</span>}
          </button>
        </div>

        {/* Version Info */}
        {!isCollapsed && (
          <motion.div
            initial={false}
            animate={{ opacity: isCollapsed ? 0 : 1 }}
            className="p-4 text-center"
          >
            <p className="text-xs text-gray-400">
              v1.0.0 • AI Powered
            </p>
          </motion.div>
        )}
      </div>
    </>
  );
}

export default Sidebar;
export { Sidebar };
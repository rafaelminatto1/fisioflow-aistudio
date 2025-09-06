'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Database,
  Users,
  Calendar,
  FileText,
  Settings,
  BarChart3,
  Shield,
  Activity,
  Home,
  Bell,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: Home,
    description: 'Overview and statistics',
  },
  {
    name: 'Database Monitoring',
    href: '/admin/monitoring',
    icon: Database,
    description: 'Neon DB performance and health',
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
    description: 'User management',
  },
  {
    name: 'Appointments',
    href: '/admin/appointments',
    icon: Calendar,
    description: 'Appointment management',
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: FileText,
    description: 'System reports',
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'Usage analytics',
  },
  {
    name: 'Security',
    href: '/admin/security',
    icon: Shield,
    description: 'Security settings',
  },
  {
    name: 'System Health',
    href: '/admin/health',
    icon: Activity,
    description: 'System health checks',
  },
  {
    name: 'Alerts',
    href: '/admin/alerts',
    icon: Bell,
    description: 'System alerts and notifications',
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'System configuration',
  },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Logo/Brand */}
      <div className='p-6 border-b'>
        <div className='flex items-center space-x-2'>
          <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
            <Database className='w-5 h-5 text-white' />
          </div>
          <div>
            <h2 className='text-lg font-semibold text-gray-900'>FisioFlow</h2>
            <p className='text-xs text-gray-500'>Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className='flex-1 p-4'>
        <div className='space-y-1'>
          {navigation.map(item => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive
                      ? 'text-blue-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                <div className='flex-1'>
                  <div className='text-sm font-medium'>{item.name}</div>
                  <div className='text-xs text-gray-500 group-hover:text-gray-600'>
                    {item.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className='p-4 border-t'>
        <div className='flex items-center space-x-2 text-xs text-gray-500'>
          <Activity className='w-3 h-3' />
          <span>System Status: Online</span>
        </div>
        <div className='flex items-center space-x-2 text-xs text-gray-500 mt-1'>
          <Database className='w-3 h-3' />
          <span>Neon DB: Connected</span>
        </div>
      </div>
    </div>
  );
}

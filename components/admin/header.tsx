'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Settings,
  LogOut,
  User,
  Shield,
  Activity,
  Database
} from 'lucide-react';

interface AdminHeaderProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
  };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const [notifications] = useState([
    { id: 1, message: 'Database health check completed', type: 'success', time: '2 min ago' },
    { id: 2, message: 'High CPU usage detected', type: 'warning', time: '5 min ago' },
    { id: 3, message: 'Backup completed successfully', type: 'info', time: '1 hour ago' }
  ]);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Title and breadcrumb */}
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Shield className="w-4 h-4" />
              <span>Administrative Control Panel</span>
            </div>
          </div>
        </div>

        {/* Right side - Status indicators and user menu */}
        <div className="flex items-center space-x-4">
          {/* System Status Indicators */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Activity className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-600">System</span>
              <Badge variant="outline" className="text-green-600 border-green-200">
                Online
              </Badge>
            </div>
            <div className="flex items-center space-x-1">
              <Database className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-600">Neon DB</span>
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                Connected
              </Badge>
            </div>
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                    {notifications.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-medium">{notification.message}</span>
                    <Badge 
                      variant={notification.type === 'warning' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {notification.type}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">{notification.time}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center text-sm text-blue-600">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 px-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.image || ''} alt={user.name || ''} />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {user.name ? getInitials(user.name) : 'AD'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-900">
                    {user.name || 'Admin User'}
                  </div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.name || 'Admin User'}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <Badge variant="secondary" className="w-fit text-xs">
                    {user.role}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
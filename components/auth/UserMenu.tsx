// components/auth/UserMenu.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === 'loading') {
    return <div className="w-48 h-10 bg-slate-200 rounded-lg animate-pulse" />;
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <Image
          src={session.user.avatarUrl || `https://i.pravatar.cc/150?u=${session.user.id}`}
          alt={session.user.name || 'Avatar'}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full"
        />
        <div className="text-left hidden md:block">
          <p className="text-sm font-semibold text-slate-700 truncate max-w-[100px]">{session.user.name}</p>
          <p className="text-xs text-slate-500 capitalize">{session.user.role?.toLowerCase()}</p>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-500 hidden md:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-2 border-b">
                <p className="text-sm font-medium text-gray-900 truncate">{session.user.name}</p>
                <p className="text-sm text-gray-500 truncate">{session.user.email}</p>
            </div>
            <a
              href="#"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <User className="mr-3 h-5 w-5 text-gray-400" />
              <span>Meu Perfil</span>
            </a>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="mr-3 h-5 w-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

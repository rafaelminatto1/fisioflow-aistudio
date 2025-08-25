import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Sidebar } from '@/components/admin/sidebar';
import { AdminHeader } from '@/components/admin/header';

export const metadata: Metadata = {
  title: 'Admin Dashboard | FisioFlow',
  description: 'Administrative dashboard for FisioFlow management',
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await auth();

  // Redirect if not authenticated or not admin
  if (!session || session.user.role !== 'Admin') {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <AdminHeader user={session.user} />
      
      <div className="flex">
        {/* Sidebar Navigation */}
        <Sidebar className="w-64 min-h-screen bg-white shadow-sm" />
        
        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
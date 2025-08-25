import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { RLSSecurityDashboard } from '@/components/rls-security-dashboard';

export const metadata: Metadata = {
  title: 'Security Dashboard | FisioFlow',
  description: 'Row Level Security monitoring and management dashboard',
};

export default async function SecurityPage() {
  const session = await auth();
  
  // Require authentication
  if (!session) {
    redirect('/auth/signin');
  }
  
  // Require admin role
  if (session.user.role !== 'Admin') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-6">
      <RLSSecurityDashboard />
    </div>
  );
}
import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import FinancialDashboard from '@/components/reports/FinancialDashboard';

export const metadata: Metadata = {
  title: 'Relatórios Financeiros | FisioFlow',
  description: 'Acompanhe o desempenho financeiro da sua clínica com relatórios detalhados'
};

export default async function FinancialReportsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  // Apenas admin e médicos podem acessar relatórios financeiros
  if (session.user.role !== 'admin' && session.user.role !== 'doctor') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-6">
      <FinancialDashboard />
    </div>
  );
}
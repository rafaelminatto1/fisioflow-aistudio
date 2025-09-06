// src/app/dashboard/page.tsx
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { DashboardContent } from '@/components/dashboard/DashboardContent';

export default async function DashboardPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }
    
    // Reroute users to their specific portals if they land here
    if ((user as any).role === 'PACIENTE') {
        redirect('/portal/dashboard');
    }
    if ((user as any).role === 'PARCEIRO') {
        redirect('/partner/dashboard');
    }


    return <DashboardContent user={user} />;
}

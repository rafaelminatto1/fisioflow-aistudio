// app/dashboard/page.tsx
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
    const user = await getCurrentUser();

    // Este redirect é uma camada extra de segurança, embora o middleware já proteja a rota.
    if (!user) {
        redirect('/login');
    }
    
    // Redireciona o paciente se ele tentar acessar o dashboard principal
    if (user.role === 'Paciente') {
        redirect('/portal/dashboard');
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-800">Bem-vindo ao Dashboard, {user.name}!</h1>
            <p className="text-slate-600 mt-2">Sua role é: <span className="font-semibold">{user.role}</span></p>
            <div className="mt-8 p-6 bg-white rounded-xl shadow-sm">
                <h2 className="text-xl font-semibold">Visão Geral</h2>
                <p className="mt-2 text-slate-500">
                    Este é o seu painel de controle principal. Aqui você poderá visualizar as métricas mais importantes da sua clínica,
                    gerenciar pacientes, agendamentos e muito mais.
                </p>
                <p className="mt-4 text-sm text-sky-600 font-medium">
                    Comece navegando pelo menu lateral para explorar as funcionalidades.
                </p>
            </div>
        </div>
    );
}

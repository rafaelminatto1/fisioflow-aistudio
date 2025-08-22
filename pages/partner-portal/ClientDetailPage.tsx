
// pages/partner-portal/ClientDetailPage.tsx
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { Patient, Voucher, SoapNote } from '../../types';
import * as partnershipService from '../../services/partnershipService';
import { useAuth } from '../../contexts/AuthContext';
import PageLoader from '../../components/ui/PageLoader';
import { useToast } from '../../contexts/ToastContext';
import { ChevronLeft, FileText, LineChart, Notebook, User } from 'lucide-react';
import InfoCard from '../../components/ui/InfoCard';
import PainTrendChart from '../../components/patient-portal/PainTrendChart';

const SoapNoteCard: React.FC<{ note: SoapNote }> = ({ note }) => (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div className="flex justify-between items-start mb-2">
            <div>
                <h4 className="font-bold text-sm text-slate-700">Nota Clínica - {note.date}</h4>
                <p className="text-xs text-slate-500">Por: {note.therapist}</p>
            </div>
        </div>
        <p className="text-xs text-slate-600"><strong className="font-semibold text-slate-800">S:</strong> {note.subjective}</p>
        <p className="text-xs text-slate-600"><strong className="font-semibold text-slate-800">A:</strong> {note.assessment}</p>
    </div>
);


const ClientDetailPage: React.FC = () => {
    const { id } = ReactRouterDOM.useParams<{ id: string }>();
    const { user } = useAuth();
    const { showToast } = useToast();
    
    const [isLoading, setIsLoading] = useState(true);
    const [clientData, setClientData] = useState<{ patient: Patient; voucher: Voucher; soapNotes: SoapNote[]; } | null>(null);

    useEffect(() => {
        const fetchClientData = async () => {
            if (!id || !user) return;
            setIsLoading(true);
            try {
                const data = await partnershipService.getIntegratedClientHistory(id, user.id);
                setClientData(data);
            } catch {
                showToast("Erro ao carregar dados do cliente.", 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchClientData();
    }, [id, user, showToast]);

    if (isLoading) return <PageLoader />;
    if (!clientData) return <div className="text-center p-10">Cliente não encontrado.</div>;

    const { patient, voucher, soapNotes } = clientData;

    return (
        <>
            <PageHeader title={patient.name} subtitle={`Plano: ${voucher.plan.name}`}>
                 <ReactRouterDOM.Link to="/partner/clients" className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                    <ChevronLeft className="-ml-1 mr-2 h-5 w-5" />
                    Voltar para a Lista
                </ReactRouterDOM.Link>
            </PageHeader>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Left Column */}
                <div className="lg:col-span-1 space-y-6">
                    <InfoCard title="Informações do Paciente" icon={<User />}>
                        <div className="space-y-2 text-sm">
                            <p><strong>Email:</strong> {patient.email}</p>
                            <p><strong>Telefone:</strong> {patient.phone}</p>
                            <p><strong>Status:</strong> <span className="font-semibold text-green-700">{patient.status}</span></p>
                        </div>
                    </InfoCard>
                     <InfoCard title="Diário de Dor" icon={<LineChart />}>
                        {(patient.painPoints && patient.painPoints.length > 0) ? <PainTrendChart painLogs={patient.painPoints} /> : <p className="text-sm text-slate-500">Nenhum registro de dor.</p>}
                    </InfoCard>
                </div>
                {/* Right Column */}
                <div className="lg:col-span-2 space-y-6">
                    <InfoCard title="Histórico Relevante de Fisioterapia" icon={<FileText />}>
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                             {soapNotes.length > 0 ? soapNotes.map(note => <SoapNoteCard key={note.id} note={note} />) : <p className="text-sm text-slate-500">Nenhuma nota clínica encontrada.</p>}
                        </div>
                    </InfoCard>
                    <InfoCard title="Plano de Treino e Anotações" icon={<Notebook />}>
                        <textarea 
                            rows={8} 
                            className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                            placeholder="Digite aqui o plano de treino, observações e anotações sobre este cliente..."
                        />
                        <div className="text-right mt-2">
                            <button className="px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600">Salvar Anotações</button>
                        </div>
                    </InfoCard>
                </div>
            </div>
        </>
    );
};

export default ClientDetailPage;
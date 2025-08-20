// pages/AcompanhamentoPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../components/PageHeader';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import * as acompanhamentoService from '../services/acompanhamentoService';
import { Patient, Appointment } from '../types';
import Skeleton from '../components/ui/Skeleton';
import AlertCard from '../components/acompanhamento/AlertCard';
import ObservationModal from '../components/acompanhamento/ObservationModal';
import AppointmentFormModal from '../components/AppointmentFormModal';
import * as patientService from '../services/patientService';
import * as appointmentService from '../services/appointmentService';

type CategorizedPatients = {
    abandonment: Patient[];
    highRisk: Patient[];
    attention: Patient[];
    regular: Patient[];
};

type AlertType = 'abandonment' | 'highRisk' | 'attention';

const Section: React.FC<{ title: string; patients: Patient[]; color: string; children: React.ReactNode; onOpenObservationModal: (patient: Patient) => void; onOpenRescheduleModal: (patient: Patient) => void; onUpdate: () => void; type: AlertType; }> = ({ title, patients, color, children, onOpenObservationModal, onOpenRescheduleModal, onUpdate, type }) => (
    <div>
        <div className={`flex items-center mb-4 pb-2 border-b-2 ${color}`}>
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            <span className="ml-2 bg-slate-200 text-slate-700 text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full">{patients.length}</span>
        </div>
        {children}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {patients.map(p => <AlertCard key={p.id} patient={p} type={type} onOpenObservationModal={onOpenObservationModal} onOpenRescheduleModal={onOpenRescheduleModal} onUpdate={onUpdate} />)}
        </div>
    </div>
);


const AcompanhamentoPage: React.FC = () => {
    const { therapists, isLoading: isContextLoading, refetch: refetchDataContext } = useData();
    const { showToast } = useToast();
    const { user } = useAuth();
    
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [categorizedPatients, setCategorizedPatients] = useState<CategorizedPatients | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Modal States
    const [observationModal, setObservationModal] = useState<{ isOpen: boolean; patient: Patient | null }>({ isOpen: false, patient: null });
    const [rescheduleModal, setRescheduleModal] = useState<{ isOpen: boolean; patient: Patient | null }>({ isOpen: false, patient: null });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [patientsData, appointmentsData] = await Promise.all([
                patientService.getAllPatients(),
                appointmentService.getAppointments(), // Acompanhamento needs all appointments
            ]);
            const categories = await acompanhamentoService.getCategorizedPatients(patientsData, appointmentsData);
            setAppointments(appointmentsData);
            setCategorizedPatients(categories);
        } catch (error) {
            showToast('Erro ao processar dados de acompanhamento.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleSaveAppointment = async (app: Appointment) => {
        try {
            await appointmentService.saveAppointment(app);
            showToast('Consulta remarcada com sucesso!', 'success');
            setRescheduleModal({isOpen: false, patient: null});
            fetchData();
            refetchDataContext(); // To update other parts of the app
            return true;
        } catch (error) {
            showToast('Falha ao salvar a consulta.', 'error');
            return false;
        }
    };

    const handleSaveObservation = async (patientId: string, notes: string) => {
        if (!user) return;
        await patientService.addCommunicationLog(patientId, {
            date: new Date().toISOString(),
            type: 'Outro',
            notes,
            actor: user.name,
        });
        showToast(`Observação adicionada.`, 'success');
        setObservationModal({ isOpen: false, patient: null });
        fetchData();
        refetchDataContext();
    };

    const handleOpenObservationModal = (patient: Patient) => setObservationModal({ isOpen: true, patient });
    const handleOpenRescheduleModal = (patient: Patient) => setRescheduleModal({ isOpen: true, patient });
    
    const handleUpdate = () => {
        fetchData();
        refetchDataContext();
    };

    const isPageLoading = isContextLoading || isLoading;

    return (
        <>
            <PageHeader
                title="Acompanhamento de Pacientes"
                subtitle="Painel de controle para monitorar a aderência e o progresso dos pacientes."
            />

            {observationModal.patient && (
                <ObservationModal
                    isOpen={observationModal.isOpen}
                    onClose={() => setObservationModal({ isOpen: false, patient: null })}
                    onSave={handleSaveObservation}
                    patient={observationModal.patient}
                />
            )}
            
            {rescheduleModal.patient && (
                 <AppointmentFormModal 
                    isOpen={rescheduleModal.isOpen}
                    onClose={() => setRescheduleModal({ isOpen: false, patient: null })}
                    onSave={handleSaveAppointment}
                    onDelete={async () => { showToast('Ação não permitida aqui.', 'info'); return false; }}
                    patients={[rescheduleModal.patient]}
                    therapists={therapists}
                    allAppointments={appointments}
                />
            )}

            {isPageLoading ? (
                <Skeleton className="h-[60vh] w-full rounded-2xl" />
            ) : (
                <div className="space-y-10">
                    {categorizedPatients?.abandonment && categorizedPatients.abandonment.length > 0 && (
                        <Section title="Abandono de Tratamento" patients={categorizedPatients.abandonment} color="border-red-500" onUpdate={handleUpdate} type="abandonment" onOpenObservationModal={handleOpenObservationModal} onOpenRescheduleModal={handleOpenRescheduleModal}>
                             <p className="text-sm text-slate-600 mb-4 -mt-3">Pacientes com status "Ativo", última visita há mais de 7 dias e sem agendamentos futuros. Ação imediata recomendada.</p>
                        </Section>
                    )}
                     {categorizedPatients?.highRisk && categorizedPatients.highRisk.length > 0 && (
                        <Section title="Risco Elevado" patients={categorizedPatients.highRisk} color="border-amber-500" onUpdate={handleUpdate} type="highRisk" onOpenObservationModal={handleOpenObservationModal} onOpenRescheduleModal={handleOpenRescheduleModal}>
                             <p className="text-sm text-slate-600 mb-4 -mt-3">Pacientes com faltas consecutivas ou que ultrapassaram a data prevista de alta sem finalizar o tratamento.</p>
                        </Section>
                    )}
                     {categorizedPatients?.attention && categorizedPatients.attention.length > 0 && (
                        <Section title="Pontos de Atenção" patients={categorizedPatients.attention} color="border-sky-500" onUpdate={handleUpdate} type="attention" onOpenObservationModal={handleOpenObservationModal} onOpenRescheduleModal={handleOpenRescheduleModal}>
                             <p className="text-sm text-slate-600 mb-4 -mt-3">Pacientes com boa evolução e próximos da data de alta. Ideal para planejar os próximos passos.</p>
                        </Section>
                    )}
                     {categorizedPatients && categorizedPatients.abandonment.length === 0 && categorizedPatients.highRisk.length === 0 && categorizedPatients.attention.length === 0 && (
                        <div className="text-center p-12 bg-white rounded-2xl shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-700">Tudo em ordem!</h3>
                            <p className="text-slate-500 mt-1">Nenhum paciente foi sinalizado nos grupos de acompanhamento.</p>
                        </div>
                     )}
                </div>
            )}
        </>
    );
};

export default AcompanhamentoPage;
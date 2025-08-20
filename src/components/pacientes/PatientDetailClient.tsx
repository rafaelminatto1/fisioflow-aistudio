'use client';

// This is a very large component. It's a combination of the old PatientDetailPage.tsx
// and its subcomponents, adapted for the Next.js App Router.

import React, { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { User, Cake, Phone, Mail, ChevronLeft, Edit, FileText, Plus, Target, ListChecks, ShieldCheck, Paperclip, Upload, BarChart, Heart, X, Download, Send, Layers, CalendarDays, BookOpen, Lightbulb, ClipboardList } from 'lucide-react';
import axios from 'axios';

// Re-importing components that were in separate files.
// In a real refactor, these would stay in their own files.
import PageHeader from '@/components/PageHeader';
import NewSoapNoteModal from '@/components/NewSoapNoteModal';
import PatientFormModal from '@/components/pacientes/PatientFormModal';
import AppointmentFormModal from '@/components/AppointmentFormModal';
import InfoCard from '@/components/ui/InfoCard';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import MetricEvolutionChart from '@/components/MetricEvolutionChart';
import ClinicalHistoryTimeline from '@/components/ClinicalHistoryTimeline';
import AppointmentTimeline from '@/components/AppointmentTimeline';
import ProtocolSuggestionModal from '@/components/ProtocolSuggestionModal';
// The following components do not exist yet and would need to be created/migrated.
// import PatientClinicalDashboard from '@/components/patient/PatientClinicalDashboard';
// import PainPointModal from '@/components/patient/PainPointModal';

import { SoapNote, Appointment, TreatmentPlan, Patient, Therapist, MedicalReport, Project, PainPoint } from '@/types';
import { useToast } from '@/contexts/ToastContext';


// Re-creating dummy components for missing ones to allow compilation
const PatientClinicalDashboard = ({ patient }: { patient: any }) => <div className="p-4 bg-slate-100 rounded-lg">Patient Clinical Dashboard for {patient.name} (Component to be migrated)</div>;
const PainPointModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => isOpen ? <div className="fixed inset-0 bg-black/50 z-50"><div className="bg-white p-4 rounded-lg">Pain Point Modal (Component to be migrated) <button onClick={onClose}>Close</button></div></div> : null;


// --- Re-created Sub-components from the original file ---

const InfoPill: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-start">
        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-slate-100 rounded-lg text-slate-600">
            {icon}
        </div>
        <div className="ml-4">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <div className="text-sm font-semibold text-slate-800">{value}</div>
        </div>
    </div>
);

const TreatmentPlanCard: React.FC<{ plan: TreatmentPlan, onSuggestProtocol: () => void }> = ({ plan, onSuggestProtocol }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm">
        <div className="border-b border-slate-200 pb-4 mb-4 flex justify-between items-center">
            <div>
                <h4 className="font-bold text-lg text-slate-800">Plano de Tratamento</h4>
                <p className="text-sm text-slate-500">Diagnóstico COFFITO: {plan.coffitoDiagnosisCodes}</p>
            </div>
            <button onClick={onSuggestProtocol} className="inline-flex items-center text-sm font-medium text-sky-600 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 px-3 py-1.5 transition-colors">
                <Lightbulb className="w-4 h-4 mr-2"/> Sugerir Protocolo
            </button>
        </div>
        <div className="space-y-4 text-sm">
            <div>
                <h5 className="font-semibold text-sky-600 flex items-center mb-2"><Target className="w-4 h-4 mr-2" /> Objetivos Principais</h5>
                <p className="text-slate-600 pl-6">{plan.treatmentGoals}</p>
            </div>
        </div>
    </div>
);

const SoapNoteDetailModal: React.FC<{ note: SoapNote | null, onClose: () => void }> = ({ note, onClose }) => {
    if (!note) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b">
                    <h3 className="font-bold text-lg text-slate-800">Sessão #{note.sessionNumber} - {note.date}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
                </header>
                <main className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div><strong className="font-semibold text-sky-600 block mb-1">S (Subjetivo):</strong> <MarkdownRenderer content={note.subjective} /></div>
                    <div><strong className="font-semibold text-sky-600 block mb-1">O (Objetivo):</strong> <MarkdownRenderer content={note.objective} /></div>
                    <div><strong className="font-semibold text-sky-600 block mb-1">A (Avaliação):</strong> <MarkdownRenderer content={note.assessment} /></div>
                    <div><strong className="font-semibold text-sky-600 block mb-1">P (Plano):</strong> <MarkdownRenderer content={note.plan} /></div>
                </main>
            </div>
        </div>
    );
};

const TabButton: React.FC<{ icon: React.ElementType, label: string; isActive: boolean; onClick: () => void }> = ({ icon: Icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex items-center whitespace-nowrap py-3 px-4 font-medium text-sm rounded-t-lg border-b-2 ${isActive ? 'border-sky-500 text-sky-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
        <Icon className="w-5 h-5 mr-2" /> {label}
    </button>
);


// --- Main Client Component ---

interface PatientDetailClientProps {
    patient: Patient & {
        appointments: Appointment[];
        soapNotes: SoapNote[];
        treatmentPlan: TreatmentPlan | null;
        medicalReports: MedicalReport[];
        projects: Project[];
        painPoints: PainPoint[];
        attachments: any[];
    };
    therapists: Therapist[];
}

export default function PatientDetailClient({ patient, therapists }: PatientDetailClientProps) {
    const router = useRouter();
    const { showToast } = useToast();

    // Most state is now derived from props, but UI state remains here.
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSoapModalOpen, setIsSoapModalOpen] = useState(false);
    const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
    const [noteForDetail, setNoteForDetail] = useState<SoapNote | null>(null);
    const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
    const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);
    const [painMapModal, setPainMapModal] = useState({ isOpen: false, pointToEdit: null });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // --- Data Mutation Handlers ---
    // These now call API endpoints and then refresh the data.

    const handleSaveNote = async (newNoteData: Omit<SoapNote, 'id' | 'patientId' | 'therapist'>) => {
        try {
            await axios.post('/api/soap-notes', { ...newNoteData, patientId: patient.id });
            showToast('Anotação salva com sucesso!', 'success');
            router.refresh(); // Re-fetches data on the server and updates the UI
            setIsSoapModalOpen(false);
        } catch (error) {
            showToast('Falha ao salvar anotação.', 'error');
        }
    };

    const handleSavePatient = async (updatedData: Omit<Patient, 'id' | 'lastVisit'>) => {
        try {
            await axios.put(`/api/pacientes/${patient.id}`, updatedData);
            showToast('Paciente atualizado com sucesso!', 'success');
            router.refresh();
            setIsPatientModalOpen(false);
        } catch (error) {
            showToast('Falha ao atualizar paciente.', 'error');
        }
    };

    const handleSaveAppointment = async (appointmentData: Appointment): Promise<boolean> => {
        try {
            // This assumes an API endpoint for appointments
            await axios.post('/api/appointments', appointmentData);
            showToast('Consulta salva com sucesso!', 'success');
            router.refresh();
            setIsAppointmentModalOpen(false);
            return true;
        } catch {
            showToast('Falha ao salvar a consulta.', 'error');
            return false;
        }
    };

    const handleDeleteAppointment = async (appointmentId: string): Promise<boolean> => {
        try {
            await axios.delete(`/api/appointments/${appointmentId}`);
            showToast('Consulta removida com sucesso!', 'success');
            router.refresh();
            return true;
        } catch {
            showToast('Falha ao remover a consulta.', 'error');
            return false;
        }
    };

    // --- UI Rendering ---

    const birthDate = new Date(patient.birthDate);
    const formattedBirthDate = !isNaN(birthDate.getTime()) ? birthDate.toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : 'N/A';

    return (
        <>
            <PageHeader
                title={patient.name}
                subtitle="Detalhes do prontuário, histórico e agendamentos."
            >
                <Link href="/pacientes" className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 mr-3">
                    <ChevronLeft className="-ml-1 mr-2 h-5 w-5" />
                    Voltar
                </Link>
                 <button onClick={() => setIsPatientModalOpen(true)} className="inline-flex items-center rounded-lg border border-transparent bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-600">
                    <Edit className="-ml-1 mr-2 h-5 w-5" />
                    Editar Cadastro
                </button>
            </PageHeader>

            {/* Modals */}
            <NewSoapNoteModal isOpen={isSoapModalOpen} onClose={() => setIsSoapModalOpen(false)} onSave={handleSaveNote} />
            <PatientFormModal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} onSave={handleSavePatient} patientToEdit={patient} />
            <SoapNoteDetailModal note={noteForDetail} onClose={() => setNoteForDetail(null)} />
             <AppointmentFormModal
                isOpen={isAppointmentModalOpen}
                onClose={() => setIsAppointmentModalOpen(false)}
                onSave={handleSaveAppointment}
                onDelete={handleDeleteAppointment}
                initialData={{ date: new Date(), therapistId: therapists[0]?.id }}
                patients={[patient]}
                therapists={therapists}
                allAppointments={patient.appointments}
            />
            <PainPointModal
                isOpen={painMapModal.isOpen}
                onClose={() => setPainMapModal({ isOpen: false, pointToEdit: null })}
            />
            {patient.conditions && patient.conditions.length > 0 && (
                <ProtocolSuggestionModal
                    isOpen={isProtocolModalOpen}
                    onClose={() => setIsProtocolModalOpen(false)}
                    patient={patient}
                    onApply={() => { /* Logic to be implemented */ }}
                />
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <InfoCard title="Informações Pessoais" icon={<User />}>
                        <div className="space-y-4">
                            <InfoPill icon={<Cake className="w-5 h-5"/>} label="Data de Nascimento" value={formattedBirthDate} />
                            <InfoPill icon={<Phone className="w-5 h-5"/>} label="Telefone" value={patient.phone} />
                            <InfoPill icon={<Mail className="w-5 h-5"/>} label="Email" value={patient.email} />
                        </div>
                    </InfoCard>
                </div>

                <div className="lg:col-span-2 space-y-6">
                     <div className="border-b border-slate-200">
                        <nav className="flex space-x-2" aria-label="Tabs">
                            <TabButton icon={BarChart} label="Dashboard Clínico" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                            <TabButton icon={Layers} label="Visão Geral" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                            <TabButton icon={BookOpen} label="Histórico Clínico" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
                            <TabButton icon={CalendarDays} label="Agendamentos" isActive={activeTab === 'appointments'} onClick={() => setActiveTab('appointments')} />
                            <TabButton icon={FileText} label="Laudos & Anexos" isActive={activeTab === 'docs'} onClick={() => setActiveTab('docs')} />
                        </nav>
                    </div>

                    {activeTab === 'dashboard' && <PatientClinicalDashboard patient={patient} />}

                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {patient.treatmentPlan ? <TreatmentPlanCard plan={patient.treatmentPlan} onSuggestProtocol={() => setIsProtocolModalOpen(true)} /> : <InfoCard title="Plano de Tratamento"><p>Nenhum plano ativo.</p></InfoCard>}
                            {(patient.trackedMetrics || []).filter((m: any) => m.isActive).map((metric: any) => (
                                <MetricEvolutionChart key={metric.id} metric={metric} notes={patient.soapNotes} />
                            ))}
                        </div>
                    )}

                    {activeTab === 'history' && (
                         <div className="space-y-6">
                            <div className="text-right">
                                <button onClick={() => setIsSoapModalOpen(true)} className="inline-flex items-center rounded-lg border border-transparent bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-600">
                                    <Plus className="-ml-1 mr-2 h-5 w-5" /> Nova Anotação
                                </button>
                            </div>
                            <ClinicalHistoryTimeline notes={patient.soapNotes} onViewNote={setNoteForDetail} />
                        </div>
                    )}

                    {activeTab === 'appointments' && (
                        <AppointmentTimeline appointments={patient.appointments} onAdd={() => setIsAppointmentModalOpen(true)} />
                    )}

                    {activeTab === 'docs' && (
                        <InfoCard title="Anexos do Paciente" icon={<Paperclip />}>
                            {/* Attachment logic here */}
                        </InfoCard>
                    )}
                </div>
            </div>
        </>
    );
}

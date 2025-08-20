import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { usePatients } from '../hooks/usePatients';
import PageHeader from '../components/PageHeader';
import Skeleton from '../components/ui/Skeleton';
import SpecialtyAssessmentGallery from '../components/SpecialtyAssessmentGallery';
import SportsAssessmentForm from '../components/forms/SportsAssessmentForm';
import { Specialty } from '../types';

const SpecialtyAssessmentsPage: React.FC = () => {
    const { patients, isLoading: isLoadingPatients } = usePatients();
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);

    const handleBack = () => {
        setSelectedSpecialty(null);
    };

    const renderContent = () => {
        if (isLoadingPatients) {
            return <Skeleton className="h-20 w-full" />;
        }

        if (!selectedPatientId) {
            return (
                <div className="text-center p-10 bg-white rounded-2xl shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-700">Primeiro Passo</h3>
                    <p className="text-slate-500 mt-1">Por favor, selecione um paciente para iniciar uma nova avaliação.</p>
                </div>
            );
        }

        if (selectedSpecialty) {
            // Render specific form based on specialty
            switch (selectedSpecialty.id) {
                case 'sports':
                    return <SportsAssessmentForm patientId={selectedPatientId} onBack={handleBack} />;
                default:
                    return (
                        <div className="text-center p-10 bg-white rounded-2xl shadow-sm">
                             <h3 className="text-lg font-semibold text-slate-700">Em Desenvolvimento</h3>
                             <p className="text-slate-500 mt-1">O formulário de avaliação para "{selectedSpecialty.name}" ainda não está disponível.</p>
                        </div>
                    );
            }
        }

        return (
            <SpecialtyAssessmentGallery
                onSelectSpecialty={(specialty) => setSelectedSpecialty(specialty)}
            />
        );
    };

    const pageTitle = selectedSpecialty ? `Avaliação: ${selectedSpecialty.name}` : "Avaliações por Especialidade";
    const pageSubtitle = selectedSpecialty ? `Paciente: ${patients.find(p => p.id === selectedPatientId)?.name}` : "Inicie uma avaliação escolhendo um paciente e uma especialidade.";

    return (
        <>
            <PageHeader title={pageTitle} subtitle={pageSubtitle}>
                {selectedSpecialty && (
                     <button onClick={handleBack} className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 mr-3">
                        <ChevronLeft className="-ml-1 mr-2 h-5 w-5" />
                        Voltar para Galeria
                    </button>
                )}
            </PageHeader>
            
            {!selectedSpecialty && (
                <div className="mb-6 bg-white p-4 rounded-2xl shadow-sm">
                    <label htmlFor="patient-select" className="block text-sm font-medium text-slate-700 mb-1">Paciente</label>
                    <select
                        id="patient-select"
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        className="w-full max-w-sm p-2 border border-slate-300 rounded-lg bg-white"
                        disabled={isLoadingPatients}
                    >
                        <option value="">Selecione um paciente...</option>
                        {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            )}

            {renderContent()}
        </>
    );
};

export default SpecialtyAssessmentsPage;

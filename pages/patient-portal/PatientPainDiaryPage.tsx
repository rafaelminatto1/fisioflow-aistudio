// pages/patient-portal/PatientPainDiaryPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/PageHeader';
import PainTrendChart from '../../components/patient-portal/PainTrendChart';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import * as patientService from '../../services/patientService';
import { Patient, PainPoint } from '../../types';
import Skeleton from '../../components/ui/Skeleton';
import InteractiveBodyMap from '../../components/InteractiveBodyMap';
import PainPointModal from '../../components/patient/PainPointModal';
import { eventService } from '../../services/eventService';

const PainPointHistoryRow: React.FC<{ point: PainPoint, onEdit: (point: PainPoint) => void }> = ({ point, onEdit }) => (
    <div onClick={() => onEdit(point)} className="p-4 bg-white rounded-lg shadow-sm hover:bg-slate-50 cursor-pointer">
        <div className="flex justify-between items-center">
            <div>
                <p className="font-semibold text-slate-700 capitalize">{point.type}</p>
                <p className="text-sm text-slate-600">{point.description}</p>
                <p className="text-xs text-slate-500 mt-1">{new Date(point.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
            </div>
            <span className="font-bold text-teal-600 text-lg">Nível: {point.intensity}</span>
        </div>
    </div>
);


const PatientPainDiaryPage: React.FC = () => {
    const [patient, setPatient] = useState<Patient | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [painMapModal, setPainMapModal] = useState<{ isOpen: boolean; pointToEdit: Partial<PainPoint> | null }>({ isOpen: false, pointToEdit: null });

    const { user } = useAuth();
    const { showToast } = useToast();

    const fetchPatientData = useCallback(async () => {
        if (!user?.patientId) return;
        setIsLoading(true);
        try {
            const data = await patientService.getPatientById(user.patientId);
            setPatient(data || null);
        } catch (error) {
            showToast('Falha ao carregar dados do paciente.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [user, showToast]);

    useEffect(() => {
        fetchPatientData();
        eventService.on('patients:changed', fetchPatientData);
        return () => { eventService.off('patients:changed', fetchPatientData); }
    }, [fetchPatientData]);

    const handleMapClick = (x: number, y: number, bodyPart: 'front' | 'back') => {
        setPainMapModal({ isOpen: true, pointToEdit: { x, y, bodyPart } });
    };

    const handlePointClick = (point: PainPoint) => {
        setPainMapModal({ isOpen: true, pointToEdit: point });
    };

    const handleSavePainPoint = async (pointData: Omit<PainPoint, 'id' | 'date' | 'x' | 'y' | 'bodyPart'>) => {
        if (!patient || !painMapModal.pointToEdit) return;

        let updatedPoints = [...(patient.painPoints || [])];
        if (painMapModal.pointToEdit.id) { // Editing
            updatedPoints = updatedPoints.map(p => p.id === painMapModal.pointToEdit!.id ? { ...p, ...pointData } : p);
        } else { // Adding
            const { x, y, bodyPart } = painMapModal.pointToEdit;
            if (x === undefined || y === undefined || bodyPart === undefined) return;
            const newPoint: PainPoint = {
                id: `pp_${Date.now()}`, date: new Date().toISOString(), x, y, bodyPart, ...pointData,
            };
            updatedPoints.push(newPoint);
        }
        await patientService.savePainPoints(patient.id, updatedPoints);
        setPainMapModal({ isOpen: false, pointToEdit: null });
        showToast('Mapa de dor atualizado!', 'success');
    };
    
    const handleDeletePainPoint = async () => {
        if (!patient || !painMapModal.pointToEdit?.id) return;
        const updatedPoints = (patient.painPoints || []).filter(p => p.id !== painMapModal.pointToEdit!.id);
        await patientService.savePainPoints(patient.id, updatedPoints);
        setPainMapModal({ isOpen: false, pointToEdit: null });
        showToast('Ponto de dor removido.', 'success');
    };

    const renderLogHistory = () => {
        if (isLoading) return <Skeleton className="h-48 w-full rounded-lg" />;
        
        const sortedPoints = [...(patient?.painPoints || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (sortedPoints.length === 0) {
            return <p className="text-center text-slate-500 py-8">Nenhum registro de dor encontrado. Adicione seu primeiro registro no mapa corporal.</p>;
        }
        return (
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {sortedPoints.map(point => <PainPointHistoryRow key={point.id} point={point} onEdit={handlePointClick} />)}
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title="Diário de Dor"
                subtitle="Use o mapa corporal para registrar seus pontos de dor e acompanhar sua evolução."
            />

            {painMapModal.isOpen && painMapModal.pointToEdit && (
                <PainPointModal
                    isOpen={painMapModal.isOpen}
                    onClose={() => setPainMapModal({ isOpen: false, pointToEdit: null })}
                    onSave={handleSavePainPoint}
                    onDelete={painMapModal.pointToEdit.id ? handleDeletePainPoint : undefined}
                    point={painMapModal.pointToEdit}
                />
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                     <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">Mapa Corporal Interativo</h3>
                        <p className="text-sm text-slate-500 mb-4">Clique em uma área para adicionar um ponto de dor, ou em um ponto existente para editar.</p>
                         {isLoading || !patient ? <Skeleton className="h-96 w-full" /> : (
                            <InteractiveBodyMap selectedParts={[]} points={patient.painPoints || []} onSelectPart={() => {}} onMapClick={handleMapClick} onPointClick={handlePointClick} />
                         )}
                    </div>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Evolução da Dor</h3>
                        {isLoading || !patient ? <Skeleton className="h-64 w-full" /> : 
                            (patient.painPoints && patient.painPoints.length > 0) ? <PainTrendChart painLogs={patient.painPoints} /> :
                            <p className="text-center text-sm text-slate-500 py-8">O gráfico aparecerá aqui quando você tiver registros.</p>
                        }
                    </div>
                     <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Seu Histórico de Dor</h3>
                        {renderLogHistory()}
                    </div>
                </div>
            </div>
        </>
    );
};

export default PatientPainDiaryPage;
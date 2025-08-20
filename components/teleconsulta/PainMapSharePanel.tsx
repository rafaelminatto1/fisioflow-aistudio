// components/teleconsulta/PainMapSharePanel.tsx
import React from 'react';
import { Patient, PainPoint } from '../../types';
import PainMap from '../patient/PainMap';
import { Share2 } from 'lucide-react';

interface PainMapSharePanelProps {
    patient: Patient;
    onShare: (points: PainPoint[] | undefined) => void;
}

const PainMapSharePanel: React.FC<PainMapSharePanelProps> = ({ patient, onShare }) => {
    return (
        <div className="p-4 flex flex-col h-full">
            <h3 className="text-lg font-bold text-slate-100 mb-2">Mapa de Dor</h3>
            <p className="text-xs text-slate-400 mb-4">Visualize o mapa de dor registrado pelo paciente. Você pode compartilhar esta tela para discutir em tempo real.</p>
            
            <div className="flex-1 bg-slate-100 rounded-lg p-2">
                <PainMap 
                    points={patient.painPoints || []}
                    onMapClick={() => {}} // Read-only in this context
                    onPointClick={() => {}} // Read-only in this context
                />
            </div>

            <button
                onClick={() => onShare(patient.painPoints)}
                className="w-full mt-4 flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg"
            >
                <Share2 className="w-4 h-4 mr-2" /> Compartilhar Tela do Mapa
            </button>
        </div>
    );
};

export default PainMapSharePanel;
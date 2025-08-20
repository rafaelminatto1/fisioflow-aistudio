// components/teleconsulta/SessionNotesPanel.tsx
import React from 'react';
import { SoapNote } from '../../types';
import RichTextEditor from '../ui/RichTextEditor';

interface SessionNotesPanelProps {
    note: Partial<SoapNote>;
    onNoteChange: (note: Partial<SoapNote>) => void;
}

const SessionNotesPanel: React.FC<SessionNotesPanelProps> = ({ note, onNoteChange }) => {
    
    const handleFieldChange = (field: keyof SoapNote, value: string) => {
        onNoteChange({ ...note, [field]: value });
    };

    return (
        <div className="p-4 space-y-4 text-sm">
            <div>
                <label className="font-semibold text-sky-400">S (Subjetivo)</label>
                <RichTextEditor
                    value={note.subjective || ''}
                    onChange={(val) => handleFieldChange('subjective', val)}
                    rows={3}
                    placeholder="Relato do paciente..."
                />
            </div>
            <div>
                <label className="font-semibold text-sky-400">O (Objetivo)</label>
                 <RichTextEditor
                    value={note.objective || ''}
                    onChange={(val) => handleFieldChange('objective', val)}
                    rows={3}
                    placeholder="Observações da sessão..."
                />
            </div>
             <div>
                <label className="font-semibold text-sky-400">A (Avaliação)</label>
                 <RichTextEditor
                    value={note.assessment || ''}
                    onChange={(val) => handleFieldChange('assessment', val)}
                    rows={3}
                    placeholder="Análise da evolução..."
                />
            </div>
            <div>
                <label className="font-semibold text-sky-400">P (Plano)</label>
                 <RichTextEditor
                    value={note.plan || ''}
                    onChange={(val) => handleFieldChange('plan', val)}
                    rows={3}
                    placeholder="Próximos passos..."
                />
            </div>
        </div>
    );
};

export default SessionNotesPanel;
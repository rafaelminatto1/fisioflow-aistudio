import React, { useState } from 'react';
import { X, Search, CheckCircle, Loader } from 'lucide-react';
import { EventRegistration } from '../../types';

interface CheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    registrations: EventRegistration[];
    onCheckIn: (registrationId: string, method: 'manual') => Promise<boolean>;
}

const CheckInModal: React.FC<CheckInModalProps> = ({ isOpen, onClose, registrations, onCheckIn }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    if (!isOpen) return null;

    const filteredRegistrations = registrations.filter(r =>
        r.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const handleCheckInClick = async (id: string) => {
        setProcessingId(id);
        const success = await onCheckIn(id, 'manual');
        if (success) {
            // No need to close modal immediately, list will update
        }
        setProcessingId(null);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-5 border-b">
                    <h2 className="text-lg font-bold text-slate-800">Check-in Manual</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
                </header>
                <main className="p-6 flex-1 flex flex-col">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Buscar participante para check-in..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto -mx-6 px-6 divide-y divide-slate-200">
                        {filteredRegistrations.map(reg => (
                             <div key={reg.id} className="flex items-center justify-between py-3">
                                <div>
                                    <p className="font-semibold text-slate-800">{reg.fullName}</p>
                                    <p className="text-sm text-slate-500">{reg.email}</p>
                                </div>
                                <button
                                    onClick={() => handleCheckInClick(reg.id)}
                                    disabled={processingId === reg.id}
                                    className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-colors disabled:bg-green-300"
                                >
                                    {processingId === reg.id ? <Loader className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                </button>
                            </div>
                        ))}
                         {filteredRegistrations.length === 0 && (
                            <p className="text-center text-slate-500 pt-10">Nenhum participante encontrado ou todos já fizeram check-in.</p>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CheckInModal;

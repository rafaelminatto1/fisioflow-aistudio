
import React from 'react';
import { BarChart3 } from 'lucide-react';

interface PlaceholderReportProps {
    title: string;
}

const PlaceholderReport: React.FC<PlaceholderReportProps> = ({ title }) => {
    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center animate-fade-in-fast">
            <BarChart3 className="mx-auto h-16 w-16 text-slate-300" />
            <h3 className="mt-4 text-xl font-bold text-slate-800">{title}</h3>
            <p className="mt-2 text-md text-slate-500 max-w-2xl mx-auto">
                Este relatório está em desenvolvimento e estará disponível em breve para fornecer mais insights sobre sua clínica.
            </p>
        </div>
    );
};

export default PlaceholderReport;

// components/inventory/ExpiryWarning.tsx
import React from 'react';
import { AlertTriangle, CalendarX2 } from 'lucide-react';

interface ExpiryWarningProps {
    expiryDate: string; // YYYY-MM-DD
}

const ExpiryWarning: React.FC<ExpiryWarningProps> = ({ expiryDate }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to the beginning of the day

    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 30) {
        return null; // Don't show if more than 30 days away
    }

    let warningClass = '';
    let icon = <AlertTriangle size={14} />;
    let text = `Vence em ${diffDays} dias`;

    if (diffDays < 0) {
        warningClass = 'bg-red-100 text-red-800';
        icon = <CalendarX2 size={14} />;
        text = 'Vencido!';
    } else if (diffDays <= 7) {
        warningClass = 'bg-red-100 text-red-800';
    } else {
        warningClass = 'bg-yellow-100 text-yellow-800';
    }

    return (
        <div className={`mt-2 p-2 rounded-md text-xs font-semibold flex items-center ${warningClass}`}>
            {icon}
            <span className="ml-2">{text}</span>
        </div>
    );
};

export default ExpiryWarning;
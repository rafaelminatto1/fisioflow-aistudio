// src/components/ui/InfoCard.tsx
'use client';

import React from 'react';

interface InfoCardProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    actionButton?: React.ReactNode;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, icon, children, actionButton }) => {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm h-full flex flex-col border border-slate-200">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center">
                    {icon && <span className="mr-3 text-teal-500">{icon}</span>}
                    {title}
                </h3>
                {actionButton}
            </div>
            <div className="flex-grow">
                {children}
            </div>
        </div>
    );
};

export default InfoCard;

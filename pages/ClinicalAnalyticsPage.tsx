// pages/ClinicalAnalyticsPage.tsx
import React from 'react';
import PageHeader from '../components/PageHeader';
import ClinicalAnalyticsDashboard from '../components/analytics/ClinicalAnalyticsDashboard';

const ClinicalAnalyticsPage: React.FC = () => {
    return (
        <>
            <PageHeader
                title="Análise de Performance Clínica"
                subtitle="Insights sobre a eficácia dos tratamentos e a evolução dos pacientes."
            />
            <ClinicalAnalyticsDashboard />
        </>
    );
};

export default ClinicalAnalyticsPage;


import React from 'react';
import PageHeader from '../components/PageHeader';
import PlanCard from '../components/PlanCard';
import { SUBSCRIPTION_PLANS } from '../data/mockSubscriptionData';

const SubscriptionPage: React.FC = () => {
    return (
        <>
            <PageHeader
                title="Planos e Assinatura"
                subtitle="Escolha o plano que melhor se adapta às necessidades da sua clínica."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mt-8">
                {SUBSCRIPTION_PLANS.map(plan => (
                    <PlanCard key={plan.id} plan={plan} />
                ))}
            </div>
        </>
    );
};

export default SubscriptionPage;

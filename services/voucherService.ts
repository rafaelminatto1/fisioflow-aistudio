// services/voucherService.ts
import { Voucher, VoucherPlan } from '../types';
import { sampleVoucherPlans, mockPurchasedVouchers } from '../data/mockData';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getVoucherPlans = async (): Promise<VoucherPlan[]> => {
    await delay(500);
    return sampleVoucherPlans;
};

export const getVouchersByPatientId = async (patientId: string): Promise<Voucher[]> => {
    await delay(300);
    return mockPurchasedVouchers.filter(v => v.patientId === patientId);
};

export const purchaseVoucher = async (planId: string, patientId: string): Promise<Voucher> => {
    await delay(1000);
    const plan = sampleVoucherPlans.find(p => p.id === planId);
    if (!plan) {
        throw new Error('Plano de voucher não encontrado.');
    }

    const today = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(today.getDate() + plan.durationDays);

    const newVoucher: Voucher = {
        id: `voucher_${Date.now()}`,
        code: `VF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        patientId,
        plan,
        status: 'activated',
        purchaseDate: today,
        activationDate: today,
        expiryDate,
        remainingCredits: plan.credits,
    };
    
    // Simulate saving to the mock DB
    mockPurchasedVouchers.unshift(newVoucher);
    
    return newVoucher;
};

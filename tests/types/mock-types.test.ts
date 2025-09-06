// tests/types/mock-types.test.ts
import { describe, it, expect } from '@jest/globals';
import type { 
  MockPatient, 
  MockAppointment, 
  MockTransaction, 
  FinancialKPIs, 
  RevenueByCategory 
} from '../../types';

describe('Mock Data Types', () => {
  describe('MockPatient', () => {
    it('should validate MockPatient interface', () => {
      const mockPatient: MockPatient = {
        id: '1',
        name: 'João Silva',
        status: 'Active',
        lastVisit: '2025-01-01',
        createdAt: '2025-01-01'
      };

      expect(mockPatient.id).toBe('1');
      expect(mockPatient.name).toBe('João Silva');
      expect(['Active', 'Discharged', 'Inactive']).toContain(mockPatient.status);
    });

    it('should handle optional fields in MockPatient', () => {
      const mockPatient: MockPatient = {
        id: '2',
        name: 'Maria Santos',
        status: 'Discharged'
      };

      expect(mockPatient.lastVisit).toBeUndefined();
      expect(mockPatient.appointments).toBeUndefined();
    });
  });

  describe('MockAppointment', () => {
    it('should validate MockAppointment interface', () => {
      const mockAppointment: MockAppointment = {
        id: 'apt-1',
        patientId: 'patient-1',
        therapistId: 'therapist-1',
        date: new Date('2025-01-15'),
        status: 'Agendado',
        type: 'Sessao'
      };

      expect(mockAppointment.id).toBe('apt-1');
      expect(mockAppointment.patientId).toBe('patient-1');
      expect(mockAppointment.date).toBeInstanceOf(Date);
    });
  });

  describe('MockTransaction', () => {
    it('should validate MockTransaction interface', () => {
      const mockTransaction: MockTransaction = {
        id: 'txn-1',
        patientId: 'patient-1',
        amount: 150.00,
        type: 'income',
        date: new Date('2025-01-15'),
        description: 'Consulta de fisioterapia'
      };

      expect(mockTransaction.amount).toBe(150.00);
      expect(['income', 'expense']).toContain(mockTransaction.type);
    });
  });
});

describe('Financial Types', () => {
  describe('FinancialKPIs', () => {
    it('should validate FinancialKPIs interface', () => {
      const kpis: FinancialKPIs = {
        totalRevenue: 50000,
        monthlyGrowth: 12.5,
        averageTicket: 125.50,
        pendingPayments: 3200
      };

      expect(kpis.totalRevenue).toBeGreaterThan(0);
      expect(kpis.monthlyGrowth).toBeGreaterThanOrEqual(0);
      expect(kpis.averageTicket).toBeGreaterThan(0);
    });
  });

  describe('RevenueByCategory', () => {
    it('should validate RevenueByCategory interface', () => {
      const categoryRevenue: RevenueByCategory = {
        category: 'Fisioterapia',
        amount: 25000,
        percentage: 65.5
      };

      expect(categoryRevenue.category).toBeTruthy();
      expect(categoryRevenue.amount).toBeGreaterThan(0);
      expect(categoryRevenue.percentage).toBeGreaterThanOrEqual(0);
      expect(categoryRevenue.percentage).toBeLessThanOrEqual(100);
    });
  });
});

describe('Type Safety', () => {
  it('should enforce correct status values for MockPatient', () => {
    // This should compile without errors
    const validStatuses: MockPatient['status'][] = ['Active', 'Discharged', 'Inactive'];
    
    validStatuses.forEach(status => {
      const patient: MockPatient = {
        id: '1',
        name: 'Test Patient',
        status
      };
      expect(['Active', 'Discharged', 'Inactive']).toContain(patient.status);
    });
  });

  it('should enforce correct transaction types', () => {
    const validTypes: MockTransaction['type'][] = ['income', 'expense'];
    
    validTypes.forEach(type => {
      const transaction: MockTransaction = {
        id: '1',
        patientId: 'patient-1',
        amount: 100,
        type,
        date: new Date()
      };
      expect(['income', 'expense']).toContain(transaction.type);
    });
  });
});
// hooks/useClinicalAnalytics.ts
import { useState, useEffect } from 'react';
import {
  mockSoapNotes,
  mockAppointments,
  mockPatients,
} from '../data/mockData';
import { AppointmentStatus } from '../types';

interface Kpis {
  dischargeRate: number;
  avgSessions: number;
  npsScore: number;
}

interface PainEvolutionData {
  session: string;
  avgPain: number;
}

interface SuccessByPathologyData {
  name: string;
  successRate: number;
}

const useClinicalAnalytics = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [painEvolution, setPainEvolution] = useState<PainEvolutionData[]>([]);
  const [successByPathology, setSuccessByPathology] = useState<
    SuccessByPathologyData[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay

      // Calculate KPIs
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const dischargedPatients = mockPatients.filter(
        p => p.status === 'Discharged' && new Date(p.lastVisit) > ninetyDaysAgo
      ).length;
      const activePatients = mockPatients.filter(
        p => p.status === 'Active'
      ).length;
      const dischargeRate =
        activePatients > 0
          ? Math.round(
              (dischargedPatients / (dischargedPatients + activePatients)) * 100
            )
          : 0;

      const completedAppointments = mockAppointments.filter(
        a => a.status === AppointmentStatus.Completed
      );
      const uniquePatientsWithSessions = new Set(
        completedAppointments.map(a => a.patientId)
      );
      const avgSessions =
        uniquePatientsWithSessions.size > 0
          ? Math.round(
              completedAppointments.length / uniquePatientsWithSessions.size
            )
          : 0;

      const calculatedKpis: Kpis = {
        dischargeRate,
        avgSessions,
        npsScore: 78, // Mocked data
      };
      setKpis(calculatedKpis);

      // Calculate Pain Evolution (mocked for simplicity)
      const painEvolutionData: PainEvolutionData[] = [
        { session: 'Sessão 1', avgPain: 7.2 },
        { session: 'Sessão 2', avgPain: 6.5 },
        { session: 'Sessão 3', avgPain: 5.8 },
        { session: 'Sessão 4', avgPain: 4.9 },
        { session: 'Sessão 5', avgPain: 4.1 },
        { session: 'Sessão 6', avgPain: 3.2 },
        { session: 'Sessão 7', avgPain: 2.5 },
        { session: 'Sessão 8', avgPain: 1.8 },
      ];
      setPainEvolution(painEvolutionData);

      // Success by Pathology (mocked)
      const successData: SuccessByPathologyData[] = [
        { name: 'Lombalgia', successRate: 85 },
        { name: 'Lesão de Manguito', successRate: 78 },
        { name: 'Pós-op LCA', successRate: 92 },
        { name: 'Fascite Plantar', successRate: 81 },
        { name: 'Tendinopatia Patelar', successRate: 75 },
      ];
      setSuccessByPathology(successData);

      setIsLoading(false);
    };

    fetchData();
  }, []);

  return { kpis, painEvolution, successByPathology, isLoading };
};

export default useClinicalAnalytics;

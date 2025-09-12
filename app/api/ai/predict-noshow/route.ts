import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface NoShowRiskFactors {
  patientId: string;
  historyFactor: number;
  timingFactor: number;
  frequencyFactor: number;
  communicationFactor: number;
  demographicFactor: number;
}

interface NoShowPrediction {
  patientId: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  probability: number;
  factors: {
    history: number;
    timing: number;
    frequency: number;
    communication: number;
    demographic: number;
  };
  recommendations: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId } = body;

    if (!patientId) {
      return NextResponse.json(
        { error: 'PatientId é obrigatório' },
        { status: 400 }
      );
    }

    // Get patient data with appointment history
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      include: {
        appointments: {
          orderBy: { start_time: 'desc' },
          take: 50, // Last 50 appointments for analysis
        },
        communication_logs: {
          orderBy: { created_at: 'desc' },
          take: 20, // Recent communications
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado' },
        { status: 404 }
      );
    }

    // Calculate risk factors
    const riskFactors = calculateRiskFactors(patient);
    
    // Generate prediction
    const prediction = generatePrediction(riskFactors);

    return NextResponse.json(prediction);
  } catch (error) {
    console.error('Error predicting no-show risk:', error);
    return NextResponse.json(
      { error: 'Erro ao calcular risco de ausência' },
      { status: 500 }
    );
  }
}

function calculateRiskFactors(patient: any): NoShowRiskFactors {
  const appointments = patient.appointments || [];
  const communications = patient.communication_logs || [];
  
  // 1. History Factor (0-1): Based on past no-show rate
  const historyFactor = calculateHistoryFactor(appointments);
  
  // 2. Timing Factor (0-1): Based on appointment timing patterns
  const timingFactor = calculateTimingFactor(appointments);
  
  // 3. Frequency Factor (0-1): Based on appointment frequency
  const frequencyFactor = calculateFrequencyFactor(appointments);
  
  // 4. Communication Factor (0-1): Based on communication patterns
  const communicationFactor = calculateCommunicationFactor(communications);
  
  // 5. Demographic Factor (0-1): Based on patient demographics
  const demographicFactor = calculateDemographicFactor(patient);

  return {
    patientId: patient.id,
    historyFactor,
    timingFactor,
    frequencyFactor,
    communicationFactor,
    demographicFactor,
  };
}

function calculateHistoryFactor(appointments: any[]): number {
  if (appointments.length === 0) return 0.3; // Default moderate risk for new patients

  const noShowCount = appointments.filter(apt => apt.status === 'Faltou').length;
  const totalAppointments = appointments.length;
  const noShowRate = noShowCount / totalAppointments;

  // Recent appointments have more weight
  const recentAppointments = appointments.slice(0, 10);
  const recentNoShowCount = recentAppointments.filter(apt => apt.status === 'Faltou').length;
  const recentNoShowRate = recentAppointments.length > 0 ? recentNoShowCount / recentAppointments.length : 0;

  // Weighted average (70% recent, 30% historical)
  return (recentNoShowRate * 0.7) + (noShowRate * 0.3);
}

function calculateTimingFactor(appointments: any[]): number {
  if (appointments.length === 0) return 0.3;

  let riskScore = 0;
  let factorCount = 0;

  // Analyze time of day patterns
  const earlyMorning = appointments.filter(apt => {
    const hour = new Date(apt.startTime).getHours();
    return hour >= 7 && hour < 9;
  });
  
  const lateAfternoon = appointments.filter(apt => {
    const hour = new Date(apt.startTime).getHours();
    return hour >= 17 && hour < 19;
  });

  // Early morning appointments tend to have higher no-show rates
  if (earlyMorning.length > 0) {
    const earlyNoShowRate = earlyMorning.filter(apt => apt.status === 'Faltou').length / earlyMorning.length;
    riskScore += earlyNoShowRate * 1.2; // Higher weight for early appointments
    factorCount++;
  }

  // Late afternoon appointments analysis
  if (lateAfternoon.length > 0) {
    const lateNoShowRate = lateAfternoon.filter(apt => apt.status === 'Faltou').length / lateAfternoon.length;
    riskScore += lateNoShowRate * 1.1;
    factorCount++;
  }

  // Day of week analysis
  const mondayAppointments = appointments.filter(apt => new Date(apt.startTime).getDay() === 1);
  if (mondayAppointments.length > 0) {
    const mondayNoShowRate = mondayAppointments.filter(apt => apt.status === 'Faltou').length / mondayAppointments.length;
    riskScore += mondayNoShowRate * 1.1; // Mondays tend to have higher no-show rates
    factorCount++;
  }

  return factorCount > 0 ? Math.min(riskScore / factorCount, 1) : 0.3;
}

function calculateFrequencyFactor(appointments: any[]): number {
  if (appointments.length === 0) return 0.5;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));

  const recentAppointments = appointments.filter(apt => 
    new Date(apt.startTime) >= thirtyDaysAgo
  );

  const moderatelyRecentAppointments = appointments.filter(apt => 
    new Date(apt.startTime) >= ninetyDaysAgo && new Date(apt.startTime) < thirtyDaysAgo
  );

  // High frequency recent appointments = lower risk
  if (recentAppointments.length >= 4) return 0.2;
  if (recentAppointments.length >= 2) return 0.3;
  
  // Medium frequency = medium risk
  if (moderatelyRecentAppointments.length >= 2) return 0.4;
  
  // Low frequency = higher risk
  return 0.7;
}

function calculateCommunicationFactor(communications: any[]): number {
  if (communications.length === 0) return 0.6; // Higher risk for patients with no communication

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

  const recentCommunications = communications.filter(comm => 
    new Date(comm.createdAt) >= thirtyDaysAgo
  );

  // Recent communication indicates engagement = lower risk
  if (recentCommunications.length >= 3) return 0.2;
  if (recentCommunications.length >= 1) return 0.3;
  
  return 0.6;
}

function calculateDemographicFactor(patient: any): number {
  let riskScore = 0.3; // Base risk

  // Age factor (if birthDate available)
  if (patient.birthDate) {
    const age = calculateAge(patient.birthDate);
    
    // Younger patients (18-25) tend to have higher no-show rates
    if (age >= 18 && age <= 25) riskScore += 0.2;
    
    // Older patients (65+) tend to have lower no-show rates
    if (age >= 65) riskScore -= 0.1;
  }

  // Status factor
  if (patient.status === 'Inactive') riskScore += 0.3;

  return Math.min(Math.max(riskScore, 0), 1);
}

function calculateAge(birthDate: Date): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

function generatePrediction(factors: NoShowRiskFactors): NoShowPrediction {
  // Weighted average of all factors
  const weights = {
    history: 0.35,
    timing: 0.2,
    frequency: 0.2,
    communication: 0.15,
    demographic: 0.1,
  };

  const probability = 
    (factors.historyFactor * weights.history) +
    (factors.timingFactor * weights.timing) +
    (factors.frequencyFactor * weights.frequency) +
    (factors.communicationFactor * weights.communication) +
    (factors.demographicFactor * weights.demographic);

  // Determine risk level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  if (probability < 0.3) {
    riskLevel = 'LOW';
  } else if (probability < 0.6) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'HIGH';
  }

  // Generate recommendations
  const recommendations = generateRecommendations(factors, riskLevel);

  return {
    patientId: factors.patientId,
    riskLevel,
    probability: Math.round(probability * 100) / 100,
    factors: {
      history: Math.round(factors.historyFactor * 100) / 100,
      timing: Math.round(factors.timingFactor * 100) / 100,
      frequency: Math.round(factors.frequencyFactor * 100) / 100,
      communication: Math.round(factors.communicationFactor * 100) / 100,
      demographic: Math.round(factors.demographicFactor * 100) / 100,
    },
    recommendations,
  };
}

function generateRecommendations(factors: NoShowRiskFactors, riskLevel: string): string[] {
  const recommendations: string[] = [];

  if (riskLevel === 'HIGH') {
    recommendations.push('Realizar ligação de confirmação 24h antes');
    recommendations.push('Considerar reagendamento para horário mais conveniente');
  }

  if (riskLevel === 'MEDIUM' || riskLevel === 'HIGH') {
    recommendations.push('Enviar lembrete via WhatsApp');
  }

  if (factors.historyFactor > 0.5) {
    recommendations.push('Conversar sobre importância da continuidade do tratamento');
  }

  if (factors.communicationFactor > 0.5) {
    recommendations.push('Aumentar frequência de comunicação com o paciente');
  }

  if (factors.frequencyFactor > 0.6) {
    recommendations.push('Reavaliar necessidade de consultas mais frequentes');
  }

  if (recommendations.length === 0) {
    recommendations.push('Manter acompanhamento padrão');
  }

  return recommendations;
}
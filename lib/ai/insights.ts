// lib/ai/insights.ts
import { structuredLogger } from '../monitoring/logger';
import { trackExternalAPICall } from '../middleware/performance';
import { BusinessMetrics } from '../monitoring/metrics';
import prisma from '../prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { withCache } from '../prisma-performance';
import type { Patient, Appointment, PainPoint } from '@prisma/client';

export interface PatientInsight {
  patientId: string;
  patientName: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  insights: {
    recovery: {
      progress: number; // 0-100
      trend: 'improving' | 'stable' | 'declining';
      analysis: string;
    };
    attendance: {
      rate: number; // 0-100
      pattern: 'consistent' | 'irregular' | 'declining';
      analysis: string;
    };
    pain: {
      trend: 'improving' | 'stable' | 'worsening';
      avgIntensity: number;
      analysis: string;
    };
    engagement: {
      level: 'high' | 'medium' | 'low';
      factors: string[];
      recommendations: string[];
    };
  };
  predictions: {
    dischargeProbability: number;
    riskFactors: string[];
    recommendedActions: string[];
  };
  generatedAt: Date;
}

export interface TreatmentRecommendation {
  patientId: string;
  category: 'exercise' | 'frequency' | 'duration' | 'technique' | 'referral';
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  reasoning: string;
  expectedOutcome: string;
  implementationSteps: string[];
  confidence: number; // 0-100
}

export interface ClinicInsights {
  overview: {
    totalPatients: number;
    activePatients: number;
    completionRate: number;
    avgSessionsPerPatient: number;
  };
  patterns: {
    mostCommonConditions: Array<{
      condition: string;
      count: number;
      avgRecoveryTime: number;
    }>;
    busyDays: Array<{ day: string; appointmentCount: number }>;
    seasonalTrends: Array<{
      month: string;
      newPatients: number;
      completions: number;
    }>;
  };
  performance: {
    therapistEfficiency: Array<{
      therapistId: string;
      therapistName: string;
      patientLoad: number;
      completionRate: number;
      patientSatisfaction: number;
    }>;
    treatmentSuccess: Array<{
      treatmentType: string;
      successRate: number;
      avgDuration: number;
      improvementRate: number;
    }>;
  };
  alerts: Array<{
    type: 'patient_risk' | 'capacity_warning' | 'quality_concern';
    severity: 'high' | 'medium' | 'low';
    message: string;
    actionRequired: string;
  }>;
  recommendations: {
    operational: string[];
    clinical: string[];
    business: string[];
  };
}

export class AIInsightsService {
  private genAI!: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      structuredLogger.warn('Google AI API key not configured');
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async generatePatientInsights(
    patientId: string
  ): Promise<PatientInsight | null> {
    return withCache(
      `patient_insights_${patientId}`,
      async () => {
        try {
          // Gather comprehensive patient data
          const patientData = await this.gatherPatientData(patientId);
          if (!patientData) return null;

          // Generate AI insights
          const insights = await this.analyzePatientData(patientData);

          // Store insights for future reference
          await this.storePatientInsights(patientId, insights);

          BusinessMetrics.recordBusinessEvent('ai_patient_insight_generated', {
            patientId,
            riskLevel: insights.riskLevel,
          });

          return insights;
        } catch (error: any) {
          structuredLogger.error('Failed to generate patient insights', {
            patientId,
            error: error.message,
          });
          return null;
        }
      },
      1800 // 30 minutes cache
    );
  }

  async generateTreatmentRecommendations(
    patientId: string
  ): Promise<TreatmentRecommendation[]> {
    return withCache(
      `treatment_recommendations_${patientId}`,
      async () => {
        try {
          const patientData = await this.gatherPatientData(patientId);
          if (!patientData) return [];

          const recommendations =
            await this.generateRecommendationsWithAI(patientData);

          BusinessMetrics.recordBusinessEvent(
            'ai_treatment_recommendations_generated',
            {
              patientId,
              recommendationCount: recommendations.length,
            }
          );

          return recommendations;
        } catch (error: any) {
          structuredLogger.error(
            'Failed to generate treatment recommendations',
            {
              patientId,
              error: error.message,
            }
          );
          return [];
        }
      },
      3600 // 1 hour cache
    );
  }

  async generateClinicInsights(
    therapistId: string
  ): Promise<ClinicInsights | null> {
    return withCache(
      `clinic_insights_${therapistId}`,
      async () => {
        try {
          const clinicData = await this.gatherClinicData(therapistId);
          const insights = await this.analyzeClinicData(clinicData);

          BusinessMetrics.recordBusinessEvent('ai_clinic_insights_generated', {
            therapistId,
            alertCount: insights.alerts.length,
          });

          return insights;
        } catch (error: any) {
          structuredLogger.error('Failed to generate clinic insights', {
            therapistId,
            error: error.message,
          });
          return null;
        }
      },
      7200 // 2 hours cache
    );
  }

  private async gatherPatientData(patientId: string) {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        appointments: {
          orderBy: { startTime: 'desc' },
          take: 20,
          include: {
            therapist: {
              select: { name: true },
            },
            soapNotes: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        painPoints: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        metricResults: {
          orderBy: { measuredAt: 'desc' },
          take: 20,
        },
      },
    });

    return patient;
  }

  private async gatherClinicData(therapistId: string) {
    const [patients, appointments, painPoints] = await Promise.all([
      prisma.patient.findMany({
        where: {
          appointments: {
            some: {
              therapistId,
            },
          },
        },
        include: {
          appointments: {
            where: { therapistId },
            orderBy: { startTime: 'desc' },
          },
          painPoints: true,
          metricResults: true,
        },
      }),
      prisma.appointment.findMany({
        where: {
          therapistId,
          startTime: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
          },
        },
        include: {
          patient: {
            select: { name: true, status: true },
          },
        },
      }),
      prisma.painPoint.findMany({
        where: {
          patient: {
            appointments: {
              some: { therapistId },
            },
          },
        },
        include: {
          patient: {
            select: { name: true },
          },
        },
      }),
    ]);

    return { patients, appointments, painPoints };
  }

  private async analyzePatientData(patient: any): Promise<PatientInsight> {
    return trackExternalAPICall('google_ai', 'patient_analysis', async () => {
      const prompt = this.buildPatientAnalysisPrompt(patient);

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const analysisText = response.text();

      // Parse AI response and structure data
      const analysis = this.parsePatientAnalysis(analysisText, patient);

      return {
        patientId: patient.id,
        patientName: patient.name,
        riskLevel: analysis.riskLevel,
        insights: analysis.insights,
        predictions: analysis.predictions,
        generatedAt: new Date(),
      };
    });
  }

  private async generateRecommendationsWithAI(
    patient: any
  ): Promise<TreatmentRecommendation[]> {
    return trackExternalAPICall(
      'google_ai',
      'treatment_recommendations',
      async () => {
        const prompt = this.buildRecommendationPrompt(patient);

        const result = await this.model.generateContent(prompt);
        const response = result.response;
        const recommendationsText = response.text();

        return this.parseRecommendations(recommendationsText, patient.id);
      }
    );
  }

  private async analyzeClinicData(clinicData: any): Promise<ClinicInsights> {
    return trackExternalAPICall('google_ai', 'clinic_analysis', async () => {
      const prompt = this.buildClinicAnalysisPrompt(clinicData);

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const analysisText = response.text();

      return this.parseClinicAnalysis(analysisText, clinicData);
    });
  }

  private buildPatientAnalysisPrompt(patient: any): string {
    const recentAppointments = patient.appointments.slice(0, 10);
    const recentPainPoints = patient.painPoints.slice(0, 5);
    const recentMetrics = patient.metricResults.slice(0, 10);

    return `
Você é um especialista em fisioterapia com IA avançada. Analise os dados do paciente abaixo e forneça insights detalhados.

DADOS DO PACIENTE:
Nome: ${patient.name}
Status: ${patient.status}
Data de nascimento: ${patient.dateOfBirth}
Histórico médico: ${patient.medicalHistory || 'Não informado'}

CONSULTAS RECENTES (${recentAppointments.length}):
${recentAppointments
  .map(
    (apt: any) =>
      `- ${apt.startTime}: ${apt.type} (Status: ${apt.status}) - Terapeuta: ${apt.therapist?.name}`
  )
  .join('\n')}

PONTOS DE DOR RECENTES (${recentPainPoints.length}):
${recentPainPoints
  .map(
    (pain: any) =>
      `- ${pain.bodyPart}: ${pain.type} (Intensidade: ${pain.intensity}/10) - ${pain.description}`
  )
  .join('\n')}

MÉTRICAS RECENTES (${recentMetrics.length}):
${recentMetrics
  .map(
    (metric: any) =>
      `- ${metric.metricName}: ${metric.value} ${metric.unit} (${metric.measuredAt})`
  )
  .join('\n')}

Por favor, forneça uma análise estruturada incluindo:

1. NÍVEL DE RISCO (low/medium/high/critical) e justificativa
2. PROGRESSO DA RECUPERAÇÃO (0-100%) e tendência (improving/stable/declining)
3. ANÁLISE DE FREQUÊNCIA (taxa de comparecimento e padrão)
4. ANÁLISE DA DOR (tendência e intensidade média)
5. NÍVEL DE ENGAJAMENTO e fatores
6. PREDIÇÕES (probabilidade de alta e fatores de risco)
7. AÇÕES RECOMENDADAS

Seja específico e baseie-se em evidências clínicas.
    `;
  }

  private buildRecommendationPrompt(patient: any): string {
    return `
Como especialista em fisioterapia, gere recomendações específicas para este paciente:

PACIENTE: ${patient.name}
CONDIÇÃO: ${patient.medicalHistory || 'A definir'}
STATUS: ${patient.status}

DADOS CLÍNICOS:
${patient.appointments
  .slice(0, 5)
  .map(
    (apt: any) =>
      `- Consulta ${apt.type}: ${apt.status} (Notas: ${apt.notes || 'Sem notas'})`
  )
  .join('\n')}

${patient.painPoints
  .slice(0, 3)
  .map((pain: any) => `- Dor em ${pain.bodyPart}: ${pain.intensity}/10`)
  .join('\n')}

Gere 3-5 recomendações específicas com:
- Categoria (exercise/frequency/duration/technique/referral)
- Prioridade (high/medium/low)
- Recomendação detalhada
- Justificativa baseada em evidência
- Resultado esperado
- Passos de implementação
- Nível de confiança (0-100%)

Foque em abordagens baseadas em evidências científicas.
    `;
  }

  private buildClinicAnalysisPrompt(clinicData: any): string {
    const { patients, appointments } = clinicData;

    return `
Analise os dados da clínica de fisioterapia e forneça insights estratégicos:

DADOS GERAIS:
- Total de pacientes: ${patients.length}
- Consultas nos últimos 90 dias: ${appointments.length}
- Pacientes ativos: ${patients.filter((p: any) => p.status === 'Active').length}

PADRÕES DE CONSULTAS:
${this.getAppointmentPatterns(appointments)}

ANÁLISE DE CONDIÇÕES:
${this.getConditionAnalysis(patients)}

Forneça:
1. VISÃO GERAL (métricas principais)
2. PADRÕES IDENTIFICADOS
3. PERFORMANCE DO TRATAMENTO
4. ALERTAS CRÍTICOS
5. RECOMENDAÇÕES (operacionais, clínicas, comerciais)

Seja estratégico e orientado por dados.
    `;
  }

  private getAppointmentPatterns(appointments: any[]): string {
    const byDay = appointments.reduce((acc, apt) => {
      const day = new Date(apt.startTime).toLocaleDateString('pt-BR', {
        weekday: 'long',
      });
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(byDay)
      .map(([day, count]) => `${day}: ${count} consultas`)
      .join('\n');
  }

  private getConditionAnalysis(patients: any[]): string {
    const conditions: Record<string, number> = {};

    patients.forEach(patient => {
      if (patient.medicalHistory) {
        conditions[patient.medicalHistory] =
          (conditions[patient.medicalHistory] || 0) + 1;
      }
    });

    return Object.entries(conditions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([condition, count]) => `${condition}: ${count} pacientes`)
      .join('\n');
  }

  private parsePatientAnalysis(analysisText: string, patient: any): any {
    // Simple parsing logic - in production, use more sophisticated NLP
    const riskLevel = this.extractRiskLevel(analysisText);
    const progress = this.extractProgress(analysisText);

    return {
      riskLevel,
      insights: {
        recovery: {
          progress,
          trend:
            progress > 70
              ? 'improving'
              : progress > 40
                ? 'stable'
                : 'declining',
          analysis: analysisText.slice(0, 200) + '...',
        },
        attendance: {
          rate: this.calculateAttendanceRate(patient.appointments),
          pattern: 'consistent',
          analysis: 'Análise baseada nos dados de comparecimento',
        },
        pain: {
          trend: this.analyzePainTrend(patient.painPoints),
          avgIntensity: this.calculateAvgPainIntensity(patient.painPoints),
          analysis: 'Análise da evolução da dor baseada nos registros',
        },
        engagement: {
          level: 'medium' as const,
          factors: ['Comparecimento regular', 'Relatórios de dor consistentes'],
          recommendations: [
            'Aumentar frequência de exercícios',
            'Melhorar comunicação',
          ],
        },
      },
      predictions: {
        dischargeProbability: Math.min(progress + 20, 100),
        riskFactors: this.identifyRiskFactors(analysisText),
        recommendedActions: this.extractRecommendedActions(analysisText),
      },
    };
  }

  private parseRecommendations(
    text: string,
    patientId: string
  ): TreatmentRecommendation[] {
    // Simple parsing - implement more sophisticated parsing
    const recommendations: TreatmentRecommendation[] = [];

    // Mock recommendations based on analysis
    recommendations.push({
      patientId,
      category: 'exercise',
      priority: 'high',
      recommendation: 'Aumentar frequência de exercícios de fortalecimento',
      reasoning: 'Baseado na análise dos dados de recuperação',
      expectedOutcome: 'Melhora de 20-30% na força muscular em 4 semanas',
      implementationSteps: [
        'Avaliar capacidade atual',
        'Definir programa progressivo',
        'Monitorar evolução semanalmente',
      ],
      confidence: 85,
    });

    return recommendations;
  }

  private parseClinicAnalysis(
    analysisText: string,
    clinicData: any
  ): ClinicInsights {
    const { patients, appointments } = clinicData;

    return {
      overview: {
        totalPatients: patients.length,
        activePatients: patients.filter((p: any) => p.status === 'Active')
          .length,
        completionRate: 75, // Calculate from data
        avgSessionsPerPatient: appointments.length / patients.length,
      },
      patterns: {
        mostCommonConditions: [],
        busyDays: [],
        seasonalTrends: [],
      },
      performance: {
        therapistEfficiency: [],
        treatmentSuccess: [],
      },
      alerts: [
        {
          type: 'capacity_warning' as const,
          severity: 'medium' as const,
          message: 'Capacidade próxima do limite nos horários de pico',
          actionRequired: 'Considerar expandir horários de atendimento',
        },
      ],
      recommendations: {
        operational: ['Otimizar agendamentos para melhor distribuição'],
        clinical: ['Implementar protocolos padronizados'],
        business: ['Analisar oportunidades de expansão'],
      },
    };
  }

  // Helper methods
  private extractRiskLevel(
    text: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('critical') || lowerText.includes('crítico'))
      return 'critical';
    if (lowerText.includes('high') || lowerText.includes('alto')) return 'high';
    if (lowerText.includes('medium') || lowerText.includes('médio'))
      return 'medium';
    return 'low';
  }

  private extractProgress(text: string): number {
    const progressMatch = text.match(/(\d+)%/);
    return progressMatch ? parseInt(progressMatch[1]) : 50;
  }

  private calculateAttendanceRate(appointments: any[]): number {
    const completed = appointments.filter(
      apt => apt.status === 'Concluído'
    ).length;
    return appointments.length > 0
      ? Math.round((completed / appointments.length) * 100)
      : 0;
  }

  private analyzePainTrend(
    painPoints: any[]
  ): 'improving' | 'stable' | 'worsening' {
    if (painPoints.length < 2) return 'stable';

    const recent =
      painPoints.slice(0, 3).reduce((sum, p) => sum + p.intensity, 0) / 3;
    const older =
      painPoints.slice(3, 6).reduce((sum, p) => sum + p.intensity, 0) / 3;

    if (recent < older - 1) return 'improving';
    if (recent > older + 1) return 'worsening';
    return 'stable';
  }

  private calculateAvgPainIntensity(painPoints: any[]): number {
    if (painPoints.length === 0) return 0;
    return Math.round(
      painPoints.reduce((sum, p) => sum + p.intensity, 0) / painPoints.length
    );
  }

  private identifyRiskFactors(text: string): string[] {
    const factors = [];
    if (text.toLowerCase().includes('irregular'))
      factors.push('Comparecimento irregular');
    if (text.toLowerCase().includes('pain')) factors.push('Dor persistente');
    return factors;
  }

  private extractRecommendedActions(text: string): string[] {
    return [
      'Acompanhar evolução semanalmente',
      'Ajustar plano de tratamento conforme necessário',
      'Manter comunicação regular com paciente',
    ];
  }

  private async storePatientInsights(
    patientId: string,
    insights: PatientInsight
  ): Promise<void> {
    try {
      // Store in database for historical tracking
      await prisma.$executeRaw`
        INSERT INTO "PatientInsights" ("patientId", "riskLevel", "insights", "generatedAt")
        VALUES (${patientId}, ${insights.riskLevel}, ${JSON.stringify(insights.insights)}::jsonb, ${insights.generatedAt})
        ON CONFLICT ("patientId") 
        DO UPDATE SET 
          "riskLevel" = EXCLUDED."riskLevel",
          "insights" = EXCLUDED."insights",
          "generatedAt" = EXCLUDED."generatedAt";
      `;
    } catch (error) {
      structuredLogger.error('Failed to store patient insights', {
        patientId,
        error,
      });
    }
  }

  // Health check for AI service
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    error?: string;
  }> {
    try {
      if (!process.env.GOOGLE_AI_API_KEY) {
        return {
          status: 'unhealthy',
          error: 'Google AI API key not configured',
        };
      }

      // Simple test request
      const result = await this.model.generateContent(
        'Hello, this is a health check test.'
      );

      if (result && result.response) {
        return { status: 'healthy' };
      } else {
        return { status: 'unhealthy', error: 'Invalid AI response' };
      }
    } catch (error: any) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

// Singleton instance
export const aiInsightsService = new AIInsightsService();
export default aiInsightsService;

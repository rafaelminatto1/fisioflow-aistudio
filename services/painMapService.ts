import { PainPoint } from '@/components/PainMapInteractive'

export interface PainMapSession {
  id: string
  patientId: string
  therapistId: string
  painPoints: PainPoint[]
  sessionDate: Date
  notes?: string
  overallPainLevel: number
  functionalImpact: 'low' | 'moderate' | 'high' | 'severe'
  treatmentGoals: string[]
}

export interface PainAnalytics {
  averagePainLevel: number
  mostAffectedAreas: Array<{
    bodyPart: string
    frequency: number
    averageIntensity: number
  }>
  painTrend: 'improving' | 'stable' | 'worsening'
  totalPainPoints: number
  sessionsCount: number
}

// Mock data for demonstration
const mockPainMapSessions: PainMapSession[] = [
  {
    id: 'session_1',
    patientId: 'patient_1',
    therapistId: 'therapist_1',
    sessionDate: new Date('2024-01-15'),
    overallPainLevel: 7,
    functionalImpact: 'high',
    treatmentGoals: ['Reduzir dor lombar', 'Melhorar mobilidade cervical'],
    painPoints: [
      {
        id: 'pain_1',
        x: 50,
        y: 70,
        intensity: 8,
        description: 'Dor lombar intensa, piora ao sentar por longos períodos',
        bodyPart: 'back_lower',
        timestamp: new Date('2024-01-15')
      },
      {
        id: 'pain_2',
        x: 50,
        y: 25,
        intensity: 6,
        description: 'Rigidez cervical, especialmente pela manhã',
        bodyPart: 'neck',
        timestamp: new Date('2024-01-15')
      }
    ]
  },
  {
    id: 'session_2',
    patientId: 'patient_1',
    therapistId: 'therapist_1',
    sessionDate: new Date('2024-01-22'),
    overallPainLevel: 5,
    functionalImpact: 'moderate',
    treatmentGoals: ['Reduzir dor lombar', 'Melhorar mobilidade cervical'],
    painPoints: [
      {
        id: 'pain_3',
        x: 50,
        y: 70,
        intensity: 5,
        description: 'Dor lombar melhorou, ainda presente mas mais tolerável',
        bodyPart: 'back_lower',
        timestamp: new Date('2024-01-22')
      },
      {
        id: 'pain_4',
        x: 50,
        y: 25,
        intensity: 4,
        description: 'Rigidez cervical diminuiu após exercícios',
        bodyPart: 'neck',
        timestamp: new Date('2024-01-22')
      }
    ]
  }
]

class PainMapService {
  private sessions: PainMapSession[] = mockPainMapSessions

  // Simulate API delay
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async savePainMapSession(session: Omit<PainMapSession, 'id'>): Promise<PainMapSession> {
    await this.delay(500)
    
    const newSession: PainMapSession = {
      ...session,
      id: `session_${Date.now()}`
    }
    
    this.sessions.push(newSession)
    return newSession
  }

  async getPainMapSessions(patientId: string): Promise<PainMapSession[]> {
    await this.delay(300)
    
    return this.sessions
      .filter(session => session.patientId === patientId)
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
  }

  async getPainMapSession(sessionId: string): Promise<PainMapSession | null> {
    await this.delay(200)
    
    return this.sessions.find(session => session.id === sessionId) || null
  }

  async updatePainMapSession(sessionId: string, updates: Partial<PainMapSession>): Promise<PainMapSession | null> {
    await this.delay(400)
    
    const sessionIndex = this.sessions.findIndex(session => session.id === sessionId)
    if (sessionIndex === -1) return null
    
    this.sessions[sessionIndex] = { ...this.sessions[sessionIndex], ...updates }
    return this.sessions[sessionIndex]
  }

  async deletePainMapSession(sessionId: string): Promise<boolean> {
    await this.delay(300)
    
    const sessionIndex = this.sessions.findIndex(session => session.id === sessionId)
    if (sessionIndex === -1) return false
    
    this.sessions.splice(sessionIndex, 1)
    return true
  }

  async getPainAnalytics(patientId: string): Promise<PainAnalytics> {
    await this.delay(400)
    
    const patientSessions = this.sessions.filter(session => session.patientId === patientId)
    
    if (patientSessions.length === 0) {
      return {
        averagePainLevel: 0,
        mostAffectedAreas: [],
        painTrend: 'stable',
        totalPainPoints: 0,
        sessionsCount: 0
      }
    }

    // Calculate average pain level
    const totalPainLevel = patientSessions.reduce((sum, session) => sum + session.overallPainLevel, 0)
    const averagePainLevel = totalPainLevel / patientSessions.length

    // Analyze most affected areas
    const bodyPartStats: Record<string, { count: number; totalIntensity: number }> = {}
    let totalPainPoints = 0

    patientSessions.forEach(session => {
      session.painPoints.forEach(point => {
        totalPainPoints++
        if (!bodyPartStats[point.bodyPart]) {
          bodyPartStats[point.bodyPart] = { count: 0, totalIntensity: 0 }
        }
        bodyPartStats[point.bodyPart].count++
        bodyPartStats[point.bodyPart].totalIntensity += point.intensity
      })
    })

    const mostAffectedAreas = Object.entries(bodyPartStats)
      .map(([bodyPart, stats]) => ({
        bodyPart,
        frequency: stats.count,
        averageIntensity: stats.totalIntensity / stats.count
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5)

    // Determine pain trend (comparing first and last sessions)
    let painTrend: 'improving' | 'stable' | 'worsening' = 'stable'
    if (patientSessions.length >= 2) {
      const sortedSessions = patientSessions.sort((a, b) => 
        new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime()
      )
      const firstSession = sortedSessions[0]
      const lastSession = sortedSessions[sortedSessions.length - 1]
      
      const painDifference = lastSession.overallPainLevel - firstSession.overallPainLevel
      if (painDifference < -1) painTrend = 'improving'
      else if (painDifference > 1) painTrend = 'worsening'
    }

    return {
      averagePainLevel: Math.round(averagePainLevel * 10) / 10,
      mostAffectedAreas,
      painTrend,
      totalPainPoints,
      sessionsCount: patientSessions.length
    }
  }

  async getLatestPainMap(patientId: string): Promise<PainMapSession | null> {
    await this.delay(200)
    
    const patientSessions = this.sessions
      .filter(session => session.patientId === patientId)
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
    
    return patientSessions[0] || null
  }

  async comparePainMaps(sessionId1: string, sessionId2: string): Promise<{
    session1: PainMapSession | null
    session2: PainMapSession | null
    comparison: {
      painLevelChange: number
      newPainAreas: string[]
      resolvedPainAreas: string[]
      improvedAreas: Array<{ bodyPart: string; improvement: number }>
      worsenedAreas: Array<{ bodyPart: string; worsening: number }>
    }
  }> {
    await this.delay(500)
    
    const session1 = await this.getPainMapSession(sessionId1)
    const session2 = await this.getPainMapSession(sessionId2)
    
    if (!session1 || !session2) {
      return {
        session1,
        session2,
        comparison: {
          painLevelChange: 0,
          newPainAreas: [],
          resolvedPainAreas: [],
          improvedAreas: [],
          worsenedAreas: []
        }
      }
    }

    const painLevelChange = session2.overallPainLevel - session1.overallPainLevel
    
    const session1Areas = new Set(session1.painPoints.map(p => p.bodyPart))
    const session2Areas = new Set(session2.painPoints.map(p => p.bodyPart))
    
    const newPainAreas = Array.from(session2Areas).filter(area => !session1Areas.has(area))
    const resolvedPainAreas = Array.from(session1Areas).filter(area => !session2Areas.has(area))
    
    const improvedAreas: Array<{ bodyPart: string; improvement: number }> = []
    const worsenedAreas: Array<{ bodyPart: string; worsening: number }> = []
    
    // Compare intensity changes for common areas
    session1Areas.forEach(bodyPart => {
      if (session2Areas.has(bodyPart)) {
        const session1Point = session1.painPoints.find(p => p.bodyPart === bodyPart)
        const session2Point = session2.painPoints.find(p => p.bodyPart === bodyPart)
        
        if (session1Point && session2Point) {
          const intensityChange = session2Point.intensity - session1Point.intensity
          if (intensityChange < -1) {
            improvedAreas.push({ bodyPart, improvement: Math.abs(intensityChange) })
          } else if (intensityChange > 1) {
            worsenedAreas.push({ bodyPart, worsening: intensityChange })
          }
        }
      }
    })
    
    return {
      session1,
      session2,
      comparison: {
        painLevelChange,
        newPainAreas,
        resolvedPainAreas,
        improvedAreas,
        worsenedAreas
      }
    }
  }

  // Generate pain report for patient
  async generatePainReport(patientId: string): Promise<{
    patient: { id: string; name: string }
    analytics: PainAnalytics
    recentSessions: PainMapSession[]
    recommendations: string[]
  }> {
    await this.delay(600)
    
    const analytics = await this.getPainAnalytics(patientId)
    const recentSessions = (await this.getPainMapSessions(patientId)).slice(0, 5)
    
    // Generate recommendations based on pain patterns
    const recommendations: string[] = []
    
    if (analytics.painTrend === 'worsening') {
      recommendations.push('Considerar ajuste no plano de tratamento devido ao agravamento da dor')
      recommendations.push('Avaliar necessidade de exames complementares')
    } else if (analytics.painTrend === 'improving') {
      recommendations.push('Manter protocolo atual - paciente apresenta melhora')
      recommendations.push('Considerar progressão dos exercícios')
    }
    
    if (analytics.averagePainLevel > 7) {
      recommendations.push('Priorizar técnicas de alívio da dor')
      recommendations.push('Considerar modalidades terapêuticas adicionais')
    }
    
    analytics.mostAffectedAreas.forEach(area => {
      if (area.frequency > 2 && area.averageIntensity > 6) {
        recommendations.push(`Focar tratamento na região: ${area.bodyPart}`)
      }
    })
    
    return {
      patient: { id: patientId, name: 'Paciente Exemplo' }, // In real app, fetch from patient service
      analytics,
      recentSessions,
      recommendations
    }
  }
}

export const painMapService = new PainMapService()
export default painMapService
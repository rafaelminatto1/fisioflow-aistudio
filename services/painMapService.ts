import { PainPoint } from '@/types'

export interface PainMapSession {
  id: string
  patientId: string
  sessionDate: string
  painPoints: PainPoint[]
  overallPainLevel: number
  functionalImpact: 'low' | 'moderate' | 'high' | 'severe'
  notes?: string
  therapistId: string
  createdAt: string
  updatedAt: string
}

export interface PainAnalytics {
  patientId: string
  totalPainPoints: number
  averagePainLevel: number
  painTrend: 'improving' | 'stable' | 'worsening'
  mostAffectedAreas: {
    bodyPart: string
    frequency: number
    averageIntensity: number
  }[]
  sessionsCount: number
  lastSessionDate?: string
  painDistribution: {
    mild: number // 1-3
    moderate: number // 4-6
    severe: number // 7-8
    extreme: number // 9-10
  }
}

export interface PainComparison {
  sessionId1: string
  sessionId2: string
  comparison: {
    painLevelChange: number
    improvedAreas: {
      bodyPart: string
      improvement: number
    }[]
    worsenedAreas: {
      bodyPart: string
      worsening: number
    }[]
    newPainAreas: string[]
    resolvedPainAreas: string[]
    overallTrend: 'improving' | 'stable' | 'worsening'
  }
}

// Mock data for development
const mockPainMapSessions: PainMapSession[] = [
  {
    id: '1',
    patientId: 'patient-1',
    sessionDate: '2024-01-15T10:00:00Z',
    painPoints: [
      {
        id: '1',
        x: 150,
        y: 200,
        intensity: 7,
        bodyPart: 'back',
        description: 'Dor lombar intensa ao acordar',
        type: 'aguda'
      },
      {
        id: '2',
        x: 120,
        y: 150,
        intensity: 5,
        bodyPart: 'front',
        description: 'Tensão no ombro esquerdo',
        type: 'latejante'
      }
    ],
    overallPainLevel: 6,
    functionalImpact: 'high',
    notes: 'Paciente relata dificuldade para dormir devido à dor lombar',
    therapistId: 'therapist-1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    patientId: 'patient-1',
    sessionDate: '2024-01-08T14:30:00Z',
    painPoints: [
      {
        id: '3',
        x: 150,
        y: 200,
        intensity: 8,
        bodyPart: 'back',
        description: 'Dor lombar severa',
        type: 'aguda'
      },
      {
        id: '4',
        x: 120,
        y: 150,
        intensity: 6,
        bodyPart: 'front',
        description: 'Dor no ombro esquerdo',
        type: 'latejante'
      },
      {
        id: '5',
        x: 180,
        y: 150,
        intensity: 4,
        bodyPart: 'front',
        description: 'Leve desconforto no ombro direito',
        type: 'cansaço'
      }
    ],
    overallPainLevel: 7,
    functionalImpact: 'severe',
    notes: 'Primeira sessão - dor intensa generalizada',
    therapistId: 'therapist-1',
    createdAt: '2024-01-08T14:30:00Z',
    updatedAt: '2024-01-08T14:30:00Z'
  },
  {
    id: '3',
    patientId: 'patient-2',
    sessionDate: '2024-01-10T09:00:00Z',
    painPoints: [
      {
        id: '6',
        x: 100,
        y: 100,
        intensity: 6,
        bodyPart: 'front',
        description: 'Dor cervical por postura',
        type: 'formigamento'
      }
    ],
    overallPainLevel: 6,
    functionalImpact: 'moderate',
    notes: 'Dor relacionada ao trabalho em escritório',
    therapistId: 'therapist-1',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-10T09:00:00Z'
  }
]

class PainMapService {
  private sessions: PainMapSession[] = mockPainMapSessions

  // Create a new pain map session
  async createPainMapSession(sessionData: Omit<PainMapSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<PainMapSession> {
    const newSession: PainMapSession = {
      ...sessionData,
      id: `session-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    this.sessions.unshift(newSession)
    return newSession
  }

  // Get pain map sessions for a patient
  async getPainMapSessions(patientId: string): Promise<PainMapSession[]> {
    return this.sessions
      .filter(session => session.patientId === patientId)
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
  }

  // Get a specific pain map session
  async getPainMapSession(sessionId: string): Promise<PainMapSession | null> {
    return this.sessions.find(session => session.id === sessionId) || null
  }

  // Update a pain map session
  async updatePainMapSession(sessionId: string, updates: Partial<PainMapSession>): Promise<PainMapSession | null> {
    const sessionIndex = this.sessions.findIndex(session => session.id === sessionId)
    if (sessionIndex === -1) return null

    this.sessions[sessionIndex] = {
      ...this.sessions[sessionIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    return this.sessions[sessionIndex]
  }

  // Delete a pain map session
  async deletePainMapSession(sessionId: string): Promise<boolean> {
    const sessionIndex = this.sessions.findIndex(session => session.id === sessionId)
    if (sessionIndex === -1) return false

    this.sessions.splice(sessionIndex, 1)
    return true
  }

  // Get pain analytics for a patient
  async getPainAnalytics(patientId: string): Promise<PainAnalytics> {
    const patientSessions = await this.getPainMapSessions(patientId)
    
    if (patientSessions.length === 0) {
      return {
        patientId,
        totalPainPoints: 0,
        averagePainLevel: 0,
        painTrend: 'stable',
        mostAffectedAreas: [],
        sessionsCount: 0,
        painDistribution: { mild: 0, moderate: 0, severe: 0, extreme: 0 }
      }
    }

    // Calculate total pain points
    const totalPainPoints = patientSessions.reduce((total, session) => total + session.painPoints.length, 0)

    // Calculate average pain level
    const allPainPoints = patientSessions.flatMap(session => session.painPoints)
    const averagePainLevel = allPainPoints.length > 0 
      ? allPainPoints.reduce((sum, point) => sum + point.intensity, 0) / allPainPoints.length
      : 0

    // Calculate pain trend (comparing recent sessions)
    let painTrend: 'improving' | 'stable' | 'worsening' = 'stable'
    if (patientSessions.length >= 2) {
      const recentAvg = patientSessions.slice(0, Math.ceil(patientSessions.length / 2))
        .flatMap(s => s.painPoints)
        .reduce((sum, p, _, arr) => sum + p.intensity / arr.length, 0)
      
      const olderAvg = patientSessions.slice(Math.ceil(patientSessions.length / 2))
        .flatMap(s => s.painPoints)
        .reduce((sum, p, _, arr) => sum + p.intensity / arr.length, 0)
      
      const difference = recentAvg - olderAvg
      if (difference < -0.5) painTrend = 'improving'
      else if (difference > 0.5) painTrend = 'worsening'
    }

    // Calculate most affected areas
    const bodyPartStats = new Map<string, { count: number, totalIntensity: number }>()
    
    allPainPoints.forEach(point => {
      const current = bodyPartStats.get(point.bodyPart) || { count: 0, totalIntensity: 0 }
      bodyPartStats.set(point.bodyPart, {
        count: current.count + 1,
        totalIntensity: current.totalIntensity + point.intensity
      })
    })

    const mostAffectedAreas = Array.from(bodyPartStats.entries())
      .map(([bodyPart, stats]) => ({
        bodyPart,
        frequency: stats.count,
        averageIntensity: stats.totalIntensity / stats.count
      }))
      .sort((a, b) => b.frequency - a.frequency || b.averageIntensity - a.averageIntensity)
      .slice(0, 5)

    // Calculate pain distribution
    const painDistribution = allPainPoints.reduce(
      (dist, point) => {
        if (point.intensity <= 3) dist.mild++
        else if (point.intensity <= 6) dist.moderate++
        else if (point.intensity <= 8) dist.severe++
        else dist.extreme++
        return dist
      },
      { mild: 0, moderate: 0, severe: 0, extreme: 0 }
    )

    return {
      patientId,
      totalPainPoints,
      averagePainLevel,
      painTrend,
      mostAffectedAreas,
      sessionsCount: patientSessions.length,
      lastSessionDate: patientSessions[0]?.sessionDate,
      painDistribution
    }
  }

  // Compare two pain map sessions
  async comparePainMaps(sessionId1: string, sessionId2: string): Promise<PainComparison> {
    const session1 = await this.getPainMapSession(sessionId1)
    const session2 = await this.getPainMapSession(sessionId2)

    if (!session1 || !session2) {
      throw new Error('One or both sessions not found')
    }

    // Calculate average pain levels
    const avgPain1 = session1.painPoints.length > 0 
      ? session1.painPoints.reduce((sum, p) => sum + p.intensity, 0) / session1.painPoints.length
      : 0
    
    const avgPain2 = session2.painPoints.length > 0
      ? session2.painPoints.reduce((sum, p) => sum + p.intensity, 0) / session2.painPoints.length
      : 0

    const painLevelChange = avgPain2 - avgPain1

    // Group pain points by body part for comparison
    const bodyParts1 = new Map<string, number[]>()
    const bodyParts2 = new Map<string, number[]>()

    session1.painPoints.forEach(point => {
      const current = bodyParts1.get(point.bodyPart) || []
      current.push(point.intensity)
      bodyParts1.set(point.bodyPart, current)
    })

    session2.painPoints.forEach(point => {
      const current = bodyParts2.get(point.bodyPart) || []
      current.push(point.intensity)
      bodyParts2.set(point.bodyPart, current)
    })

    // Find improved and worsened areas
    const improvedAreas: { bodyPart: string, improvement: number }[] = []
    const worsenedAreas: { bodyPart: string, worsening: number }[] = []
    const newPainAreas: string[] = []
    const resolvedPainAreas: string[] = []

    // Check all body parts from both sessions
    const allBodyParts = new Set([...Array.from(bodyParts1.keys()), ...Array.from(bodyParts2.keys())])

    allBodyParts.forEach(bodyPart => {
      const intensities1 = bodyParts1.get(bodyPart) || []
      const intensities2 = bodyParts2.get(bodyPart) || []

      if (intensities1.length === 0 && intensities2.length > 0) {
        // New pain area
        newPainAreas.push(bodyPart)
      } else if (intensities1.length > 0 && intensities2.length === 0) {
        // Resolved pain area
        resolvedPainAreas.push(bodyPart)
      } else if (intensities1.length > 0 && intensities2.length > 0) {
        // Compare average intensities
        const avg1 = intensities1.reduce((sum, i) => sum + i, 0) / intensities1.length
        const avg2 = intensities2.reduce((sum, i) => sum + i, 0) / intensities2.length
        const change = avg2 - avg1

        if (change < -0.5) {
          improvedAreas.push({ bodyPart, improvement: Math.abs(change) })
        } else if (change > 0.5) {
          worsenedAreas.push({ bodyPart, worsening: change })
        }
      }
    })

    // Determine overall trend
    let overallTrend: 'improving' | 'stable' | 'worsening' = 'stable'
    if (painLevelChange < -0.5 || improvedAreas.length > worsenedAreas.length) {
      overallTrend = 'improving'
    } else if (painLevelChange > 0.5 || worsenedAreas.length > improvedAreas.length) {
      overallTrend = 'worsening'
    }

    return {
      sessionId1,
      sessionId2,
      comparison: {
        painLevelChange,
        improvedAreas: improvedAreas.sort((a, b) => b.improvement - a.improvement),
        worsenedAreas: worsenedAreas.sort((a, b) => b.worsening - a.worsening),
        newPainAreas,
        resolvedPainAreas,
        overallTrend
      }
    }
  }

  // Get pain statistics for dashboard
  async getPainStatistics(): Promise<{
    totalSessions: number
    totalPatients: number
    averagePainLevel: number
    mostCommonBodyParts: { bodyPart: string, frequency: number }[]
    painTrendOverall: 'improving' | 'stable' | 'worsening'
  }> {
    const allPainPoints = this.sessions.flatMap(session => session.painPoints)
    const uniquePatients = new Set(this.sessions.map(session => session.patientId))
    
    const averagePainLevel = allPainPoints.length > 0
      ? allPainPoints.reduce((sum, point) => sum + point.intensity, 0) / allPainPoints.length
      : 0

    // Count body part frequencies
    const bodyPartCounts = new Map<string, number>()
    allPainPoints.forEach(point => {
      bodyPartCounts.set(point.bodyPart, (bodyPartCounts.get(point.bodyPart) || 0) + 1)
    })

    const mostCommonBodyParts = Array.from(bodyPartCounts.entries())
      .map(([bodyPart, frequency]) => ({ bodyPart, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5)

    // Calculate overall trend (simplified)
    const recentSessions = this.sessions
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
      .slice(0, Math.ceil(this.sessions.length / 2))
    
    const olderSessions = this.sessions
      .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
      .slice(Math.ceil(this.sessions.length / 2))

    const recentAvg = recentSessions.flatMap(s => s.painPoints)
      .reduce((sum, p, _, arr) => arr.length > 0 ? sum + p.intensity / arr.length : 0, 0)
    
    const olderAvg = olderSessions.flatMap(s => s.painPoints)
      .reduce((sum, p, _, arr) => arr.length > 0 ? sum + p.intensity / arr.length : 0, 0)

    let painTrendOverall: 'improving' | 'stable' | 'worsening' = 'stable'
    if (recentAvg < olderAvg - 0.5) painTrendOverall = 'improving'
    else if (recentAvg > olderAvg + 0.5) painTrendOverall = 'worsening'

    return {
      totalSessions: this.sessions.length,
      totalPatients: uniquePatients.size,
      averagePainLevel,
      mostCommonBodyParts,
      painTrendOverall
    }
  }

  // Export pain data for reports
  async exportPainData(patientId?: string): Promise<{
    sessions: PainMapSession[]
    analytics?: PainAnalytics
  }> {
    const sessions = patientId 
      ? await this.getPainMapSessions(patientId)
      : this.sessions
    
    const analytics = patientId 
      ? await this.getPainAnalytics(patientId)
      : undefined

    return { sessions, analytics }
  }
}

export const painMapService = new PainMapService()
export default painMapService
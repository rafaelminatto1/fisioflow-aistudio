'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { 
  Save, 
  FileText, 
  Activity, 
  MapPin, 
  TrendingUp, 
  Calendar,
  User,
  Stethoscope,
  Target,
  AlertCircle
} from 'lucide-react'

import PainMapInteractive, { PainPoint } from '@/components/PainMapInteractive'
import { painMapService, PainMapSession } from '@/services/painMapService'
import Sidebar from '@/components/Sidebar'

interface PatientEvaluation {
  id?: string
  patientId: string
  therapistId: string
  evaluationDate: Date
  chiefComplaint: string
  painHistory: string
  functionalLimitations: string[]
  previousTreatments: string
  medications: string
  lifestyle: {
    occupation: string
    physicalActivity: string
    sleepQuality: number
    stressLevel: number
  }
  physicalExam: {
    posture: string
    mobility: string
    strength: string
    balance: string
    coordination: string
  }
  functionalTests: Array<{
    testName: string
    result: string
    score?: number
  }>
  treatmentGoals: string[]
  treatmentPlan: string
  nextAppointment?: Date
  notes: string
}

const FUNCTIONAL_LIMITATIONS = [
  'Dificuldade para caminhar',
  'Limitação para subir escadas',
  'Dor ao sentar por longos períodos',
  'Dificuldade para levantar objetos',
  'Limitação de movimento cervical',
  'Dor durante o sono',
  'Dificuldade para atividades domésticas',
  'Limitação para atividades esportivas'
]

const FUNCTIONAL_TESTS = [
  { name: 'Teste de Schober', description: 'Mobilidade lombar' },
  { name: 'Teste de Thomas', description: 'Flexibilidade do quadril' },
  { name: 'Teste de Lasègue', description: 'Compressão do nervo ciático' },
  { name: 'Teste de Spurling', description: 'Compressão cervical' },
  { name: 'Teste de Apley', description: 'Lesão meniscal' },
  { name: 'Teste de Hawkins', description: 'Impacto do ombro' },
  { name: 'Berg Balance Scale', description: 'Equilíbrio funcional' },
  { name: 'Timed Up and Go', description: 'Mobilidade funcional' }
]

export default function PatientEvaluationPage() {
  const params = useParams()
  const patientId = params.id as string
  
  const [evaluation, setEvaluation] = useState<PatientEvaluation>({
    patientId,
    therapistId: 'current_therapist', // In real app, get from auth
    evaluationDate: new Date(),
    chiefComplaint: '',
    painHistory: '',
    functionalLimitations: [],
    previousTreatments: '',
    medications: '',
    lifestyle: {
      occupation: '',
      physicalActivity: '',
      sleepQuality: 5,
      stressLevel: 5
    },
    physicalExam: {
      posture: '',
      mobility: '',
      strength: '',
      balance: '',
      coordination: ''
    },
    functionalTests: [],
    treatmentGoals: [],
    treatmentPlan: '',
    notes: ''
  })
  
  const [painPoints, setPainPoints] = useState<PainPoint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('anamnesis')
  const [patient, setPatient] = useState({ name: 'Paciente Exemplo', age: 45 })

  useEffect(() => {
    // Load existing evaluation if editing
    // In real app, fetch from API
  }, [patientId])

  const handleSavePainMap = async (points: PainPoint[]) => {
    setPainPoints(points)
    toast.success('Mapa de dor salvo com sucesso!')
  }

  const addFunctionalLimitation = (limitation: string) => {
    if (!evaluation.functionalLimitations.includes(limitation)) {
      setEvaluation(prev => ({
        ...prev,
        functionalLimitations: [...prev.functionalLimitations, limitation]
      }))
    }
  }

  const removeFunctionalLimitation = (limitation: string) => {
    setEvaluation(prev => ({
      ...prev,
      functionalLimitations: prev.functionalLimitations.filter(l => l !== limitation)
    }))
  }

  const addFunctionalTest = (testName: string) => {
    const existingTest = evaluation.functionalTests.find(t => t.testName === testName)
    if (!existingTest) {
      setEvaluation(prev => ({
        ...prev,
        functionalTests: [...prev.functionalTests, { testName, result: '' }]
      }))
    }
  }

  const updateFunctionalTest = (testName: string, result: string, score?: number) => {
    setEvaluation(prev => ({
      ...prev,
      functionalTests: prev.functionalTests.map(test =>
        test.testName === testName ? { ...test, result, score } : test
      )
    }))
  }

  const addTreatmentGoal = () => {
    const goal = prompt('Digite o objetivo do tratamento:')
    if (goal && goal.trim()) {
      setEvaluation(prev => ({
        ...prev,
        treatmentGoals: [...prev.treatmentGoals, goal.trim()]
      }))
    }
  }

  const removeTreatmentGoal = (index: number) => {
    setEvaluation(prev => ({
      ...prev,
      treatmentGoals: prev.treatmentGoals.filter((_, i) => i !== index)
    }))
  }

  const handleSaveEvaluation = async () => {
    setIsLoading(true)
    try {
      // Save pain map session
      if (painPoints.length > 0) {
        const overallPainLevel = Math.round(
          painPoints.reduce((sum, point) => sum + point.intensity, 0) / painPoints.length
        )
        
        await painMapService.savePainMapSession({
          patientId,
          therapistId: evaluation.therapistId,
          painPoints,
          sessionDate: evaluation.evaluationDate,
          notes: evaluation.notes,
          overallPainLevel,
          functionalImpact: overallPainLevel > 7 ? 'severe' : overallPainLevel > 5 ? 'high' : overallPainLevel > 3 ? 'moderate' : 'low',
          treatmentGoals: evaluation.treatmentGoals
        })
      }
      
      // In real app, save evaluation to database
      console.log('Saving evaluation:', evaluation)
      
      toast.success('Avaliação salva com sucesso!')
    } catch (error) {
      console.error('Error saving evaluation:', error)
      toast.error('Erro ao salvar avaliação')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-500" />
                <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
                <Badge variant="secondary">{patient.age} anos</Badge>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleSaveEvaluation}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Salvando...' : 'Salvar Avaliação'}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="anamnesis" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Anamnese
              </TabsTrigger>
              <TabsTrigger value="pain-map" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Mapa de Dor
              </TabsTrigger>
              <TabsTrigger value="physical-exam" className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                Exame Físico
              </TabsTrigger>
              <TabsTrigger value="functional-tests" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Testes Funcionais
              </TabsTrigger>
              <TabsTrigger value="treatment-plan" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Plano de Tratamento
              </TabsTrigger>
            </TabsList>

            {/* Anamnesis Tab */}
            <TabsContent value="anamnesis" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Queixa Principal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={evaluation.chiefComplaint}
                      onChange={(e) => setEvaluation(prev => ({ ...prev, chiefComplaint: e.target.value }))}
                      placeholder="Descreva a queixa principal do paciente..."
                      className="min-h-[100px]"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>História da Dor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={evaluation.painHistory}
                      onChange={(e) => setEvaluation(prev => ({ ...prev, painHistory: e.target.value }))}
                      placeholder="Quando começou, como evoluiu, fatores que pioram/melhoram..."
                      className="min-h-[100px]"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Limitações Funcionais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {FUNCTIONAL_LIMITATIONS.map(limitation => (
                        <Button
                          key={limitation}
                          variant={evaluation.functionalLimitations.includes(limitation) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (evaluation.functionalLimitations.includes(limitation)) {
                              removeFunctionalLimitation(limitation)
                            } else {
                              addFunctionalLimitation(limitation)
                            }
                          }}
                        >
                          {limitation}
                        </Button>
                      ))}
                    </div>
                    {evaluation.functionalLimitations.length > 0 && (
                      <div className="mt-4">
                        <Label>Limitações Selecionadas:</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {evaluation.functionalLimitations.map(limitation => (
                            <Badge key={limitation} variant="secondary">
                              {limitation}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Estilo de Vida</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="occupation">Ocupação</Label>
                      <Input
                        id="occupation"
                        value={evaluation.lifestyle.occupation}
                        onChange={(e) => setEvaluation(prev => ({
                          ...prev,
                          lifestyle: { ...prev.lifestyle, occupation: e.target.value }
                        }))}
                        placeholder="Profissão do paciente"
                      />
                    </div>
                    <div>
                      <Label htmlFor="physical-activity">Atividade Física</Label>
                      <Input
                        id="physical-activity"
                        value={evaluation.lifestyle.physicalActivity}
                        onChange={(e) => setEvaluation(prev => ({
                          ...prev,
                          lifestyle: { ...prev.lifestyle, physicalActivity: e.target.value }
                        }))}
                        placeholder="Frequência e tipo de atividade física"
                      />
                    </div>
                    <div>
                      <Label>Qualidade do Sono (1-10)</Label>
                      <Slider
                        value={[evaluation.lifestyle.sleepQuality]}
                        onValueChange={([value]) => setEvaluation(prev => ({
                          ...prev,
                          lifestyle: { ...prev.lifestyle, sleepQuality: value }
                        }))}
                        max={10}
                        min={1}
                        step={1}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Péssima</span>
                        <span>{evaluation.lifestyle.sleepQuality}</span>
                        <span>Excelente</span>
                      </div>
                    </div>
                    <div>
                      <Label>Nível de Estresse (1-10)</Label>
                      <Slider
                        value={[evaluation.lifestyle.stressLevel]}
                        onValueChange={([value]) => setEvaluation(prev => ({
                          ...prev,
                          lifestyle: { ...prev.lifestyle, stressLevel: value }
                        }))}
                        max={10}
                        min={1}
                        step={1}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Baixo</span>
                        <span>{evaluation.lifestyle.stressLevel}</span>
                        <span>Alto</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Pain Map Tab */}
            <TabsContent value="pain-map">
              <PainMapInteractive
                patientId={patientId}
                initialPainPoints={painPoints}
                onSave={handleSavePainMap}
              />
            </TabsContent>

            {/* Physical Exam Tab */}
            <TabsContent value="physical-exam" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(evaluation.physicalExam).map(([key, value]) => (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle className="capitalize">
                        {key === 'posture' ? 'Postura' :
                         key === 'mobility' ? 'Mobilidade' :
                         key === 'strength' ? 'Força' :
                         key === 'balance' ? 'Equilíbrio' :
                         key === 'coordination' ? 'Coordenação' : key}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={value}
                        onChange={(e) => setEvaluation(prev => ({
                          ...prev,
                          physicalExam: { ...prev.physicalExam, [key]: e.target.value }
                        }))}
                        placeholder={`Avaliação de ${key}...`}
                        className="min-h-[100px]"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Functional Tests Tab */}
            <TabsContent value="functional-tests" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Adicionar Teste Funcional</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {FUNCTIONAL_TESTS.map(test => (
                      <Button
                        key={test.name}
                        variant="outline"
                        size="sm"
                        onClick={() => addFunctionalTest(test.name)}
                        disabled={evaluation.functionalTests.some(t => t.testName === test.name)}
                      >
                        {test.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {evaluation.functionalTests.length > 0 && (
                <div className="space-y-4">
                  {evaluation.functionalTests.map(test => (
                    <Card key={test.testName}>
                      <CardHeader>
                        <CardTitle className="text-lg">{test.testName}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Resultado</Label>
                          <Textarea
                            value={test.result}
                            onChange={(e) => updateFunctionalTest(test.testName, e.target.value, test.score)}
                            placeholder="Descreva o resultado do teste..."
                          />
                        </div>
                        <div>
                          <Label>Pontuação (opcional)</Label>
                          <Input
                            type="number"
                            value={test.score || ''}
                            onChange={(e) => updateFunctionalTest(test.testName, test.result, Number(e.target.value))}
                            placeholder="Pontuação numérica"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Treatment Plan Tab */}
            <TabsContent value="treatment-plan" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Objetivos do Tratamento
                      <Button onClick={addTreatmentGoal} size="sm">
                        Adicionar Objetivo
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {evaluation.treatmentGoals.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        Nenhum objetivo definido ainda.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {evaluation.treatmentGoals.map((goal, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span>{goal}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTreatmentGoal(index)}
                            >
                              <AlertCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Plano de Tratamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={evaluation.treatmentPlan}
                      onChange={(e) => setEvaluation(prev => ({ ...prev, treatmentPlan: e.target.value }))}
                      placeholder="Descreva o plano de tratamento detalhado..."
                      className="min-h-[200px]"
                    />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Observações Gerais</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={evaluation.notes}
                    onChange={(e) => setEvaluation(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Observações adicionais sobre a avaliação..."
                    className="min-h-[150px]"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
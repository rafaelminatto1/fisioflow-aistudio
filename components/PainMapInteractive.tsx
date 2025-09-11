'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Trash2, Save, RotateCcw } from 'lucide-react'

export interface PainPoint {
  id: string
  x: number
  y: number
  intensity: number
  description: string
  bodyPart: string
  timestamp: Date
}

interface PainMapInteractiveProps {
  patientId?: string
  initialPainPoints?: PainPoint[]
  onSave?: (painPoints: PainPoint[]) => void
  readOnly?: boolean
}

const BODY_PARTS = {
  head: 'Cabeça',
  neck: 'Pescoço',
  shoulder_left: 'Ombro Esquerdo',
  shoulder_right: 'Ombro Direito',
  arm_left: 'Braço Esquerdo',
  arm_right: 'Braço Direito',
  chest: 'Peito',
  back_upper: 'Costas Superior',
  back_lower: 'Lombar',
  abdomen: 'Abdômen',
  hip_left: 'Quadril Esquerdo',
  hip_right: 'Quadril Direito',
  thigh_left: 'Coxa Esquerda',
  thigh_right: 'Coxa Direita',
  knee_left: 'Joelho Esquerdo',
  knee_right: 'Joelho Direito',
  calf_left: 'Panturrilha Esquerda',
  calf_right: 'Panturrilha Direita',
  foot_left: 'Pé Esquerdo',
  foot_right: 'Pé Direito'
}

const getBodyPartFromCoordinates = (x: number, y: number): string => {
  // Simplified body part detection based on coordinates
  // In a real implementation, this would be more sophisticated
  if (y < 15) return 'head'
  if (y < 25) return 'neck'
  if (y < 40) {
    return x < 50 ? 'shoulder_left' : 'shoulder_right'
  }
  if (y < 55) {
    if (x > 35 && x < 65) return 'chest'
    return x < 50 ? 'arm_left' : 'arm_right'
  }
  if (y < 70) {
    if (x > 35 && x < 65) return 'back_upper'
    return x < 50 ? 'arm_left' : 'arm_right'
  }
  if (y < 85) {
    if (x > 35 && x < 65) return 'back_lower'
    return x < 50 ? 'hip_left' : 'hip_right'
  }
  if (y < 100) {
    return x < 50 ? 'thigh_left' : 'thigh_right'
  }
  if (y < 115) {
    return x < 50 ? 'knee_left' : 'knee_right'
  }
  if (y < 130) {
    return x < 50 ? 'calf_left' : 'calf_right'
  }
  return x < 50 ? 'foot_left' : 'foot_right'
}

const getIntensityColor = (intensity: number): string => {
  if (intensity <= 2) return '#22c55e' // green
  if (intensity <= 4) return '#eab308' // yellow
  if (intensity <= 6) return '#f97316' // orange
  if (intensity <= 8) return '#ef4444' // red
  return '#dc2626' // dark red
}

export default function PainMapInteractive({
  patientId,
  initialPainPoints = [],
  onSave,
  readOnly = false
}: PainMapInteractiveProps) {
  const [painPoints, setPainPoints] = useState<PainPoint[]>(initialPainPoints)
  const [selectedPoint, setSelectedPoint] = useState<PainPoint | null>(null)
  const [isAddingPoint, setIsAddingPoint] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  const handleSvgClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly || !isAddingPoint) return

    const svg = svgRef.current
    if (!svg) return

    const rect = svg.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    const bodyPart = getBodyPartFromCoordinates(x, y)
    
    const newPoint: PainPoint = {
      id: `pain_${Date.now()}`,
      x,
      y,
      intensity: 5,
      description: '',
      bodyPart,
      timestamp: new Date()
    }

    setPainPoints(prev => [...prev, newPoint])
    setSelectedPoint(newPoint)
    setIsAddingPoint(false)
  }, [readOnly, isAddingPoint])

  const updateSelectedPoint = (updates: Partial<PainPoint>) => {
    if (!selectedPoint) return

    const updatedPoint = { ...selectedPoint, ...updates }
    setPainPoints(prev => 
      prev.map(point => point.id === selectedPoint.id ? updatedPoint : point)
    )
    setSelectedPoint(updatedPoint)
  }

  const deletePoint = (pointId: string) => {
    setPainPoints(prev => prev.filter(point => point.id !== pointId))
    if (selectedPoint?.id === pointId) {
      setSelectedPoint(null)
    }
  }

  const clearAllPoints = () => {
    setPainPoints([])
    setSelectedPoint(null)
  }

  const handleSave = () => {
    if (onSave) {
      onSave(painPoints)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Body Map */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Mapa de Dor Interativo
              {!readOnly && (
                <div className="flex gap-2">
                  <Button
                    variant={isAddingPoint ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsAddingPoint(!isAddingPoint)}
                  >
                    {isAddingPoint ? 'Cancelar' : 'Adicionar Ponto'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllPoints}
                    disabled={painPoints.length === 0}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Limpar
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative bg-gray-50 rounded-lg p-4">
              <svg
                ref={svgRef}
                viewBox="0 0 100 150"
                className="w-full h-96 cursor-crosshair"
                onClick={handleSvgClick}
              >
                {/* Simple human body outline */}
                <path
                  d="M50 10 C45 10 40 15 40 20 C40 25 45 30 50 30 C55 30 60 25 60 20 C60 15 55 10 50 10 Z"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="1"
                />
                {/* Neck */}
                <line x1="50" y1="30" x2="50" y2="35" stroke="#374151" strokeWidth="2" />
                {/* Torso */}
                <rect x="35" y="35" width="30" height="40" fill="none" stroke="#374151" strokeWidth="1" rx="5" />
                {/* Arms */}
                <line x1="35" y1="45" x2="20" y2="65" stroke="#374151" strokeWidth="2" />
                <line x1="65" y1="45" x2="80" y2="65" stroke="#374151" strokeWidth="2" />
                {/* Legs */}
                <line x1="42" y1="75" x2="42" y2="120" stroke="#374151" strokeWidth="2" />
                <line x1="58" y1="75" x2="58" y2="120" stroke="#374151" strokeWidth="2" />
                {/* Feet */}
                <line x1="42" y1="120" x2="38" y2="125" stroke="#374151" strokeWidth="2" />
                <line x1="58" y1="120" x2="62" y2="125" stroke="#374151" strokeWidth="2" />

                {/* Pain Points */}
                {painPoints.map(point => (
                  <g key={point.id}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="3"
                      fill={getIntensityColor(point.intensity)}
                      stroke="white"
                      strokeWidth="1"
                      className="cursor-pointer hover:r-4 transition-all"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPoint(point)
                      }}
                    />
                    <text
                      x={point.x}
                      y={point.y - 5}
                      textAnchor="middle"
                      className="text-xs font-bold fill-gray-700 pointer-events-none"
                    >
                      {point.intensity}
                    </text>
                  </g>
                ))}
              </svg>
              
              {isAddingPoint && (
                <div className="absolute top-2 left-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  Clique no corpo para adicionar um ponto de dor
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pain Point Details */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Ponto de Dor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPoint ? (
              <>
                <div>
                  <Label>Região do Corpo</Label>
                  <Badge variant="secondary" className="mt-1">
                    {BODY_PARTS[selectedPoint.bodyPart as keyof typeof BODY_PARTS] || selectedPoint.bodyPart}
                  </Badge>
                </div>

                <div>
                  <Label>Intensidade da Dor (1-10)</Label>
                  <div className="mt-2">
                    <Slider
                      value={[selectedPoint.intensity]}
                      onValueChange={([value]) => updateSelectedPoint({ intensity: value })}
                      max={10}
                      min={1}
                      step={1}
                      disabled={readOnly}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Leve</span>
                      <span className="font-semibold">{selectedPoint.intensity}</span>
                      <span>Intensa</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={selectedPoint.description}
                    onChange={(e) => updateSelectedPoint({ description: e.target.value })}
                    placeholder="Descreva a dor (tipo, frequência, fatores que pioram/melhoram...)"
                    disabled={readOnly}
                    className="mt-1"
                  />
                </div>

                {!readOnly && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deletePoint(selectedPoint.id)}
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover Ponto
                  </Button>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                {painPoints.length === 0 ? (
                  <p>Nenhum ponto de dor adicionado.\n{!readOnly && 'Clique em "Adicionar Ponto" para começar.'}</p>
                ) : (
                  <p>Selecione um ponto de dor no mapa para ver os detalhes.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pain Points List */}
        {painPoints.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Pontos de Dor ({painPoints.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {painPoints.map(point => (
                  <div
                    key={point.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPoint?.id === point.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPoint(point)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getIntensityColor(point.intensity) }}
                        />
                        <span className="font-medium text-sm">
                          {BODY_PARTS[point.bodyPart as keyof typeof BODY_PARTS] || point.bodyPart}
                        </span>
                      </div>
                      <Badge variant="outline">{point.intensity}/10</Badge>
                    </div>
                    {point.description && (
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {point.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        {!readOnly && onSave && painPoints.length > 0 && (
          <Button onClick={handleSave} className="w-full mt-4">
            <Save className="w-4 h-4 mr-2" />
            Salvar Mapa de Dor
          </Button>
        )}
      </div>
    </div>
  )
}
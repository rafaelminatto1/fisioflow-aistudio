'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  Save, 
  Wand2, 
  Eye, 
  AlertCircle, 
  CheckCircle,
  Sparkles,
  Target,
  Shield,
  Clock
} from 'lucide-react';

interface CustomExercise {
  name: string;
  description: string;
  instructions: string;
  category: string;
  subcategory: string;
  body_parts: string[];
  difficulty: 'iniciante' | 'intermediario' | 'avancado';
  equipment: string[];
  indications: string[];
  contraindications: string[];
  therapeutic_goals: string;
  duration: number | null;
  video_url: string;
  thumbnail_url: string;
  is_public: boolean;
  tags: string[];
}

interface QualityCheck {
  score: number;
  passed: boolean;
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    field: string;
    message: string;
    severity: number;
  }>;
  recommendations: string[];
}

const CATEGORIES = [
  'fortalecimento', 'alongamento', 'cardio', 'equilibrio', 
  'mobilidade', 'respiratorio', 'neurologico'
];

const BODY_PARTS = [
  'membros superiores', 'membros inferiores', 'tronco', 'pescoço', 'corpo todo',
  'braço', 'antebraço', 'mão', 'ombro', 'punho', 'cotovelo',
  'perna', 'coxa', 'panturrilha', 'pé', 'quadril', 'joelho', 'tornozelo',
  'abdomen', 'lombar', 'dorsal', 'core', 'coluna', 'cervical'
];

const EQUIPMENT = [
  'sem equipamento', 'halteres', 'elástico', 'bola', 'aparelhos', 'acessórios',
  'halter', 'peso', 'dumbbell', 'band', 'theraband', 'swiss ball', 'pilates ball',
  'máquina', 'aparelho', 'equipamento', 'bastão', 'step', 'cone', 'disco'
];

const THERAPEUTIC_GOALS = [
  'fortalecimento muscular', 'flexibilidade', 'coordenação motora',
  'condicionamento cardiorrespiratório', 'reabilitação', 'prevenção',
  'equilíbrio', 'propriocepção', 'resistência', 'mobilidade articular'
];

export default function CustomExerciseBuilder() {
  const [exercise, setExercise] = useState<CustomExercise>({
    name: '',
    description: '',
    instructions: '',
    category: '',
    subcategory: '',
    body_parts: [],
    difficulty: 'intermediario',
    equipment: [],
    indications: [],
    contraindications: [],
    therapeutic_goals: '',
    duration: null,
    video_url: '',
    thumbnail_url: '',
    is_public: false,
    tags: []
  });

  const [qualityCheck, setQualityCheck] = useState<QualityCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [newTag, setNewTag] = useState('');
  const [newIndication, setNewIndication] = useState('');
  const [newContraindication, setNewContraindication] = useState('');

  useEffect(() => {
    // Auto-validate when key fields change
    const timeout = setTimeout(() => {
      if (exercise.name && exercise.description) {
        validateQuality();
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [exercise.name, exercise.description, exercise.instructions]);

  const validateQuality = async () => {
    if (!exercise.name || !exercise.description) return;

    setLoading(true);
    try {
      const response = await fetch('/api/ai/quality-validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise,
          validationLevel: 'standard'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setQualityCheck(data.validation);
      }
    } catch (error) {
      console.error('Quality validation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/exercises/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...exercise,
          author_id: 'current_user_id' // This would come from authentication
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        
        // Reset form
        setExercise({
          name: '',
          description: '',
          instructions: '',
          category: '',
          subcategory: '',
          body_parts: [],
          difficulty: 'intermediario',
          equipment: [],
          indications: [],
          contraindications: [],
          therapeutic_goals: '',
          duration: null,
          video_url: '',
          thumbnail_url: '',
          is_public: false,
          tags: []
        });
        setQualityCheck(null);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Erro ao salvar exercício');
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (newTag && !exercise.tags.includes(newTag)) {
      setExercise(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setExercise(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const addIndication = () => {
    if (newIndication && !exercise.indications.includes(newIndication)) {
      setExercise(prev => ({ ...prev, indications: [...prev.indications, newIndication] }));
      setNewIndication('');
    }
  };

  const removeIndication = (indication: string) => {
    setExercise(prev => ({ ...prev, indications: prev.indications.filter(i => i !== indication) }));
  };

  const addContraindication = () => {
    if (newContraindication && !exercise.contraindications.includes(newContraindication)) {
      setExercise(prev => ({ ...prev, contraindications: [...prev.contraindications, newContraindication] }));
      setNewContraindication('');
    }
  };

  const removeContraindication = (contraindication: string) => {
    setExercise(prev => ({ ...prev, contraindications: prev.contraindications.filter(c => c !== contraindication) }));
  };

  const toggleBodyPart = (bodyPart: string) => {
    setExercise(prev => ({
      ...prev,
      body_parts: prev.body_parts.includes(bodyPart)
        ? prev.body_parts.filter(bp => bp !== bodyPart)
        : [...prev.body_parts, bodyPart]
    }));
  };

  const toggleEquipment = (equipment: string) => {
    setExercise(prev => ({
      ...prev,
      equipment: prev.equipment.includes(equipment)
        ? prev.equipment.filter(eq => eq !== equipment)
        : [...prev.equipment, equipment]
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-blue-600 bg-blue-50';
    if (score >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
              Criador de Exercícios Personalizados
            </CardTitle>
            
            {qualityCheck && (
              <div className="flex items-center gap-2">
                {qualityCheck.score >= 70 ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(qualityCheck.score)}`}>
                  Qualidade: {qualityCheck.score.toFixed(0)}/100
                </span>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Main Form */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Básico</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="therapeutic">Terapêutico</TabsTrigger>
          <TabsTrigger value="media">Mídia & Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="name">Nome do Exercício *</Label>
                <Input
                  id="name"
                  value={exercise.name}
                  onChange={(e) => setExercise(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Flexão de braço modificada"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={exercise.description}
                  onChange={(e) => setExercise(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva os objetivos, benefícios e contexto do exercício..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="instructions">Instruções de Execução</Label>
                <Textarea
                  id="instructions"
                  value={exercise.instructions}
                  onChange={(e) => setExercise(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="1. Posição inicial...
2. Movimento principal...
3. Retorno à posição..."
                  rows={6}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={exercise.category} onValueChange={(value) => setExercise(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="difficulty">Dificuldade</Label>
                  <Select value={exercise.difficulty} onValueChange={(value: string) => setExercise(prev => ({ ...prev, difficulty: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iniciante">Iniciante</SelectItem>
                      <SelectItem value="intermediario">Intermediário</SelectItem>
                      <SelectItem value="avancado">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="duration">Duração (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={exercise.duration || ''}
                    onChange={(e) => setExercise(prev => ({ ...prev, duration: e.target.value ? parseInt(e.target.value) : null }))}
                    placeholder="10"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Partes do Corpo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {BODY_PARTS.map(bodyPart => (
                  <div key={bodyPart} className="flex items-center space-x-2">
                    <Checkbox
                      id={`body-${bodyPart}`}
                      checked={exercise.body_parts.includes(bodyPart)}
                      onCheckedChange={() => toggleBodyPart(bodyPart)}
                    />
                    <Label htmlFor={`body-${bodyPart}`} className="text-sm">
                      {bodyPart}
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {exercise.body_parts.map(part => (
                  <Badge key={part} variant="secondary">
                    {part}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Equipamentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {EQUIPMENT.map(equip => (
                  <div key={equip} className="flex items-center space-x-2">
                    <Checkbox
                      id={`equip-${equip}`}
                      checked={exercise.equipment.includes(equip)}
                      onCheckedChange={() => toggleEquipment(equip)}
                    />
                    <Label htmlFor={`equip-${equip}`} className="text-sm">
                      {equip}
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {exercise.equipment.map(equip => (
                  <Badge key={equip} variant="outline">
                    {equip}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="therapeutic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5" />
                Objetivos Terapêuticos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={exercise.therapeutic_goals} onValueChange={(value) => setExercise(prev => ({ ...prev, therapeutic_goals: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o objetivo principal..." />
                </SelectTrigger>
                <SelectContent>
                  {THERAPEUTIC_GOALS.map(goal => (
                    <SelectItem key={goal} value={goal}>{goal}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Indicações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newIndication}
                  onChange={(e) => setNewIndication(e.target.value)}
                  placeholder="Ex: Dores lombares, fortalecimento do core..."
                  className="flex-1"
                />
                <Button size="sm" onClick={addIndication}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                {exercise.indications.map((indication, index) => (
                  <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded">
                    <span className="text-sm">{indication}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeIndication(indication)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                Contraindicações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newContraindication}
                  onChange={(e) => setNewContraindication(e.target.value)}
                  placeholder="Ex: Lesão aguda no ombro, hipertensão não controlada..."
                  className="flex-1"
                />
                <Button size="sm" onClick={addContraindication}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                {exercise.contraindications.map((contraindication, index) => (
                  <div key={index} className="flex items-center justify-between bg-red-50 p-2 rounded">
                    <span className="text-sm">{contraindication}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeContraindication(contraindication)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <Label htmlFor="video_url">URL do Vídeo Demonstrativo</Label>
                <Input
                  id="video_url"
                  value={exercise.video_url}
                  onChange={(e) => setExercise(prev => ({ ...prev, video_url: e.target.value }))}
                  placeholder="https://example.com/video.mp4"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="thumbnail_url">URL da Imagem/Thumbnail</Label>
                <Input
                  id="thumbnail_url"
                  value={exercise.thumbnail_url}
                  onChange={(e) => setExercise(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Ex: reabilitação, alongamento..."
                    className="flex-1"
                  />
                  <Button size="sm" onClick={addTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {exercise.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ✕
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_public"
                  checked={exercise.is_public}
                  onCheckedChange={(checked) => setExercise(prev => ({ ...prev, is_public: !!checked }))}
                />
                <Label htmlFor="is_public">Tornar público (outros usuários poderão ver)</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quality Check Display */}
      {qualityCheck && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              Validação de Qualidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Pontuação de Qualidade:</span>
              <span className={`px-3 py-1 rounded-full font-bold ${getScoreColor(qualityCheck.score)}`}>
                {qualityCheck.score.toFixed(0)}/100
              </span>
            </div>

            {qualityCheck.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Problemas Identificados:</h4>
                {qualityCheck.issues.map((issue, index) => (
                  <div key={index} className={`p-3 rounded border-l-4 ${
                    issue.type === 'error' ? 'bg-red-50 border-red-400' :
                    issue.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                    'bg-blue-50 border-blue-400'
                  }`}>
                    <div className="flex items-center gap-2">
                      {issue.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                      {issue.type === 'warning' && <Clock className="w-4 h-4 text-yellow-600" />}
                      {issue.type === 'info' && <Eye className="w-4 h-4 text-blue-600" />}
                      <span className="text-sm font-medium">
                        {issue.field}: {issue.message}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {qualityCheck.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Recomendações:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {qualityCheck.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-600">{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={validateQuality} disabled={loading}>
          <Wand2 className="w-4 h-4 mr-2" />
          {loading ? 'Validando...' : 'Validar Qualidade'}
        </Button>

        <Button onClick={handleSave} disabled={saving || !exercise.name || !exercise.description}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Exercício'}
        </Button>
      </div>
    </div>
  );
}
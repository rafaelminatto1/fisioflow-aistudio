'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap, 
  Target, 
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  BarChart3
} from 'lucide-react';

interface CategoryPrediction {
  category: string;
  subcategory?: string;
  confidence: number;
  reasoning: string;
}

interface ExerciseAnalysis {
  categories: CategoryPrediction[];
  suggestedBodyParts: string[];
  suggestedEquipment: string[];
  estimatedDifficulty: string;
  therapeuticGoals: string[];
  contraindications: string[];
  confidence: number;
}

interface ExerciseApproval {
  id: string;
  exercise_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  ai_analysis: string;
  submitted_at: string;
  exercises: {
    name: string;
    description: string;
  };
}

export default function AICategorization() {
  const [approvals, setApprovals] = useState<ExerciseApproval[]>([]);
  interface AIStats {
    totalProcessed: number;
    pendingApprovals: number;
    approvedCount: number;
    rejectedCount: number;
    averageConfidence: number;
  }

  const [stats, setStats] = useState<AIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<ExerciseApproval | null>(null);
  const [reviewComments, setReviewComments] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    loadApprovals();
    loadStats();
  }, []);

  const loadApprovals = async () => {
    try {
      const response = await fetch('/api/ai/categorize-batch?action=pending-approvals');
      const data = await response.json();
      
      if (data.success) {
        setApprovals(data.approvals);
      }
    } catch (error) {
      console.error('Error loading approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/ai/categorize-batch?action=stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleApprovalAction = async (approvalId: string, action: 'approve' | 'reject' | 'needs_revision') => {
    try {
      const response = await fetch('/api/exercise-approvals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approvalId,
          action,
          comments: reviewComments
        }),
      });

      if (response.ok) {
        // Reload approvals
        await loadApprovals();
        await loadStats();
        setSelectedApproval(null);
        setReviewComments('');
      }
    } catch (error) {
      console.error('Error updating approval:', error);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckCircle className="w-4 h-4" />;
    if (confidence >= 60) return <Clock className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  const renderAnalysis = (analysisStr: string) => {
    try {
      const analysis: ExerciseAnalysis = JSON.parse(analysisStr);
      
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {getConfidenceIcon(analysis.confidence)}
            <span className={`px-2 py-1 rounded-md text-sm font-medium ${getConfidenceColor(analysis.confidence)}`}>
              {analysis.confidence.toFixed(1)}% de confiança
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categorias */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Categorias Sugeridas
              </h4>
              <div className="space-y-2">
                {analysis.categories.slice(0, 3).map((cat, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{cat.category}</span>
                      <Badge variant="outline" className="text-xs">
                        {cat.confidence.toFixed(0)}%
                      </Badge>
                    </div>
                    {cat.subcategory && (
                      <div className="text-xs text-gray-600 mt-1">
                        Subcategoria: {cat.subcategory}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {cat.reasoning}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Características */}
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm mb-1">Partes do Corpo</h4>
                <div className="flex flex-wrap gap-1">
                  {analysis.suggestedBodyParts.map((part, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {part}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-1">Equipamentos</h4>
                <div className="flex flex-wrap gap-1">
                  {analysis.suggestedEquipment.map((equip, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {equip}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-1">Dificuldade</h4>
                <Badge 
                  variant={
                    analysis.estimatedDifficulty === 'iniciante' ? 'default' :
                    analysis.estimatedDifficulty === 'intermediario' ? 'secondary' : 'destructive'
                  }
                  className="text-xs"
                >
                  {analysis.estimatedDifficulty}
                </Badge>
              </div>
            </div>
          </div>

          {/* Objetivos Terapêuticos */}
          {analysis.therapeuticGoals.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Objetivos Terapêuticos</h4>
              <div className="flex flex-wrap gap-1">
                {analysis.therapeuticGoals.map((goal, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {goal}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Contraindicações */}
          {analysis.contraindications.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2 text-red-600">Contraindicações</h4>
              <div className="flex flex-wrap gap-1">
                {analysis.contraindications.map((contra, index) => (
                  <Badge key={index} variant="destructive" className="text-xs">
                    {contra}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    } catch (error) {
      return <div className="text-red-500 text-sm">Erro ao analisar dados da IA</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Categorizado</p>
                  <p className="text-2xl font-bold">{stats.totalCategorized.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Últimas 24h</p>
                  <p className="text-2xl font-bold">{stats.recentCategorizations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Aguardando Aprovação</p>
                  <p className="text-2xl font-bold">{approvals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="approved">Aprovados</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {approvals.filter(a => a.status === 'pending').length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma aprovação pendente</h3>
                <p className="text-gray-600">Todos os exercícios foram revisados!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {approvals.filter(a => a.status === 'pending').map((approval) => (
                <Card key={approval.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{approval.exercises.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {approval.exercises.description.substring(0, 150)}...
                        </p>
                      </div>
                      <Badge className="ml-2">
                        {new Date(approval.submitted_at).toLocaleDateString()}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderAnalysis(approval.ai_analysis)}
                    
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      <Button
                        size="sm"
                        onClick={() => handleApprovalAction(approval.id, 'approve')}
                        className="flex items-center gap-2"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleApprovalAction(approval.id, 'reject')}
                        className="flex items-center gap-2"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        Rejeitar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprovalAction(approval.id, 'needs_revision')}
                        className="flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Precisa Revisão
                      </Button>
                    </div>

                    <div className="mt-3">
                      <Textarea
                        placeholder="Comentários da revisão (opcional)..."
                        value={reviewComments}
                        onChange={(e) => setReviewComments(e.target.value)}
                        className="text-sm"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Exercícios Aprovados</h3>
              <p className="text-gray-600">Funcionalidade em desenvolvimento</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardContent className="p-8 text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Exercícios Rejeitados</h3>
              <p className="text-gray-600">Funcionalidade em desenvolvimento</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
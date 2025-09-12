"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Target, TrendingUp } from 'lucide-react';

interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  category: 'revenue' | 'expense' | 'investment' | 'emergency';
  status: 'active' | 'completed' | 'paused';
}

export default function FinancialGoals() {
  const [goals, setGoals] = useState<FinancialGoal[]>([
    {
      id: '1',
      title: 'Meta de Receita Mensal',
      targetAmount: 50000,
      currentAmount: 32000,
      deadline: new Date('2024-12-31'),
      category: 'revenue',
      status: 'active'
    },
    {
      id: '2',
      title: 'Reserva de Emergência',
      targetAmount: 100000,
      currentAmount: 45000,
      deadline: new Date('2024-06-30'),
      category: 'emergency',
      status: 'active'
    }
  ]);

  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    targetAmount: 0,
    category: 'revenue' as FinancialGoal['category'],
    deadline: ''
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      revenue: 'bg-green-500',
      expense: 'bg-red-500',
      investment: 'bg-blue-500',
      emergency: 'bg-yellow-500'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      revenue: 'Receita',
      expense: 'Despesa',
      investment: 'Investimento',
      emergency: 'Emergência'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const addGoal = () => {
    if (!newGoal.title || !newGoal.targetAmount || !newGoal.deadline) return;

    const goal: FinancialGoal = {
      id: Date.now().toString(),
      title: newGoal.title,
      targetAmount: newGoal.targetAmount,
      currentAmount: 0,
      deadline: new Date(newGoal.deadline),
      category: newGoal.category,
      status: 'active'
    };

    setGoals([...goals, goal]);
    setNewGoal({ title: '', targetAmount: 0, category: 'revenue', deadline: '' });
    setIsAddingGoal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Metas Financeiras</h2>
        <Button onClick={() => setIsAddingGoal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nova Meta
        </Button>
      </div>

      {isAddingGoal && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Nova Meta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Título da meta"
              value={newGoal.title}
              onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Valor alvo"
              value={newGoal.targetAmount || ''}
              onChange={(e) => setNewGoal({ ...newGoal, targetAmount: Number(e.target.value) })}
            />
            <select
              className="w-full p-2 border rounded"
              value={newGoal.category}
              onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as FinancialGoal['category'] })}
            >
              <option value="revenue">Receita</option>
              <option value="expense">Despesa</option>
              <option value="investment">Investimento</option>
              <option value="emergency">Emergência</option>
            </select>
            <Input
              type="date"
              value={newGoal.deadline}
              onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
            />
            <div className="flex gap-2">
              <Button onClick={addGoal}>Criar Meta</Button>
              <Button variant="outline" onClick={() => setIsAddingGoal(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {goals.map((goal) => {
          const progress = getProgressPercentage(goal.currentAmount, goal.targetAmount);
          const isCompleted = progress >= 100;
          const daysLeft = Math.ceil((goal.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

          return (
            <Card key={goal.id} className={isCompleted ? 'border-green-200 bg-green-50' : ''}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      {goal.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getCategoryColor(goal.category)}>
                        {getCategoryLabel(goal.category)}
                      </Badge>
                      {isCompleted && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Concluída
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(goal.currentAmount)}
                    </p>
                    <p className="text-sm text-gray-500">
                      de {formatCurrency(goal.targetAmount)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>
                    {daysLeft > 0 ? `${daysLeft} dias restantes` : 'Prazo vencido'}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {goal.deadline.toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export { FinancialGoals };
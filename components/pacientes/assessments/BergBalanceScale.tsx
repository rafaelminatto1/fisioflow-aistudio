'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AssessmentResult, StandardizedAssessment } from '@/types';

interface BergBalanceScaleProps {
  patientId: string;
  appointmentId?: string;
  onComplete: (result: Partial<AssessmentResult>) => void;
  onCancel: () => void;
}

const BERG_ITEMS = [
  {
    id: 1,
    title: 'Sentado para em pé',
    instruction: 'INSTRUÇÕES: Por favor, levante-se. Tente não usar suas mãos para apoio.',
    scoring: [
      { score: 4, description: 'Capaz de levantar-se sem usar as mãos e estabilizar-se independentemente' },
      { score: 3, description: 'Capaz de levantar-se independentemente usando as mãos' },
      { score: 2, description: 'Capaz de levantar-se usando as mãos após diversas tentativas' },
      { score: 1, description: 'Necessita ajuda mínima para levantar-se ou estabilizar-se' },
      { score: 0, description: 'Necessita ajuda moderada ou máxima para levantar-se' }
    ]
  },
  {
    id: 2,
    title: 'Permanecer em pé sem apoio',
    instruction: 'INSTRUÇÕES: Por favor, fique em pé por 2 minutos sem se apoiar.',
    scoring: [
      { score: 4, description: 'Capaz de permanecer em pé com segurança por 2 minutos' },
      { score: 3, description: 'Capaz de permanecer em pé por 2 minutos sob supervisão' },
      { score: 2, description: 'Capaz de permanecer em pé por 30 segundos sem apoio' },
      { score: 1, description: 'Necessita várias tentativas para permanecer em pé por 30 segundos sem apoio' },
      { score: 0, description: 'Incapaz de ficar em pé por 30 segundos sem ajuda' }
    ]
  },
  {
    id: 3,
    title: 'Permanecer sentado sem apoio nas costas, mas com os pés apoiados no chão ou num banquinho',
    instruction: 'INSTRUÇÕES: Por favor, fique sentado sem apoiar as costas com os braços cruzados por 2 minutos.',
    scoring: [
      { score: 4, description: 'Capaz de sentar-se com segurança e com firmeza por 2 minutos' },
      { score: 3, description: 'Capaz de sentar-se por 2 minutos sob supervisão' },
      { score: 2, description: 'Capaz de sentar-se por 30 segundos' },
      { score: 1, description: 'Capaz de sentar-se por 10 segundos' },
      { score: 0, description: 'Incapaz de sentar-se sem apoio durante 10 segundos' }
    ]
  },
  {
    id: 4,
    title: 'De pé para sentado',
    instruction: 'INSTRUÇÕES: Por favor, sente-se.',
    scoring: [
      { score: 4, description: 'Senta-se com segurança com uso mínimo das mãos' },
      { score: 3, description: 'Controla a descida utilizando as mãos' },
      { score: 2, description: 'Utiliza a parte posterior das pernas contra a cadeira para controlar a descida' },
      { score: 1, description: 'Senta-se independentemente, mas tem descida descontrolada' },
      { score: 0, description: 'Necessita ajuda para sentar-se' }
    ]
  },
  {
    id: 5,
    title: 'Transferências',
    instruction: 'INSTRUÇÕES: Arranje as cadeiras perpendicularmente ou uma de frente para a outra para uma transferência em pivô. Peça ao paciente para transferir-se de uma cadeira com apoio de braço para uma cadeira sem apoio de braço, e vice-versa. Você poderá utilizar duas cadeiras (uma com e outra sem apoio de braço) ou uma cama e uma cadeira.',
    scoring: [
      { score: 4, description: 'Capaz de transferir-se com segurança com uso mínimo das mãos' },
      { score: 3, description: 'Capaz de transferir-se com segurança com o uso das mãos' },
      { score: 2, description: 'Capaz de transferir-se seguindo orientações verbais e/ou supervisão' },
      { score: 1, description: 'Necessita uma pessoa para ajudar' },
      { score: 0, description: 'Necessita duas pessoas para ajudar ou supervisionar para realizar a tarefa com segurança' }
    ]
  },
  {
    id: 6,
    title: 'Permanecer em pé sem apoio com os olhos fechados',
    instruction: 'INSTRUÇÕES: Por favor, feche os olhos e permaneça parado por 10 segundos.',
    scoring: [
      { score: 4, description: 'Capaz de permanecer em pé por 10 segundos com segurança' },
      { score: 3, description: 'Capaz de permanecer em pé por 10 segundos com supervisão' },
      { score: 2, description: 'Capaz de permanecer em pé por 3 segundos' },
      { score: 1, description: 'Incapaz de permanecer com os olhos fechados durante 3 segundos, mas mantém-se em pé' },
      { score: 0, description: 'Necessita ajuda para não cair' }
    ]
  },
  {
    id: 7,
    title: 'Permanecer em pé sem apoio com os pés juntos',
    instruction: 'INSTRUÇÕES: Junte seus pés e permaneça em pé sem se apoiar.',
    scoring: [
      { score: 4, description: 'Capaz de colocar os pés juntos independentemente e permanecer por 1 minuto com segurança' },
      { score: 3, description: 'Capaz de colocar os pés juntos independentemente e permanecer por 1 minuto com supervisão' },
      { score: 2, description: 'Capaz de colocar os pés juntos independentemente, mas incapaz de permanecer por 30 segundos' },
      { score: 1, description: 'Necessita ajuda para posicionar-se, mas é capaz de permanecer com os pés juntos por 15 segundos' },
      { score: 0, description: 'Necessita ajuda para posicionar-se e é incapaz de permanecer nessa posição por 15 segundos' }
    ]
  }
];

export default function BergBalanceScale({ 
  patientId, 
  appointmentId, 
  onComplete, 
  onCancel 
}: BergBalanceScaleProps) {
  const [currentItem, setCurrentItem] = useState(0);
  const [responses, setResponses] = useState<{ [key: number]: number }>({});
  const [showInstructions, setShowInstructions] = useState(true);

  const handleScoreSelect = (itemId: number, score: number) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: score
    }));
  };

  const handleNext = () => {
    if (currentItem < BERG_ITEMS.length - 1) {
      setCurrentItem(currentItem + 1);
      setShowInstructions(true);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentItem > 0) {
      setCurrentItem(currentItem - 1);
      setShowInstructions(true);
    }
  };

  const handleComplete = () => {
    const totalScore = Object.values(responses).reduce((sum, score) => sum + score, 0);
    const maxScore = BERG_ITEMS.length * 4;
    
    let interpretation = '';
    if (totalScore >= 56) {
      interpretation = 'Baixo risco de quedas';
    } else if (totalScore >= 54) {
      interpretation = 'Risco moderado de quedas';
    } else if (totalScore >= 46) {
      interpretation = 'Alto risco de quedas';
    } else {
      interpretation = 'Risco muito alto de quedas';
    }

    const result: Partial<AssessmentResult> = {
      patientId,
      appointmentId,
      responses,
      score: totalScore,
      interpretation,
      notes: `Pontuação: ${totalScore}/${maxScore} pontos. ${interpretation}.`
    };

    onComplete(result);
  };

  const currentBergItem = BERG_ITEMS[currentItem];
  const totalScore = Object.values(responses).reduce((sum, score) => sum + score, 0);
  const progress = ((currentItem + 1) / BERG_ITEMS.length) * 100;
  const isCurrentItemCompleted = responses[currentBergItem.id] !== undefined;
  const completedItems = Object.keys(responses).length;

  if (showInstructions && currentItem === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">Escala de Berg</Badge>
            Avaliação do Equilíbrio Funcional
          </CardTitle>
          <CardDescription>
            A Escala de Berg avalia o equilíbrio funcional através de 14 itens que representam tarefas funcionais comuns.
            Cada item é pontuado de 0 a 4 pontos, totalizando 56 pontos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Instruções Gerais:</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Demonstre cada tarefa e/ou dê instruções verbalmente</li>
              <li>Ao pontuar, registre a menor resposta aplicável a cada item</li>
              <li>Na maioria dos itens, pede-se ao paciente para manter uma determinada posição por um tempo específico</li>
              <li>Progressivamente mais pontos são deduzidos se o tempo ou a distância não forem atingidos</li>
              <li>É importante que fique claro para os pacientes que eles devem manter o equilíbrio enquanto executam as tarefas</li>
            </ul>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Critérios de Pontuação:</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li><strong>4 pontos:</strong> Independente</li>
              <li><strong>3 pontos:</strong> Independente com supervisão</li>
              <li><strong>2 pontos:</strong> Independente com assistência mínima</li>
              <li><strong>1 ponto:</strong> Necessita assistência moderada</li>
              <li><strong>0 pontos:</strong> Necessita assistência máxima ou incapaz</li>
            </ul>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={() => setShowInstructions(false)}>
              Iniciar Avaliação
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline">Item {currentItem + 1}/14</Badge>
              {currentBergItem.title}
            </CardTitle>
            <CardDescription className="mt-2">
              Escala de Berg - Avaliação do Equilíbrio Funcional
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Progresso</div>
            <div className="text-2xl font-bold">{Math.round(progress)}%</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <Progress value={progress} className="w-full" />

        {/* Current Score */}
        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
          <span className="font-medium">Pontuação atual:</span>
          <span className="text-xl font-bold">{totalScore}/56</span>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Instruções:</h3>
          <p className="text-sm">{currentBergItem.instruction}</p>
        </div>

        {/* Scoring Options */}
        <div className="space-y-3">
          <h3 className="font-semibold">Selecione a pontuação:</h3>
          {currentBergItem.scoring.map((option) => (
            <Card 
              key={option.score}
              className={`cursor-pointer transition-all ${
                responses[currentBergItem.id] === option.score 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleScoreSelect(currentBergItem.id, option.score)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Badge 
                      variant={responses[currentBergItem.id] === option.score ? "default" : "outline"}
                      className="text-lg px-3 py-1"
                    >
                      {option.score}
                    </Badge>
                  </div>
                  <div className="text-sm leading-relaxed">
                    {option.description}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6">
          <div className="text-sm text-muted-foreground">
            {completedItems} de {BERG_ITEMS.length} itens completados
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onCancel}
            >
              Cancelar
            </Button>
            
            {currentItem > 0 && (
              <Button 
                variant="outline" 
                onClick={handlePrevious}
              >
                Anterior
              </Button>
            )}
            
            <Button 
              onClick={handleNext}
              disabled={!isCurrentItemCompleted}
            >
              {currentItem === BERG_ITEMS.length - 1 ? 'Finalizar' : 'Próximo'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
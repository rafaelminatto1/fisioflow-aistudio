'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AssessmentResult } from '@/types';
import { TimerIcon, PlayIcon, PauseIcon, RotateCcwIcon } from 'lucide-react';

interface TimedUpAndGoProps {
  patientId: string;
  appointmentId?: string;
  onComplete: (result: Partial<AssessmentResult>) => void;
  onCancel: () => void;
}

export default function TimedUpAndGo({ 
  patientId, 
  appointmentId, 
  onComplete, 
  onCancel 
}: TimedUpAndGoProps) {
  const [currentStep, setCurrentStep] = useState<'instructions' | 'preparation' | 'testing' | 'results'>('instructions');
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<{
    trial1?: number;
    trial2?: number;
    trial3?: number;
    bestTime?: number;
    riskLevel?: string;
    notes?: string;
  }>({});
  const [currentTrial, setCurrentTrial] = useState(1);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isRunning) {
      intervalId = setInterval(() => setTimer(timer => timer + 1), 10);
    }
    return () => clearInterval(intervalId);
  }, [isRunning]);

  const formatTime = (centiseconds: number) => {
    const seconds = Math.floor(centiseconds / 100);
    const cs = centiseconds % 100;
    return `${seconds}.${cs.toString().padStart(2, '0')}s`;
  };

  const startTimer = () => {
    setTimer(0);
    setIsRunning(true);
  };

  const stopTimer = () => {
    setIsRunning(false);
    const currentTime = timer / 100; // Convert to seconds
    
    const newResults = {
      ...testResults,
      [`trial${currentTrial}`]: currentTime
    };
    
    setTestResults(newResults);
    
    if (currentTrial < 3) {
      setCurrentTrial(currentTrial + 1);
    } else {
      // Calculate best time and risk assessment
      const times = [newResults.trial1!, newResults.trial2!, newResults.trial3!];
      const bestTime = Math.min(...times);
      
      let riskLevel = '';
      let interpretation = '';
      
      if (bestTime < 10) {
        riskLevel = 'Baixo risco';
        interpretation = 'Mobilidade normal para adultos saudáveis';
      } else if (bestTime <= 13.5) {
        riskLevel = 'Risco baixo a moderado';
        interpretation = 'Mobilidade adequada, mas necessita monitoramento';
      } else if (bestTime <= 20) {
        riskLevel = 'Alto risco';
        interpretation = 'Risco aumentado de quedas, necessita intervenção';
      } else {
        riskLevel = 'Risco muito alto';
        interpretation = 'Risco muito alto de quedas, necessita intervenção imediata';
      }
      
      const finalResults = {
        ...newResults,
        bestTime,
        riskLevel,
        interpretation
      };
      
      setTestResults(finalResults);
      setCurrentStep('results');
    }
  };

  const resetTimer = () => {
    setTimer(0);
    setIsRunning(false);
  };

  const handleComplete = () => {
    const result: Partial<AssessmentResult> = {
      patientId,
      appointmentId,
      responses: {
        trial1: testResults.trial1,
        trial2: testResults.trial2,
        trial3: testResults.trial3,
        bestTime: testResults.bestTime,
        notes: testResults.notes
      },
      score: testResults.bestTime,
      interpretation: testResults.riskLevel,
      notes: `Teste TUG - Melhor tempo: ${testResults.bestTime?.toFixed(2)}s. ${testResults.riskLevel}. ${testResults.notes || ''}`
    };

    onComplete(result);
  };

  const renderInstructions = () => (
    <CardContent className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Descrição do Teste:</h3>
        <p className="text-sm mb-3">
          O Teste Timed Up and Go (TUG) avalia a mobilidade funcional e o risco de quedas. 
          É um teste simples, rápido e amplamente utilizado na prática clínica.
        </p>
        <p className="text-sm">
          O paciente deve se levantar de uma cadeira, caminhar 3 metros, dar a volta, 
          retornar e sentar-se novamente, o mais rápido e seguro possível.
        </p>
      </div>

      <div className="bg-amber-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Equipamentos Necessários:</h3>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Cadeira com braços (altura do assento: 46cm)</li>
          <li>Cronômetro</li>
          <li>Fita métrica ou cone para marcar 3 metros</li>
          <li>Espaço livre de pelo menos 3 metros</li>
        </ul>
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Instruções para o Paciente:</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Sente-se na cadeira com as costas apoiadas</li>
          <li>Ao comando "VÁ", levante-se da cadeira</li>
          <li>Caminhe normalmente até a marca de 3 metros</li>
          <li>Gire 180° (meia volta)</li>
          <li>Caminhe de volta até a cadeira</li>
          <li>Sente-se novamente com as costas apoiadas</li>
        </ol>
      </div>

      <div className="bg-red-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Critérios de Interrupção:</h3>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Risco iminente de queda</li>
          <li>Desequilíbrio significativo</li>
          <li>Solicitação do paciente para parar</li>
          <li>Qualquer sinal de desconforto ou dor</li>
        </ul>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={() => setCurrentStep('preparation')}>
          Continuar para Preparação
        </Button>
      </div>
    </CardContent>
  );

  const renderPreparation = () => (
    <CardContent className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Preparação do Teste:</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="chair" className="rounded" />
            <label htmlFor="chair" className="text-sm">Cadeira posicionada e segura</label>
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="distance" className="rounded" />
            <label htmlFor="distance" className="text-sm">Distância de 3 metros marcada</label>
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="space" className="rounded" />
            <label htmlFor="space" className="text-sm">Espaço livre e seguro</label>
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="patient" className="rounded" />
            <label htmlFor="patient" className="text-sm">Paciente orientado e pronto</label>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Lembrete Importante:</h3>
        <p className="text-sm">
          Realize <strong>3 tentativas</strong> e registre o melhor tempo. 
          Permita descanso entre as tentativas se necessário. Mantenha-se próximo ao paciente para garantir a segurança.
        </p>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep('instructions')}>
          Voltar
        </Button>
        <Button onClick={() => setCurrentStep('testing')}>
          Iniciar Teste
        </Button>
      </div>
    </CardContent>
  );

  const renderTesting = () => (
    <CardContent className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Tentativa {currentTrial}/3</h3>
        <div className="text-6xl font-mono font-bold mb-4">
          {formatTime(timer)}
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        <Button
          onClick={startTimer}
          disabled={isRunning}
          size="lg"
          className="flex items-center gap-2"
        >
          <PlayIcon className="h-5 w-5" />
          Iniciar
        </Button>
        
        <Button
          onClick={stopTimer}
          disabled={!isRunning}
          size="lg"
          variant="destructive"
          className="flex items-center gap-2"
        >
          <PauseIcon className="h-5 w-5" />
          Parar
        </Button>
        
        <Button
          onClick={resetTimer}
          disabled={isRunning}
          size="lg"
          variant="outline"
          className="flex items-center gap-2"
        >
          <RotateCcwIcon className="h-5 w-5" />
          Reset
        </Button>
      </div>

      {/* Previous Results */}
      {(testResults.trial1 || testResults.trial2) && (
        <div className="bg-slate-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Resultados Anteriores:</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            {testResults.trial1 && (
              <div>
                <div className="text-sm text-muted-foreground">Tentativa 1</div>
                <div className="font-mono font-bold">{testResults.trial1.toFixed(2)}s</div>
              </div>
            )}
            {testResults.trial2 && (
              <div>
                <div className="text-sm text-muted-foreground">Tentativa 2</div>
                <div className="font-mono font-bold">{testResults.trial2.toFixed(2)}s</div>
              </div>
            )}
            {testResults.trial3 && (
              <div>
                <div className="text-sm text-muted-foreground">Tentativa 3</div>
                <div className="font-mono font-bold">{testResults.trial3.toFixed(2)}s</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep('preparation')}>
          Voltar
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancelar Teste
        </Button>
      </div>
    </CardContent>
  );

  const renderResults = () => (
    <CardContent className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-2">Resultados do Teste TUG</h3>
        <div className="text-4xl font-mono font-bold mb-2">
          {testResults.bestTime?.toFixed(2)}s
        </div>
        <Badge 
          variant={testResults.riskLevel?.includes('Baixo') ? 'default' : 
                   testResults.riskLevel?.includes('moderado') ? 'secondary' : 'destructive'}
          className="text-lg px-4 py-1"
        >
          {testResults.riskLevel}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <div className="text-sm text-muted-foreground">Tentativa 1</div>
          <div className="font-mono font-bold text-lg">{testResults.trial1?.toFixed(2)}s</div>
        </div>
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <div className="text-sm text-muted-foreground">Tentativa 2</div>
          <div className="font-mono font-bold text-lg">{testResults.trial2?.toFixed(2)}s</div>
        </div>
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <div className="text-sm text-muted-foreground">Tentativa 3</div>
          <div className="font-mono font-bold text-lg">{testResults.trial3?.toFixed(2)}s</div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">Interpretação:</h4>
        <p className="text-sm mb-2">{testResults.interpretation}</p>
        <div className="text-xs text-muted-foreground">
          <strong>Valores de Referência:</strong>
          <br />• {'<'} 10s: Baixo risco (adultos saudáveis)
          <br />• 10-13.5s: Risco baixo a moderado
          <br />• 14-20s: Alto risco de quedas
          <br />• {'>'} 20s: Risco muito alto de quedas
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações adicionais:</Label>
        <Input
          id="notes"
          placeholder="Digite observações sobre o teste (opcional)..."
          value={testResults.notes || ''}
          onChange={(e) => setTestResults(prev => ({ ...prev, notes: e.target.value }))}
        />
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep('testing')}>
          Refazer Teste
        </Button>
        <Button onClick={handleComplete}>
          Salvar Resultado
        </Button>
      </div>
    </CardContent>
  );

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Badge variant="outline">
            <TimerIcon className="h-4 w-4 mr-1" />
            TUG
          </Badge>
          Timed Up and Go Test
        </CardTitle>
        <CardDescription>
          Avaliação da mobilidade funcional e risco de quedas
        </CardDescription>
      </CardHeader>

      {currentStep === 'instructions' && renderInstructions()}
      {currentStep === 'preparation' && renderPreparation()}
      {currentStep === 'testing' && renderTesting()}
      {currentStep === 'results' && renderResults()}
    </Card>
  );
}
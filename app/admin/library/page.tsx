'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { 
  PlusIcon,
  BookOpenIcon,
  FlaskConicalIcon,
  ActivityIcon,
  StethoscopeIcon,
  SearchIcon
} from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function ClinicalLibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const libraryStats = {
    pathologies: 25,
    protocols: 48,
    exercises: 156,
    assessments: 12
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Biblioteca de Conteúdo Clínico"
        description="Gerencie patologias, protocolos de tratamento, exercícios e avaliações padronizadas"
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patologias</CardTitle>
            <StethoscopeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{libraryStats.pathologies}</div>
            <p className="text-xs text-muted-foreground">+3 este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Protocolos</CardTitle>
            <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{libraryStats.protocols}</div>
            <p className="text-xs text-muted-foreground">+7 este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exercícios</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{libraryStats.exercises}</div>
            <p className="text-xs text-muted-foreground">+12 este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliações</CardTitle>
            <FlaskConicalIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{libraryStats.assessments}</div>
            <p className="text-xs text-muted-foreground">+2 este mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por patologias, protocolos, exercícios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="pathologies" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pathologies">Patologias</TabsTrigger>
          <TabsTrigger value="protocols">Protocolos</TabsTrigger>
          <TabsTrigger value="exercises">Exercícios</TabsTrigger>
          <TabsTrigger value="assessments">Avaliações</TabsTrigger>
        </TabsList>

        <TabsContent value="pathologies" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Patologias</h3>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Nova Patologia
            </Button>
          </div>
          
          <div className="grid gap-4">
            <PathologyCard
              name="Gonalgia"
              description="Dor no joelho de origem traumática ou degenerativa"
              icd10="M25.561"
              protocols={3}
              symptoms={["Dor", "Rigidez", "Inchaço"]}
            />
            <PathologyCard
              name="Lombalgia"
              description="Dor na região lombar da coluna vertebral"
              icd10="M54.5"
              protocols={5}
              symptoms={["Dor lombar", "Limitação de movimento", "Espasmo muscular"]}
            />
          </div>
        </TabsContent>

        <TabsContent value="protocols" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Protocolos de Tratamento</h3>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Novo Protocolo
            </Button>
          </div>

          <div className="grid gap-4">
            <ProtocolCard
              name="Protocolo para Gonalgia Aguda"
              pathology="Gonalgia"
              frequency="3x por semana"
              duration="8-12 semanas"
              exercises={12}
            />
            <ProtocolCard
              name="Reabilitação Lombar - Fase Inicial"
              pathology="Lombalgia"
              frequency="2x por semana"
              duration="6-8 semanas"
              exercises={8}
            />
          </div>
        </TabsContent>

        <TabsContent value="exercises" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Exercícios</h3>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Novo Exercício
            </Button>
          </div>

          <div className="grid gap-4">
            <ExerciseCard
              name="Agachamento Isométrico na Parede"
              category="Fortalecimento"
              difficulty={2}
              bodyParts={["Quadríceps", "Glúteos"]}
              hasVideo={true}
            />
            <ExerciseCard
              name="Ponte Glútea"
              category="Fortalecimento"
              difficulty={1}
              bodyParts={["Glúteos", "Isquiotibiais"]}
              hasVideo={true}
            />
          </div>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Avaliações Padronizadas</h3>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Nova Avaliação
            </Button>
          </div>

          <div className="grid gap-4">
            <AssessmentCard
              name="Escala de Berg"
              type="Escala"
              category="Equilíbrio"
              description="Avaliação do equilíbrio funcional em idosos"
            />
            <AssessmentCard
              name="Teste Timed Up and Go (TUG)"
              type="Teste Funcional"
              category="Mobilidade"
              description="Avaliação da mobilidade funcional e risco de quedas"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PathologyCard({ 
  name, 
  description, 
  icd10, 
  protocols, 
  symptoms 
}: { 
  name: string; 
  description: string; 
  icd10: string; 
  protocols: number; 
  symptoms: string[];
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{name}</CardTitle>
            <CardDescription className="mt-2">{description}</CardDescription>
          </div>
          <Badge variant="outline">CID-10: {icd10}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-muted-foreground">Sintomas:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {symptoms.map((symptom, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {symptom}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {protocols} protocolos disponíveis
            </span>
            <div className="space-x-2">
              <Button variant="outline" size="sm">Editar</Button>
              <Button variant="outline" size="sm">Ver Protocolos</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProtocolCard({ 
  name, 
  pathology, 
  frequency, 
  duration, 
  exercises 
}: { 
  name: string; 
  pathology: string; 
  frequency: string; 
  duration: string; 
  exercises: number;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{name}</CardTitle>
        <CardDescription>Para {pathology}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <span className="text-sm font-medium text-muted-foreground">Frequência:</span>
            <p className="text-sm">{frequency}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Duração:</span>
            <p className="text-sm">{duration}</p>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {exercises} exercícios
          </span>
          <div className="space-x-2">
            <Button variant="outline" size="sm">Editar</Button>
            <Button variant="outline" size="sm">Ver Exercícios</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ExerciseCard({ 
  name, 
  category, 
  difficulty, 
  bodyParts, 
  hasVideo 
}: { 
  name: string; 
  category: string; 
  difficulty: number; 
  bodyParts: string[];
  hasVideo: boolean;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{name}</CardTitle>
            <CardDescription>{category}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {hasVideo && <Badge variant="outline">📹 Vídeo</Badge>}
            <Badge variant="outline">
              Dificuldade: {'★'.repeat(difficulty)}{'☆'.repeat(5-difficulty)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-muted-foreground">Músculos alvo:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {bodyParts.map((part, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {part}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm">Editar</Button>
            <Button variant="outline" size="sm">Visualizar</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AssessmentCard({ 
  name, 
  type, 
  category, 
  description 
}: { 
  name: string; 
  type: string; 
  category: string; 
  description: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{name}</CardTitle>
            <CardDescription className="mt-2">{description}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline">{type}</Badge>
            <Badge variant="secondary">{category}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" size="sm">Editar</Button>
          <Button variant="outline" size="sm">Aplicar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { 
  PlusIcon, 
  SearchIcon, 
  EditIcon, 
  TrashIcon,
  BookOpenIcon,
  StethoscopeIcon
} from 'lucide-react';
import { Pathology } from '@/types';

export default function PathologiesPage() {
  const [pathologies, setPathologies] = useState<Pathology[]>([]);
  const [filteredPathologies, setFilteredPathologies] = useState<Pathology[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Mock data - em produção, isso viria de uma API
  useEffect(() => {
    const mockPathologies: Pathology[] = [
      {
        id: '1',
        name: 'Gonalgia',
        description: 'Dor no joelho de origem traumática ou degenerativa, podendo afetar estruturas articulares, ligamentares ou musculares.',
        symptoms: ['Dor articular', 'Rigidez matinal', 'Inchaço', 'Limitação de movimento', 'Crepitação'],
        causes: ['Trauma direto', 'Sobrecarga articular', 'Desgaste degenerativo', 'Instabilidade ligamentar'],
        icd10Code: 'M25.561',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-02-10'),
      },
      {
        id: '2',
        name: 'Lombalgia',
        description: 'Dor na região lombar da coluna vertebral, podendo ser de origem mecânica, inflamatória ou neuropática.',
        symptoms: ['Dor lombar', 'Rigidez', 'Espasmo muscular', 'Limitação funcional', 'Irradiação para MMII'],
        causes: ['Má postura', 'Sobrecarga vertebral', 'Degeneração discal', 'Fraqueza muscular', 'Sedentarismo'],
        icd10Code: 'M54.5',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-02-15'),
      },
      {
        id: '3',
        name: 'Cervicalgia',
        description: 'Dor cervical que pode estar relacionada a tensão muscular, alterações posturais ou degeneração articular.',
        symptoms: ['Dor cervical', 'Cefaleia tensional', 'Rigidez', 'Formigamento em MMSS'],
        causes: ['Postura inadequada', 'Estresse', 'Trauma cervical', 'Degeneração articular'],
        icd10Code: 'M54.2',
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-02-20'),
      },
      {
        id: '4',
        name: 'Tendinopatia do Manguito Rotador',
        description: 'Lesão degenerativa dos tendões que compõem o manguito rotador, comum em atividades repetitivas acima da cabeça.',
        symptoms: ['Dor no ombro', 'Fraqueza muscular', 'Limitação da elevação', 'Dor noturna'],
        causes: ['Movimento repetitivo', 'Envelhecimento', 'Sobrecarga mecânica', 'Impacto subacromial'],
        icd10Code: 'M75.3',
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-25'),
      }
    ];
    
    setTimeout(() => {
      setPathologies(mockPathologies);
      setFilteredPathologies(mockPathologies);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPathologies(pathologies);
    } else {
      const filtered = pathologies.filter(pathology =>
        pathology.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pathology.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pathology.icd10Code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pathology.symptoms.some(symptom => 
          symptom.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setFilteredPathologies(filtered);
    }
  }, [searchQuery, pathologies]);

  const handleDeletePathology = (id: string) => {
    setPathologies(prev => prev.filter(p => p.id !== id));
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Patologias"
          description="Gerencie a base de conhecimento de patologias"
        />
        <div className="grid gap-4">
          {[1,2,3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Patologias"
        description="Gerencie a base de conhecimento de patologias e suas características clínicas"
      >
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          Nova Patologia
        </Button>
      </PageHeader>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Patologias</CardTitle>
            <StethoscopeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pathologies.length}</div>
            <p className="text-xs text-muted-foreground">Base de conhecimento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Protocolos</CardTitle>
            <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(pathologies.length * 0.75)}</div>
            <p className="text-xs text-muted-foreground">75% das patologias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atualizadas</CardTitle>
            <EditIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(pathologies.length * 0.6)}</div>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome, descrição, CID-10 ou sintomas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Results Counter */}
      {searchQuery && (
        <div className="text-sm text-muted-foreground">
          {filteredPathologies.length} resultado(s) encontrado(s) para "{searchQuery}"
        </div>
      )}

      {/* Pathologies List */}
      <div className="grid gap-6">
        {filteredPathologies.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <StethoscopeIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma patologia encontrada</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery 
                  ? `Não encontramos patologias que correspondam a "${searchQuery}"`
                  : "Comece criando sua primeira patologia"
                }
              </p>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Nova Patologia
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredPathologies.map((pathology) => (
            <PathologyCard
              key={pathology.id}
              pathology={pathology}
              onDelete={handleDeletePathology}
            />
          ))
        )}
      </div>
    </div>
  );
}

function PathologyCard({ 
  pathology, 
  onDelete 
}: { 
  pathology: Pathology; 
  onDelete: (id: string) => void;
}) {
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  const truncatedDescription = pathology.description && pathology.description.length > 150
    ? pathology.description.substring(0, 150) + '...'
    : pathology.description;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-xl">{pathology.name}</CardTitle>
              {pathology.icd10Code && (
                <Badge variant="outline" className="text-xs">
                  CID-10: {pathology.icd10Code}
                </Badge>
              )}
            </div>
            <CardDescription className="text-sm leading-relaxed">
              {showFullDescription ? pathology.description : truncatedDescription}
              {pathology.description && pathology.description.length > 150 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-blue-600 hover:text-blue-800 ml-2 text-xs"
                >
                  {showFullDescription ? 'Ver menos' : 'Ver mais'}
                </button>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Symptoms */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Sintomas principais:</h4>
          <div className="flex flex-wrap gap-1">
            {pathology.symptoms.slice(0, 5).map((symptom, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {symptom}
              </Badge>
            ))}
            {pathology.symptoms.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{pathology.symptoms.length - 5} mais
              </Badge>
            )}
          </div>
        </div>

        {/* Causes */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Principais causas:</h4>
          <div className="flex flex-wrap gap-1">
            {pathology.causes.slice(0, 4).map((cause, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {cause}
              </Badge>
            ))}
            {pathology.causes.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{pathology.causes.length - 4} mais
              </Badge>
            )}
          </div>
        </div>

        {/* Footer with actions and metadata */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            Atualizado em {pathology.updatedAt.toLocaleDateString('pt-BR')}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <BookOpenIcon className="h-4 w-4 mr-1" />
              Ver Protocolos
            </Button>
            <Button variant="outline" size="sm">
              <EditIcon className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onDelete(pathology.id)}
              className="text-red-600 hover:text-red-800 hover:border-red-300"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
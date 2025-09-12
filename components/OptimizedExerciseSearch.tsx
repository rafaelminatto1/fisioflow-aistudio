'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  X, 
  Clock, 
  Zap, 
  TrendingUp,
  BarChart3,
  Settings,
  RefreshCw,
  Eye
} from 'lucide-react';
import { debounce } from 'lodash';

interface SearchFilters {
  query: string;
  categories: string[];
  bodyParts: string[];
  equipment: string[];
  difficulty: string[];
  duration: { min: number; max: number };
  therapeuticGoals: string[];
  aiCategorized?: boolean;
  minConfidence: number;
  hasMedia?: boolean;
  sortBy: string;
  sortOrder: string;
  fuzzyMatch: boolean;
}

interface SearchResult {
  exercises: any[];
  aggregations: {
    categories: { [key: string]: number };
    bodyParts: { [key: string]: number };
    equipment: { [key: string]: number };
    difficulties: { [key: string]: number };
  };
  pagination: {
    total: number;
    hasMore: boolean;
  };
  searchMetadata: {
    queryTime: number;
    cacheHit: boolean;
    algorithmUsed: string;
    totalIndexed: number;
  };
}

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'name', label: 'Nome' },
  { value: 'category', label: 'Categoria' },
  { value: 'difficulty', label: 'Dificuldade' },
  { value: 'ai_confidence', label: 'Confiança IA' },
  { value: 'created_at', label: 'Data de Criação' }
];

export default function OptimizedExerciseSearch() {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    categories: [],
    bodyParts: [],
    equipment: [],
    difficulty: [],
    duration: { min: 0, max: 120 },
    therapeuticGoals: [],
    aiCategorized: undefined,
    minConfidence: 0,
    hasMedia: undefined,
    sortBy: 'relevance',
    sortOrder: 'desc',
    fuzzyMatch: true
  });

  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchFilters: SearchFilters) => {
      await performSearch(searchFilters);
    }, 300),
    []
  );

  useEffect(() => {
    // Trigger search when filters change
    if (filters.query || Object.values(filters).some(v => 
      Array.isArray(v) ? v.length > 0 : v !== '' && v !== undefined && v !== false
    )) {
      debouncedSearch(filters);
    }
  }, [filters, debouncedSearch]);

  const performSearch = async (searchFilters: SearchFilters) => {
    setLoading(true);
    try {
      const response = await fetch('/api/exercises/search-optimized', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...searchFilters,
          limit: 20,
          offset: 0,
          includeMedia: true,
          includeMetadata: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => {
      const currentArray = prev[key] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return { ...prev, [key]: newArray };
    });
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      categories: [],
      bodyParts: [],
      equipment: [],
      difficulty: [],
      duration: { min: 0, max: 120 },
      therapeuticGoals: [],
      aiCategorized: undefined,
      minConfidence: 0,
      hasMedia: undefined,
      sortBy: 'relevance',
      sortOrder: 'desc',
      fuzzyMatch: true
    });
  };

  const getPerformanceColor = (time: number) => {
    if (time < 100) return 'text-green-600';
    if (time < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderFacetFilter = (title: string, facetKey: keyof SearchFilters, options: { [key: string]: number }) => {
    const currentValues = filters[facetKey] as string[];
    
    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {Object.entries(options)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([option, count]) => (
            <div key={option} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${facetKey}-${option}`}
                  checked={currentValues.includes(option)}
                  onCheckedChange={() => toggleArrayFilter(facetKey, option)}
                />
                <Label htmlFor={`${facetKey}-${option}`} className="text-sm">
                  {option}
                </Label>
              </div>
              <Badge variant="secondary" className="text-xs">
                {count.toLocaleString()}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex gap-6 max-w-7xl mx-auto">
      {/* Sidebar Filters */}
      <div className="w-80 space-y-4">
        {/* Search Performance Stats */}
        {results?.searchMetadata && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Tempo de busca:</span>
                <span className={`text-sm font-medium ${getPerformanceColor(results.searchMetadata.queryTime)}`}>
                  {results.searchMetadata.queryTime.toFixed(0)}ms
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Algoritmo:</span>
                <span className="text-sm">{results.searchMetadata.algorithmUsed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cache:</span>
                <Badge variant={results.searchMetadata.cacheHit ? 'default' : 'secondary'} className="text-xs">
                  {results.searchMetadata.cacheHit ? 'HIT' : 'MISS'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI & Quality Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              IA & Qualidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ai-categorized"
                checked={filters.aiCategorized === true}
                onCheckedChange={(checked) => handleFilterChange('aiCategorized', checked ? true : undefined)}
              />
              <Label htmlFor="ai-categorized" className="text-sm">Categorizado por IA</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-media"
                checked={filters.hasMedia === true}
                onCheckedChange={(checked) => handleFilterChange('hasMedia', checked ? true : undefined)}
              />
              <Label htmlFor="has-media" className="text-sm">Com mídia</Label>
            </div>

            <div>
              <Label className="text-sm">Confiança mínima: {filters.minConfidence}%</Label>
              <Slider
                value={[filters.minConfidence]}
                onValueChange={(value) => handleFilterChange('minConfidence', value[0])}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="fuzzy-match"
                checked={filters.fuzzyMatch}
                onCheckedChange={(checked) => handleFilterChange('fuzzyMatch', checked)}
              />
              <Label htmlFor="fuzzy-match" className="text-sm">Busca aproximada</Label>
            </div>
          </CardContent>
        </Card>

        {/* Duration Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Duração (min)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{filters.duration.min}</span>
                <span>{filters.duration.max}</span>
              </div>
              <Slider
                value={[filters.duration.min, filters.duration.max]}
                onValueChange={(value) => handleFilterChange('duration', { min: value[0], max: value[1] })}
                max={120}
                step={5}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Faceted Filters */}
        {results?.aggregations && (
          <>
            {Object.keys(results.aggregations.categories).length > 0 && 
              renderFacetFilter('Categorias', 'categories', results.aggregations.categories)}
            
            {Object.keys(results.aggregations.bodyParts).length > 0 && 
              renderFacetFilter('Partes do Corpo', 'bodyParts', results.aggregations.bodyParts)}
            
            {Object.keys(results.aggregations.equipment).length > 0 && 
              renderFacetFilter('Equipamentos', 'equipment', results.aggregations.equipment)}
            
            {Object.keys(results.aggregations.difficulties).length > 0 && 
              renderFacetFilter('Dificuldade', 'difficulty', results.aggregations.difficulties)}
          </>
        )}

        {/* Clear Filters */}
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="w-4 h-4 mr-2" />
          Limpar Filtros
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-4">
        {/* Search Header */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  value={filters.query}
                  onChange={(e) => handleFilterChange('query', e.target.value)}
                  placeholder="Pesquisar exercícios..."
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Avançado
              </Button>
            </div>

            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.sortOrder} onValueChange={(value) => handleFilterChange('sortOrder', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Decrescente</SelectItem>
                    <SelectItem value="asc">Crescente</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    Grade
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    Lista
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Summary */}
        {results && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    {results.pagination.total.toLocaleString()} exercícios encontrados
                  </span>
                  {loading && (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  )}
                </div>
                
                {results.searchMetadata && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <TrendingUp className="w-3 h-3" />
                    {results.searchMetadata.totalIndexed.toLocaleString()} indexados
                  </div>
                )}
              </div>

              {/* Active Filters */}
              {(filters.categories.length > 0 || filters.bodyParts.length > 0 || filters.equipment.length > 0 || 
                filters.difficulty.length > 0 || filters.aiCategorized || filters.hasMedia) && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                  {[...filters.categories, ...filters.bodyParts, ...filters.equipment, ...filters.difficulty].map(filter => (
                    <Badge key={filter} variant="secondary" className="text-xs">
                      {filter}
                    </Badge>
                  ))}
                  {filters.aiCategorized && <Badge variant="secondary" className="text-xs">IA</Badge>}
                  {filters.hasMedia && <Badge variant="secondary" className="text-xs">Com mídia</Badge>}
                  {filters.minConfidence > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Confiança ≥{filters.minConfidence}%
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results Grid */}
        {results && results.exercises.length > 0 && (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {results.exercises.map((exercise) => (
              <Card key={exercise.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm line-clamp-2">{exercise.name}</h3>
                    {exercise.ai_confidence && (
                      <Badge variant="secondary" className="text-xs ml-2">
                        {exercise.ai_confidence.toFixed(0)}%
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-3 mb-3">
                    {exercise.description}
                  </p>

                  <div className="space-y-2">
                    {exercise.category && (
                      <Badge variant="outline" className="text-xs">
                        {exercise.category}
                      </Badge>
                    )}
                    
                    {exercise.difficulty && (
                      <Badge 
                        variant={
                          exercise.difficulty === 'iniciante' ? 'default' :
                          exercise.difficulty === 'intermediario' ? 'secondary' : 'destructive'
                        }
                        className="text-xs ml-1"
                      >
                        {exercise.difficulty}
                      </Badge>
                    )}

                    {(exercise.video_url || exercise.thumbnail_url) && (
                      <Badge variant="secondary" className="text-xs ml-1">
                        <Eye className="w-3 h-3 mr-1" />
                        Mídia
                      </Badge>
                    )}
                  </div>

                  {exercise.relevanceScore && (
                    <div className="mt-2 text-xs text-gray-500">
                      Relevância: {exercise.relevanceScore.toFixed(1)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {results && results.exercises.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum exercício encontrado</h3>
              <p className="text-gray-600 mb-4">
                Tente ajustar seus filtros ou usar termos de busca diferentes.
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Load More */}
        {results && results.pagination.hasMore && (
          <div className="text-center">
            <Button variant="outline" disabled={loading}>
              {loading ? 'Carregando...' : 'Carregar Mais'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
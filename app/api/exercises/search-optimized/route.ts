import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const optimizedSearchSchema = z.object({
  query: z.string().optional(),
  categories: z.array(z.string()).optional(),
  bodyParts: z.array(z.string()).optional(),
  equipment: z.array(z.string()).optional(),
  difficulty: z.array(z.string()).optional(),
  duration: z.object({
    min: z.number().optional(),
    max: z.number().optional()
  }).optional(),
  therapeuticGoals: z.array(z.string()).optional(),
  aiCategorized: z.boolean().optional(),
  minConfidence: z.number().min(0).max(100).optional(),
  hasMedia: z.boolean().optional(),
  isApproved: z.boolean().default(true),
  sortBy: z.enum(['relevance', 'name', 'category', 'difficulty', 'created_at', 'ai_confidence']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  includeMetadata: z.boolean().default(false),
  includeMedia: z.boolean().default(false),
  fuzzyMatch: z.boolean().default(true),
  cacheKey: z.string().optional()
});

interface SearchResult {
  exercises: any[];
  aggregations: {
    categories: { [key: string]: number };
    bodyParts: { [key: string]: number };
    equipment: { [key: string]: number };
    difficulties: { [key: string]: number };
    therapeuticGoals: { [key: string]: number };
  };
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  searchMetadata: {
    queryTime: number;
    cacheHit: boolean;
    algorithmUsed: string;
    totalIndexed: number;
  };
}

// In-memory cache for frequently searched terms
const searchCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Search index for full-text search
const searchIndex = {
  exercises: new Map<string, any>(),
  terms: new Map<string, Set<string>>(),
  lastUpdated: 0
};

export async function POST(request: Request) {
  const startTime = performance.now();
  
  try {
    const data = await request.json();
    const validatedData = optimizedSearchSchema.parse(data);
    
    // Check cache first
    const cacheKey = validatedData.cacheKey || generateCacheKey(validatedData);
    const cachedResult = getFromCache(cacheKey);
    
    if (cachedResult) {
      return NextResponse.json({
        success: true,
        ...cachedResult,
        searchMetadata: {
          ...cachedResult.searchMetadata,
          queryTime: performance.now() - startTime,
          cacheHit: true
        }
      });
    }
    
    // Update search index if needed
    await updateSearchIndex();
    
    // Execute optimized search
    const result = await executeOptimizedSearch(validatedData);
    
    // Calculate query time
    const queryTime = performance.now() - startTime;
    
    const response: SearchResult = {
      ...result,
      searchMetadata: {
        queryTime,
        cacheHit: false,
        algorithmUsed: determineAlgorithm(validatedData),
        totalIndexed: searchIndex.exercises.size
      }
    };
    
    // Cache the result
    setCache(cacheKey, response, CACHE_TTL);
    
    return NextResponse.json({
      success: true,
      ...response
    });
    
  } catch (error) {
    console.error('Error in optimized search:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Parâmetros de busca inválidos',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno na busca otimizada'
    }, { status: 500 });
  }
}

async function executeOptimizedSearch(params: any): Promise<Omit<SearchResult, 'searchMetadata'>> {
  // Build optimized where clause
  const whereClause: any = {};
  const searchQueries: any[] = [];
  
  // Status filter
  if (params.isApproved) {
    whereClause.status = 'approved';
  }
  
  // AI categorization filter
  if (params.aiCategorized !== undefined) {
    whereClause.ai_categorized = params.aiCategorized;
  }
  
  // Confidence filter
  if (params.minConfidence) {
    whereClause.ai_confidence = { gte: params.minConfidence };
  }
  
  // Categories filter
  if (params.categories && params.categories.length > 0) {
    whereClause.category = { in: params.categories };
  }
  
  // Difficulty filter
  if (params.difficulty && params.difficulty.length > 0) {
    whereClause.difficulty = { in: params.difficulty };
  }
  
  // Duration filter
  if (params.duration) {
    const durationFilter: any = {};
    if (params.duration.min !== undefined) {
      durationFilter.gte = params.duration.min;
    }
    if (params.duration.max !== undefined) {
      durationFilter.lte = params.duration.max;
    }
    if (Object.keys(durationFilter).length > 0) {
      whereClause.duration = durationFilter;
    }
  }
  
  // Body parts filter
  if (params.bodyParts && params.bodyParts.length > 0) {
    whereClause.body_parts = {
      hasSome: params.bodyParts
    };
  }
  
  // Equipment filter
  if (params.equipment && params.equipment.length > 0) {
    whereClause.equipment = {
      hasSome: params.equipment
    };
  }
  
  // Therapeutic goals filter
  if (params.therapeuticGoals && params.therapeuticGoals.length > 0) {
    whereClause.therapeutic_goals = {
      contains: params.therapeuticGoals.join('|'),
      mode: 'insensitive'
    };
  }
  
  // Media filter
  if (params.hasMedia) {
    whereClause.OR = [
      { video_url: { not: null } },
      { thumbnail_url: { not: null } }
    ];
  }
  
  // Full-text search
  if (params.query) {
    if (params.fuzzyMatch) {
      // Use fuzzy matching for better results
      const fuzzyQueries = generateFuzzyQueries(params.query);
      whereClause.OR = [
        ...whereClause.OR || [],
        ...fuzzyQueries.map(query => ({
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
            { therapeutic_goals: { contains: query, mode: 'insensitive' } }
          ]
        }))
      ];
    } else {
      // Exact search
      whereClause.OR = [
        ...whereClause.OR || [],
        { name: { search: params.query } },
        { description: { search: params.query } }
      ];
    }
  }
  
  // Build sort clause
  const orderBy = buildSortClause(params.sortBy, params.sortOrder, params.query);
  
  // Include clauses
  const include: any = {};
  
  if (params.includeMedia) {
    include.exercise_media = {
      select: {
        type: true,
        url: true,
        is_primary: true,
        quality: true
      }
    };
  }
  
  // Execute search with optimizations
  const [exercises, total, aggregations] = await Promise.all([
    // Main search query with optimized indexing
    prisma.exercises.findMany({
      where: whereClause,
      include,
      orderBy,
      take: params.limit,
      skip: params.offset
    }),
    
    // Total count with same filters
    prisma.exercises.count({
      where: whereClause
    }),
    
    // Aggregations for faceted search
    generateAggregations(whereClause)
  ]);
  
  // Post-process results for relevance scoring
  const processedExercises = params.query ? 
    rankByRelevance(exercises, params.query) : 
    exercises;
  
  return {
    exercises: processedExercises,
    aggregations,
    pagination: {
      total,
      limit: params.limit,
      offset: params.offset,
      hasMore: params.offset + params.limit < total
    }
  };
}

function generateFuzzyQueries(query: string): string[] {
  const queries = [query];
  
  // Add partial matches
  const words = query.toLowerCase().split(' ').filter(word => word.length > 2);
  queries.push(...words);
  
  // Add stemmed versions
  words.forEach(word => {
    // Simple Portuguese stemming
    if (word.endsWith('ção')) {
      queries.push(word.replace('ção', 'car'));
    }
    if (word.endsWith('mento')) {
      queries.push(word.replace('mento', ''));
    }
    if (word.endsWith('amento')) {
      queries.push(word.replace('amento', 'ar'));
    }
  });
  
  // Add common synonyms
  const synonyms: { [key: string]: string[] } = {
    'fortalecimento': ['força', 'fortalecer', 'tonificar'],
    'alongamento': ['flexibilidade', 'esticar', 'alongar'],
    'equilibrio': ['propriocepção', 'estabilidade'],
    'cardio': ['aeróbico', 'cardiovascular'],
    'reabilitação': ['recuperação', 'fisioterapia']
  };
  
  words.forEach(word => {
    Object.entries(synonyms).forEach(([key, syns]) => {
      if (key.includes(word) || word.includes(key)) {
        queries.push(...syns);
      }
      if (syns.some(syn => syn.includes(word) || word.includes(syn))) {
        queries.push(key);
      }
    });
  });
  
  return Array.from(new Set(queries));
}

function buildSortClause(sortBy: string, sortOrder: string, query?: string): any {
  const order = sortOrder === 'asc' ? 'asc' : 'desc';
  
  switch (sortBy) {
    case 'relevance':
      // If there's a query, we'll handle relevance in post-processing
      // Otherwise, sort by AI confidence or creation date
      return query ? 
        { ai_confidence: 'desc' } : 
        [
          { ai_confidence: 'desc' },
          { created_at: 'desc' }
        ];
    
    case 'name':
      return { name: order };
    
    case 'category':
      return [
        { category: order },
        { name: 'asc' }
      ];
    
    case 'difficulty':
      return [
        { difficulty: order },
        { name: 'asc' }
      ];
    
    case 'ai_confidence':
      return { ai_confidence: order };
    
    case 'created_at':
    default:
      return { created_at: order };
  }
}

function rankByRelevance(exercises: any[], query: string): any[] {
  const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 1);
  
  return exercises.map(exercise => {
    let relevanceScore = 0;
    const searchText = `${exercise.name} ${exercise.description} ${exercise.category || ''} ${exercise.therapeutic_goals || ''}`.toLowerCase();
    
    // Exact phrase match gets highest score
    if (searchText.includes(query.toLowerCase())) {
      relevanceScore += 100;
    }
    
    // Word matches in different fields
    queryWords.forEach(word => {
      if (exercise.name?.toLowerCase().includes(word)) {
        relevanceScore += 50; // Name matches are very important
      }
      if (exercise.category?.toLowerCase().includes(word)) {
        relevanceScore += 30; // Category matches are important
      }
      if (exercise.description?.toLowerCase().includes(word)) {
        relevanceScore += 20; // Description matches are good
      }
      if (exercise.therapeutic_goals?.toLowerCase().includes(word)) {
        relevanceScore += 15; // Therapeutic goals matches
      }
    });
    
    // AI confidence bonus
    if (exercise.ai_confidence) {
      relevanceScore += exercise.ai_confidence * 0.1;
    }
    
    // Recency bonus
    const daysSinceCreation = (Date.now() - new Date(exercise.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 30) {
      relevanceScore += Math.max(0, 10 - daysSinceCreation * 0.3);
    }
    
    return {
      ...exercise,
      relevanceScore
    };
  }).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

async function generateAggregations(whereClause: any) {
  const baseWhere = { ...whereClause };
  delete baseWhere.category;
  delete baseWhere.difficulty;
  delete baseWhere.body_parts;
  delete baseWhere.equipment;
  delete baseWhere.therapeutic_goals;
  
  const [
    categoryAggs,
    difficultyAggs,
    bodyPartAggs,
    equipmentAggs
  ] = await Promise.all([
    // Category aggregations
    prisma.exercises.groupBy({
      by: ['category'],
      where: baseWhere,
      _count: { category: true }
    }),
    
    // Difficulty aggregations
    prisma.exercises.groupBy({
      by: ['difficulty'],
      where: baseWhere,
      _count: { difficulty: true }
    }),
    
    // Body parts would require custom query due to array field
    prisma.$queryRaw`
      SELECT UNNEST(body_parts) as body_part, COUNT(*) as count
      FROM exercises
      WHERE status = 'approved'
      GROUP BY body_part
      ORDER BY count DESC
      LIMIT 20
    ` as unknown as Array<{body_part: string, count: bigint}>,
    
    // Equipment would require custom query due to array field
    prisma.$queryRaw`
      SELECT UNNEST(equipment) as equipment, COUNT(*) as count
      FROM exercises
      WHERE status = 'approved'
      GROUP BY equipment
      ORDER BY count DESC
      LIMIT 20
    ` as unknown as Array<{equipment: string, count: bigint}>
  ]);
  
  return {
    categories: categoryAggs.reduce((acc, item) => {
      if (item.category) acc[item.category] = item._count.category;
      return acc;
    }, {} as { [key: string]: number }),
    
    difficulties: difficultyAggs.reduce((acc, item) => {
      if (item.difficulty) acc[item.difficulty] = item._count.difficulty;
      return acc;
    }, {} as { [key: string]: number }),
    
    bodyParts: bodyPartAggs.reduce((acc, item) => {
      acc[item.body_part] = Number(item.count);
      return acc;
    }, {} as { [key: string]: number }),
    
    equipment: equipmentAggs.reduce((acc, item) => {
      acc[item.equipment] = Number(item.count);
      return acc;
    }, {} as { [key: string]: number }),
    
    therapeuticGoals: {} // Would need custom implementation
  };
}

function determineAlgorithm(params: any): string {
  if (params.query && params.fuzzyMatch) return 'fuzzy_full_text';
  if (params.query) return 'exact_full_text';
  if (params.categories || params.bodyParts || params.equipment) return 'faceted_filter';
  return 'simple_filter';
}

function generateCacheKey(params: any): string {
  // Create a deterministic cache key from search parameters
  const keyData = {
    query: params.query,
    categories: params.categories?.sort(),
    bodyParts: params.bodyParts?.sort(),
    equipment: params.equipment?.sort(),
    difficulty: params.difficulty?.sort(),
    duration: params.duration,
    therapeuticGoals: params.therapeuticGoals?.sort(),
    aiCategorized: params.aiCategorized,
    minConfidence: params.minConfidence,
    hasMedia: params.hasMedia,
    isApproved: params.isApproved,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    limit: params.limit,
    offset: params.offset
  };
  
  return Buffer.from(JSON.stringify(keyData)).toString('base64').substring(0, 32);
}

function getFromCache(key: string) {
  const cached = searchCache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > cached.ttl) {
    searchCache.delete(key);
    return null;
  }
  
  return cached.data;
}

function setCache(key: string, data: any, ttl: number) {
  // Limit cache size to prevent memory issues
  if (searchCache.size > 1000) {
    const oldestKey = searchCache.keys().next().value;
    searchCache.delete(oldestKey);
  }
  
  searchCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
}

async function updateSearchIndex() {
  // Update search index periodically
  const now = Date.now();
  if (now - searchIndex.lastUpdated < 60000) { // 1 minute
    return;
  }
  
  // This would be implemented with a proper search index like Elasticsearch
  // For now, we'll skip the implementation
  searchIndex.lastUpdated = now;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  if (action === 'cache-stats') {
    return NextResponse.json({
      success: true,
      stats: {
        cacheSize: searchCache.size,
        indexSize: searchIndex.exercises.size,
        lastIndexUpdate: new Date(searchIndex.lastUpdated).toISOString()
      }
    });
  }
  
  if (action === 'clear-cache') {
    searchCache.clear();
    return NextResponse.json({
      success: true,
      message: 'Cache limpo com sucesso'
    });
  }
  
  return NextResponse.json({
    success: false,
    error: 'Ação não reconhecida'
  }, { status: 400 });
}
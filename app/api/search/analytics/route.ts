import { NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const searchAnalyticsSchema = z.object({
  query: z.string(),
  filters: z.object({}).passthrough(),
  results_count: z.number(),
  query_time: z.number(),
  algorithm_used: z.string(),
  cache_hit: z.boolean(),
  user_id: z.string().optional(),
  session_id: z.string().optional(),
  result_clicked: z.string().optional(), // exercise id that was clicked
  search_depth: z.number().default(1) // how deep in results user went
});

const performanceQuerySchema = z.object({
  timeframe: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  metric: z.enum(['queries', 'performance', 'popular_terms', 'cache_efficiency', 'algorithm_usage']).default('queries'),
  limit: z.number().min(1).max(100).default(20)
});

// In-memory analytics store (in production, use Redis or dedicated analytics DB)
const analyticsStore = {
  searches: [] as any[],
  aggregations: {
    popular_queries: new Map<string, number>(),
    query_performance: [] as { query: string; avg_time: number; count: number }[],
    cache_stats: { hits: 0, misses: 0 },
    algorithm_usage: new Map<string, number>()
  },
  lastUpdated: 0
};

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const validatedData = searchAnalyticsSchema.parse(data);
    
    // Store search analytics
    const searchEvent = {
      ...validatedData,
      timestamp: new Date(),
      id: `search_${Date.now()}_${Math.random().toString(36).substring(7)}`
    };
    
    analyticsStore.searches.push(searchEvent);
    
    // Update aggregations
    updateAggregations(searchEvent);
    
    // Store in database for persistence (if needed)
    await storeSearchAnalytics(searchEvent);
    
    return NextResponse.json({
      success: true,
      message: 'Análise de busca registrada'
    });
    
  } catch (error) {
    console.error('Error recording search analytics:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Dados de análise inválidos',
        details: error.errors
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno no sistema de análise'
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      timeframe: searchParams.get('timeframe') as any || 'day',
      metric: searchParams.get('metric') as any || 'queries',
      limit: parseInt(searchParams.get('limit') || '20')
    };
    
    const validatedQuery = performanceQuerySchema.parse(queryParams);
    
    const analytics = await getSearchAnalytics(validatedQuery);
    
    return NextResponse.json({
      success: true,
      analytics,
      metadata: {
        timeframe: validatedQuery.timeframe,
        metric: validatedQuery.metric,
        generated_at: new Date().toISOString(),
        total_searches: analyticsStore.searches.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching search analytics:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro ao obter análises de busca'
    }, { status: 500 });
  }
}

async function storeSearchAnalytics(searchEvent: any) {
  try {
    // Store in analytics_events table
    await prisma.analytics_events.create({
      data: {
        id: searchEvent.id,
        event_type: 'exercise_search',
        category: 'USER_ACTION',
        user_id: searchEvent.user_id,
        session_id: searchEvent.session_id,
        properties: {
          query: searchEvent.query,
          filters: searchEvent.filters,
          results_count: searchEvent.results_count,
          query_time: searchEvent.query_time,
          algorithm_used: searchEvent.algorithm_used,
          cache_hit: searchEvent.cache_hit,
          search_depth: searchEvent.search_depth
        }
      }
    });
  } catch (error) {
    console.warn('Failed to store search analytics in database:', error);
  }
}

function updateAggregations(searchEvent: any) {
  // Update popular queries
  const query = searchEvent.query.toLowerCase().trim();
  if (query) {
    const currentCount = analyticsStore.aggregations.popular_queries.get(query) || 0;
    analyticsStore.aggregations.popular_queries.set(query, currentCount + 1);
  }
  
  // Update cache stats
  if (searchEvent.cache_hit) {
    analyticsStore.aggregations.cache_stats.hits++;
  } else {
    analyticsStore.aggregations.cache_stats.misses++;
  }
  
  // Update algorithm usage
  const algorithm = searchEvent.algorithm_used;
  const currentUsage = analyticsStore.aggregations.algorithm_usage.get(algorithm) || 0;
  analyticsStore.aggregations.algorithm_usage.set(algorithm, currentUsage + 1);
  
  // Update query performance (simplified - in production would use sliding window)
  const existingPerf = analyticsStore.aggregations.query_performance.find(p => p.query === query);
  if (existingPerf) {
    existingPerf.avg_time = (existingPerf.avg_time * existingPerf.count + searchEvent.query_time) / (existingPerf.count + 1);
    existingPerf.count++;
  } else if (query) {
    analyticsStore.aggregations.query_performance.push({
      query,
      avg_time: searchEvent.query_time,
      count: 1
    });
  }
  
  analyticsStore.lastUpdated = Date.now();
}

async function getSearchAnalytics(params: any) {
  const timeframe = getTimeframeFilter(params.timeframe);
  
  switch (params.metric) {
    case 'queries':
      return getQueryAnalytics(timeframe, params.limit);
    
    case 'performance':
      return getPerformanceAnalytics(timeframe, params.limit);
    
    case 'popular_terms':
      return getPopularTermsAnalytics(params.limit);
    
    case 'cache_efficiency':
      return getCacheEfficiencyAnalytics(timeframe);
    
    case 'algorithm_usage':
      return getAlgorithmUsageAnalytics(timeframe);
    
    default:
      return getOverviewAnalytics(timeframe);
  }
}

function getTimeframeFilter(timeframe: string) {
  const now = new Date();
  switch (timeframe) {
    case 'hour':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case 'day':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
}

function getQueryAnalytics(since: Date, limit: number) {
  const recentSearches = analyticsStore.searches
    .filter(s => new Date(s.timestamp) >= since)
    .slice(-limit);
  
  const hourlyData = [];
  const hours = 24;
  
  for (let i = 0; i < hours; i++) {
    const hourStart = new Date(Date.now() - (i * 60 * 60 * 1000));
    const hourEnd = new Date(Date.now() - ((i - 1) * 60 * 60 * 1000));
    
    const searchesInHour = recentSearches.filter(s => {
      const searchTime = new Date(s.timestamp);
      return searchTime >= hourStart && searchTime < hourEnd;
    });
    
    hourlyData.unshift({
      hour: hourStart.getHours(),
      searches: searchesInHour.length,
      avg_query_time: searchesInHour.length > 0 
        ? searchesInHour.reduce((sum, s) => sum + s.query_time, 0) / searchesInHour.length
        : 0
    });
  }
  
  return {
    total_searches: recentSearches.length,
    hourly_data: hourlyData,
    avg_query_time: recentSearches.length > 0 
      ? recentSearches.reduce((sum, s) => sum + s.query_time, 0) / recentSearches.length
      : 0,
    avg_results: recentSearches.length > 0 
      ? recentSearches.reduce((sum, s) => sum + s.results_count, 0) / recentSearches.length
      : 0
  };
}

function getPerformanceAnalytics(since: Date, limit: number) {
  const recentSearches = analyticsStore.searches
    .filter(s => new Date(s.timestamp) >= since);
  
  // Performance by query time buckets
  const timeBuckets = {
    '<100ms': 0,
    '100-500ms': 0,
    '500ms-1s': 0,
    '1s-2s': 0,
    '>2s': 0
  };
  
  recentSearches.forEach(search => {
    const time = search.query_time;
    if (time < 100) timeBuckets['<100ms']++;
    else if (time < 500) timeBuckets['100-500ms']++;
    else if (time < 1000) timeBuckets['500ms-1s']++;
    else if (time < 2000) timeBuckets['1s-2s']++;
    else timeBuckets['>2s']++;
  });
  
  // Slowest queries
  const slowestQueries = [...analyticsStore.aggregations.query_performance]
    .sort((a, b) => b.avg_time - a.avg_time)
    .slice(0, limit)
    .map(q => ({
      query: q.query,
      avg_time: q.avg_time,
      count: q.count
    }));
  
  return {
    time_buckets: timeBuckets,
    slowest_queries: slowestQueries,
    p95_query_time: calculatePercentile(recentSearches.map(s => s.query_time), 95),
    p99_query_time: calculatePercentile(recentSearches.map(s => s.query_time), 99)
  };
}

function getPopularTermsAnalytics(limit: number) {
  const popularQueries = Array.from(analyticsStore.aggregations.popular_queries.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([query, count]) => ({ query, count }));
  
  // Extract popular terms from queries
  const termCounts = new Map<string, number>();
  
  popularQueries.forEach(({ query, count }) => {
    const terms = query.toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 2)
      .filter(term => !['para', 'com', 'sem', 'dos', 'das', 'uma', 'uns'].includes(term));
    
    terms.forEach(term => {
      const currentCount = termCounts.get(term) || 0;
      termCounts.set(term, currentCount + count);
    });
  });
  
  const popularTerms = Array.from(termCounts.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([term, count]) => ({ term, count }));
  
  return {
    popular_queries: popularQueries,
    popular_terms: popularTerms,
    total_unique_queries: analyticsStore.aggregations.popular_queries.size
  };
}

function getCacheEfficiencyAnalytics(since: Date) {
  const recentSearches = analyticsStore.searches
    .filter(s => new Date(s.timestamp) >= since);
  
  const cacheHits = recentSearches.filter(s => s.cache_hit).length;
  const totalSearches = recentSearches.length;
  const hitRate = totalSearches > 0 ? (cacheHits / totalSearches) * 100 : 0;
  
  return {
    cache_hit_rate: hitRate,
    total_hits: analyticsStore.aggregations.cache_stats.hits,
    total_misses: analyticsStore.aggregations.cache_stats.misses,
    recent_hits: cacheHits,
    recent_total: totalSearches,
    performance_improvement: cacheHits > 0 
      ? recentSearches
          .filter(s => s.cache_hit)
          .reduce((sum, s) => sum + s.query_time, 0) / cacheHits
      : 0
  };
}

function getAlgorithmUsageAnalytics(since: Date) {
  const recentSearches = analyticsStore.searches
    .filter(s => new Date(s.timestamp) >= since);
  
  const algorithmCounts = new Map<string, number>();
  const algorithmPerformance = new Map<string, { total_time: number; count: number }>();
  
  recentSearches.forEach(search => {
    const algorithm = search.algorithm_used;
    
    // Count usage
    const currentCount = algorithmCounts.get(algorithm) || 0;
    algorithmCounts.set(algorithm, currentCount + 1);
    
    // Track performance
    const currentPerf = algorithmPerformance.get(algorithm) || { total_time: 0, count: 0 };
    algorithmPerformance.set(algorithm, {
      total_time: currentPerf.total_time + search.query_time,
      count: currentPerf.count + 1
    });
  });
  
  const algorithmStats = Array.from(algorithmCounts.entries()).map(([algorithm, count]) => {
    const perf = algorithmPerformance.get(algorithm)!;
    return {
      algorithm,
      usage_count: count,
      usage_percentage: (count / recentSearches.length) * 100,
      avg_query_time: perf.total_time / perf.count
    };
  }).sort((a, b) => b.usage_count - a.usage_count);
  
  return {
    algorithm_stats: algorithmStats,
    total_algorithms: algorithmStats.length,
    most_used: algorithmStats[0]?.algorithm || 'N/A',
    fastest: algorithmStats.reduce((fastest, current) => 
      current.avg_query_time < fastest.avg_query_time ? current : fastest
    )?.algorithm || 'N/A'
  };
}

function getOverviewAnalytics(since: Date) {
  const recentSearches = analyticsStore.searches
    .filter(s => new Date(s.timestamp) >= since);
  
  return {
    total_searches: recentSearches.length,
    avg_query_time: recentSearches.length > 0 
      ? recentSearches.reduce((sum, s) => sum + s.query_time, 0) / recentSearches.length
      : 0,
    cache_hit_rate: recentSearches.length > 0 
      ? (recentSearches.filter(s => s.cache_hit).length / recentSearches.length) * 100
      : 0,
    most_popular_query: Array.from(analyticsStore.aggregations.popular_queries.entries())
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A',
    unique_queries: new Set(recentSearches.map(s => s.query)).size
  };
}

function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

// Cleanup old analytics data periodically
setInterval(() => {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
  analyticsStore.searches = analyticsStore.searches.filter(s => 
    new Date(s.timestamp) >= cutoff
  );
  
  // Also cleanup query performance data
  if (analyticsStore.aggregations.query_performance.length > 1000) {
    analyticsStore.aggregations.query_performance = analyticsStore.aggregations.query_performance
      .slice(-500); // Keep only latest 500
  }
}, 60 * 60 * 1000); // Run every hour
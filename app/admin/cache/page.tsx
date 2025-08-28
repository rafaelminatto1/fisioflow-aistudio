import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Activity,
  Zap,
  TrendingUp,
  Server,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cache Monitoring | FisioFlow Admin',
  description:
    'Real-time cache monitoring dashboard with metrics and performance insights',
};

// Mock data - in real implementation, this would come from your cache metrics API
const mockCacheMetrics = {
  overall: {
    hitRate: 78.5,
    totalOperations: 15420,
    totalHits: 12105,
    totalMisses: 3315,
    avgResponseTime: 23.4,
    errorRate: 0.2,
  },
  managers: {
    default: {
      hitRate: 82.1,
      operations: 3450,
      hits: 2832,
      misses: 618,
      memoryHits: 2100,
      redisHits: 732,
      totalSize: 45 * 1024 * 1024, // 45MB
      errors: 5,
    },
    patients: {
      hitRate: 89.3,
      operations: 4200,
      hits: 3750,
      misses: 450,
      memoryHits: 2800,
      redisHits: 950,
      totalSize: 67 * 1024 * 1024, // 67MB
      errors: 2,
    },
    appointments: {
      hitRate: 73.2,
      operations: 2800,
      hits: 2050,
      misses: 750,
      memoryHits: 1200,
      redisHits: 850,
      totalSize: 31 * 1024 * 1024, // 31MB
      errors: 8,
    },
    reports: {
      hitRate: 95.1,
      operations: 1200,
      hits: 1141,
      misses: 59,
      memoryHits: 800,
      redisHits: 341,
      totalSize: 89 * 1024 * 1024, // 89MB
      errors: 0,
    },
    sessions: {
      hitRate: 91.7,
      operations: 2870,
      hits: 2632,
      misses: 238,
      memoryHits: 1900,
      redisHits: 732,
      totalSize: 23 * 1024 * 1024, // 23MB
      errors: 1,
    },
    queries: {
      hitRate: 68.9,
      operations: 900,
      hits: 620,
      misses: 280,
      memoryHits: 400,
      redisHits: 220,
      totalSize: 156 * 1024 * 1024, // 156MB
      errors: 3,
    },
  },
  healthScore: 87.3,
};

function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

function getHealthColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 70) return 'text-yellow-600';
  if (score >= 50) return 'text-orange-600';
  return 'text-red-600';
}

function getHitRateColor(rate: number): string {
  if (rate >= 80) return 'text-green-600';
  if (rate >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

export default function CacheMonitoringPage() {
  const { overall, managers, healthScore } = mockCacheMetrics;

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Page Header */}
      <div className='mb-8'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center space-x-3'>
            <Zap className='h-8 w-8 text-purple-600' />
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Cache Monitoring
              </h1>
              <p className='text-gray-600'>
                Multi-layer cache system performance and metrics
              </p>
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <Badge variant='outline' className='text-sm'>
              <Activity className='w-4 h-4 mr-1' />
              Live
            </Badge>
            <div
              className={`text-2xl font-bold ${getHealthColor(healthScore)}`}
            >
              {healthScore.toFixed(1)}% Health
            </div>
          </div>
        </div>

        {/* Overall Metrics Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Overall Hit Rate
              </CardTitle>
              <TrendingUp className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${getHitRateColor(overall.hitRate)}`}
              >
                {overall.hitRate.toFixed(1)}%
              </div>
              <p className='text-xs text-muted-foreground'>
                {overall.totalHits.toLocaleString()} hits of{' '}
                {overall.totalOperations.toLocaleString()} ops
              </p>
              <Progress value={overall.hitRate} className='mt-2' />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Avg Response Time
              </CardTitle>
              <Clock className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {overall.avgResponseTime.toFixed(1)}ms
              </div>
              <p className='text-xs text-muted-foreground'>
                Average across all caches
              </p>
              <div className='mt-2'>
                {overall.avgResponseTime < 50 ? (
                  <Badge variant='secondary' className='text-green-600'>
                    Excellent
                  </Badge>
                ) : overall.avgResponseTime < 100 ? (
                  <Badge variant='secondary' className='text-yellow-600'>
                    Good
                  </Badge>
                ) : (
                  <Badge variant='secondary' className='text-red-600'>
                    Needs Attention
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Error Rate</CardTitle>
              <AlertTriangle className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${overall.errorRate < 1 ? 'text-green-600' : 'text-red-600'}`}
              >
                {overall.errorRate.toFixed(2)}%
              </div>
              <p className='text-xs text-muted-foreground'>
                System reliability
              </p>
              <div className='mt-2'>
                {overall.errorRate < 1 ? (
                  <CheckCircle className='h-4 w-4 text-green-600' />
                ) : (
                  <AlertTriangle className='h-4 w-4 text-red-600' />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Total Operations
              </CardTitle>
              <BarChart3 className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {overall.totalOperations.toLocaleString()}
              </div>
              <p className='text-xs text-muted-foreground'>
                All cache operations
              </p>
              <div className='flex items-center mt-2 space-x-4 text-sm'>
                <span className='text-green-600'>
                  ↗ {overall.totalHits.toLocaleString()} hits
                </span>
                <span className='text-red-600'>
                  ↘ {overall.totalMisses.toLocaleString()} misses
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cache Managers Details */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
        {Object.entries(managers).map(([name, metrics]) => (
          <Card key={name}>
            <CardHeader>
              <CardTitle className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <Server className='h-5 w-5' />
                  <span className='capitalize'>{name} Cache</span>
                </div>
                <div
                  className={`text-lg font-bold ${getHitRateColor(metrics.hitRate)}`}
                >
                  {metrics.hitRate.toFixed(1)}%
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <div className='text-gray-600'>Total Operations</div>
                  <div className='font-semibold'>
                    {metrics.operations.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className='text-gray-600'>Cache Size</div>
                  <div className='font-semibold'>
                    {formatBytes(metrics.totalSize)}
                  </div>
                </div>
                <div>
                  <div className='text-gray-600'>Memory Hits</div>
                  <div className='font-semibold text-blue-600'>
                    {metrics.memoryHits.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className='text-gray-600'>Redis Hits</div>
                  <div className='font-semibold text-purple-600'>
                    {metrics.redisHits.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className='text-gray-600'>Misses</div>
                  <div className='font-semibold text-red-600'>
                    {metrics.misses.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className='text-gray-600'>Errors</div>
                  <div
                    className={`font-semibold ${metrics.errors === 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {metrics.errors}
                  </div>
                </div>
              </div>
              <div className='mt-4'>
                <div className='flex justify-between text-sm mb-1'>
                  <span>Hit Rate</span>
                  <span>{metrics.hitRate.toFixed(1)}%</span>
                </div>
                <Progress value={metrics.hitRate} className='h-2' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cache Layer Performance */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <Database className='h-5 w-5 text-blue-600' />
              <span>Memory Cache (L1)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <div className='flex justify-between'>
                <span className='text-sm text-gray-600'>Total Hits:</span>
                <span className='font-semibold text-blue-600'>
                  {Object.values(managers)
                    .reduce((sum, m) => sum + m.memoryHits, 0)
                    .toLocaleString()}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm text-gray-600'>Total Size:</span>
                <span className='font-semibold'>
                  {formatBytes(
                    Object.values(managers).reduce(
                      (sum, m) => sum + m.totalSize * 0.3,
                      0
                    )
                  )}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm text-gray-600'>Performance:</span>
                <Badge variant='secondary' className='text-green-600'>
                  Excellent
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <Server className='h-5 w-5 text-purple-600' />
              <span>Redis Cache (L2)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <div className='flex justify-between'>
                <span className='text-sm text-gray-600'>Total Hits:</span>
                <span className='font-semibold text-purple-600'>
                  {Object.values(managers)
                    .reduce((sum, m) => sum + m.redisHits, 0)
                    .toLocaleString()}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm text-gray-600'>Connection:</span>
                <Badge variant='secondary' className='text-green-600'>
                  Active
                </Badge>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm text-gray-600'>Performance:</span>
                <Badge variant='secondary' className='text-green-600'>
                  Good
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <RefreshCw className='h-5 w-5 text-orange-600' />
              <span>Invalidation System</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <div className='flex justify-between'>
                <span className='text-sm text-gray-600'>Rules Active:</span>
                <span className='font-semibold'>12</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm text-gray-600'>Queue Size:</span>
                <span className='font-semibold'>3</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-sm text-gray-600'>Status:</span>
                <Badge variant='secondary' className='text-green-600'>
                  Processing
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cache Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-3'>
              <h4 className='font-semibold text-green-600 flex items-center space-x-2'>
                <CheckCircle className='h-4 w-4' />
                <span>Working Well</span>
              </h4>
              <ul className='space-y-1 text-sm text-gray-600'>
                <li>• Reports cache has excellent 95.1% hit rate</li>
                <li>• Sessions cache performing well at 91.7%</li>
                <li>• Overall error rate is very low at 0.2%</li>
                <li>• Average response time under 25ms</li>
              </ul>
            </div>
            <div className='space-y-3'>
              <h4 className='font-semibold text-orange-600 flex items-center space-x-2'>
                <AlertTriangle className='h-4 w-4' />
                <span>Areas for Improvement</span>
              </h4>
              <ul className='space-y-1 text-sm text-gray-600'>
                <li>• Query cache hit rate could be improved (68.9%)</li>
                <li>• Appointments cache has higher miss rate</li>
                <li>• Consider increasing memory allocation for queries</li>
                <li>• Review cache invalidation patterns for appointments</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

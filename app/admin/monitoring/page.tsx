import { Metadata } from 'next';
import { MonitoringDashboard } from '@/lib/monitoring/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Activity, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Neon DB Monitoring | FisioFlow',
  description: 'Real-time monitoring dashboard for Neon database performance and health metrics',
};

export default function MonitoringPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Database className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Database Monitoring</h1>
            <p className="text-gray-600">Monitor Neon DB performance, health, and alerts in real-time</p>
          </div>
        </div>
        
        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Provider</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Neon DB</div>
              <p className="text-xs text-muted-foreground">Serverless PostgreSQL</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monitoring Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Active</div>
              <p className="text-xs text-muted-foreground">Real-time monitoring enabled</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">Protected</div>
              <p className="text-xs text-muted-foreground">RLS & Auth enabled</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Monitoring Dashboard */}
      <MonitoringDashboard className="w-full" />
      
      {/* Additional Information */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monitoring Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Real-time performance metrics</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Connection pool monitoring</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Automated alerting system</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Storage usage tracking</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Error rate monitoring</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Alert Thresholds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>CPU Usage:</span>
                <span className="font-medium">80% (Warning) / 96% (Critical)</span>
              </div>
              <div className="flex justify-between">
                <span>Memory Usage:</span>
                <span className="font-medium">85% (Warning) / 95% (Critical)</span>
              </div>
              <div className="flex justify-between">
                <span>Connection Pool:</span>
                <span className="font-medium">90% (Warning) / 98% (Critical)</span>
              </div>
              <div className="flex justify-between">
                <span>Response Time:</span>
                <span className="font-medium">1000ms (Warning) / 2000ms (Critical)</span>
              </div>
              <div className="flex justify-between">
                <span>Error Rate:</span>
                <span className="font-medium">5% (Warning) / 10% (Critical)</span>
              </div>
              <div className="flex justify-between">
                <span>Storage Usage:</span>
                <span className="font-medium">90% (Warning) / 95% (Critical)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
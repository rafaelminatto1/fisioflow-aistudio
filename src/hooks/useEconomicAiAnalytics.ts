// hooks/useEconomicAiAnalytics.ts
import { useState, useEffect } from 'react';
<<<<<<< HEAD:src/hooks/useEconomicAiAnalytics.ts
import { aiService } from '@/services/ai-economica/aiService';
import { EconomicAiStats, EconomicAiLog, PremiumProvider, UsageStatus, ResponseSource } from '@/services/ai-economica/types/ai-economica.types';
=======
import { aiService } from '../services/ai-economica/aiService';
import {
  EconomicAiStats,
  EconomicAiLog,
  PremiumProvider,
  UsageStatus,
  ResponseSource,
} from '../services/ai-economica/types/ai-economica.types';
>>>>>>> 0a044a4fefabf8a04dc73a6184972379c66221b3:hooks/useEconomicAiAnalytics.ts

// Mocked provider status since the service doesn't expose it directly.
const getMockProviderStatus = async (): Promise<ProviderStatus[]> => {
  const providers = Object.values(PremiumProvider);
  return providers.map(provider => ({
    provider,
    enabled: true,
    status: 'available',
    percentage: Math.random() * 0.7, // simulate usage
  }));
};

export interface ProviderStatus extends UsageStatus {
  provider: PremiumProvider;
  enabled: boolean;
}

export const useEconomicAiAnalytics = () => {
  const [stats, setStats] = useState<EconomicAiStats | null>(null);
  const [logs, setLogs] = useState<EconomicAiLog[]>([]);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const statuses = await getMockProviderStatus();
      setProviderStatus(statuses);
      setStats(aiService.getStats());
      setLogs([...aiService.getLogs()]); // Create new array to trigger re-render
      setIsLoading(false);
    };

    fetchData();

    const interval = setInterval(fetchData, 3000); // Poll for updates
    return () => clearInterval(interval);
  }, []);

  return { stats, logs, providerStatus, isLoading };
};

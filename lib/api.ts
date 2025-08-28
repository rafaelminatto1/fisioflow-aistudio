// lib/api.ts

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import winston from 'winston';

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

// --- Instância Axios Configurada ---
const api = axios.create({
  // Em um app Next.js, isso viria de process.env.NEXT_PUBLIC_API_URL
  // Para este projeto, vamos usar o valor de desenvolvimento padrão.
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  withCredentials: true, // Essencial para CORS com credenciais
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Interceptor de Resposta para Retry e Tratamento de Erros ---

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 200;

// Estendendo a configuração do Axios para incluir a contagem de retries
interface RetryConfig extends InternalAxiosRequestConfig {
  retries?: number;
}

api.interceptors.response.use(
  // Retorna a resposta diretamente se for bem-sucedida
  response => response,

  // Lida com erros
  async (error: AxiosError) => {
    const config = error.config as RetryConfig;

    // Inicializa a contagem de retries se não existir
    config.retries = config.retries || 0;

    // --- Lógica de Retry com Exponential Backoff ---

    // Condições para tentar novamente: erro de rede ou erro de servidor (5xx)
    const shouldRetry =
      !error.response ||
      (error.response.status >= 500 && error.response.status <= 599);

    if (config.retries < MAX_RETRIES && shouldRetry) {
      config.retries += 1;

      // Calcula o tempo de espera (ex: 200ms, 400ms, 800ms)
      const delay = Math.pow(2, config.retries) * INITIAL_DELAY_MS;

      logger.warn(
        `[API Retry] Tentativa ${config.retries}/${MAX_RETRIES}. Tentando novamente em ${delay}ms...`
      );

      // Espera o tempo calculado antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, delay));

      // Tenta a requisição novamente
      return api(config);
    }

    // --- Tratamento Padronizado de Erros ---

    // Se não for possível fazer retry, rejeita a promise com um erro padronizado
    const customError = {
      message: 'Ocorreu um erro de comunicação com o servidor.',
      status: 500,
      data: null as any,
    };

    if (error.response) {
      // Erro vindo da API do Flask (com o formato que definimos)
      customError.status = error.response.status;
      customError.data = error.response.data;
      customError.message =
        (error.response.data as any)?.error?.message || error.message;
    } else if (error.request) {
      // Erro de rede (sem resposta do servidor)
      customError.message =
        'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e se o backend está rodando.';
    }

    return Promise.reject(customError);
  }
);

// --- Funções de API Expostas ---

export interface Session {
  id: number;
  topic: string;
  mentor: string;
}

/**
 * Verifica a saúde da API do Flask.
 */
export const checkApiHealth = async (): Promise<{
  status: string;
  service: string;
}> => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error: any) {
    logger.error('[API Health Check] Falhou:', error.message || error);
    return { status: 'error', service: 'mentoria-api' };
  }
};

/**
 * Busca as sessões de mentoria.
 */
export const getMentoriaSessions = async (): Promise<Session[]> => {
  try {
    const response = await api.get('/api/mentoria/sessions');
    return response.data;
  } catch (error: any) {
    // O erro já foi padronizado pelo interceptor
    logger.error('Erro ao buscar sessões:', error.message || error);
    throw error; // Re-lança para o componente/página tratar
  }
};

export default api;

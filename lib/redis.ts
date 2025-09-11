/**
 * @file src/lib/redis.ts
 * @description Configuração e instanciação do cliente IORedis.
 * Este arquivo gerencia a conexão com o Redis, usando uma instância singleton
 * em produção e um mock para ambientes onde o Redis não está disponível.
 */
import IORedis from 'ioredis';
import edgeLogger from './edge-logger';

// Declaração para o cache global da instância do Redis
declare global {
  /**
   * @description Cache global para a instância do IORedis em ambiente de produção.
   * Evita a criação de múltiplas conexões.
   * @global
   */
  // eslint-disable-next-line no-var
  var __redis: IORedis | undefined;
}

/**
 * @description A instância do cliente IORedis.
 * Pode ser a instância real ou um mock, dependendo da disponibilidade da `REDIS_URL`.
 * @type {IORedis}
 */
let redis: IORedis;

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  edgeLogger.warn('REDIS_URL não está definido. Usando um mock do Redis para fins de build e desenvolvimento local. Funcionalidades de cache avançado como tags não funcionarão.');

  /**
   * @description Mock do IORedis para ambientes sem uma conexão Redis real.
   * Simula a interface do ioredis para evitar que a aplicação quebre,
   * mas não armazena dados e tem funcionalidade limitada.
   */
  const mockRedis = {
    get: async () => null,
    set: async () => 'OK',
    del: async () => 1,
    incr: async () => 1,
    expire: async () => 1,
    sadd: async () => 1,
    smembers: async () => [],
    scan: async function* () {
      // Gerador vazio para o scan
      yield []; // Retorna um cursor '0' e um array vazio de chaves
      return;
    },
    on: () => {},
    connect: async () => {},
    disconnect: async () => {},
  } as unknown as IORedis;

  redis = mockRedis;

} else {
  /**
   * @description Lógica de conexão para o Redis real.
   * Em produção, utiliza uma instância singleton para otimizar conexões.
   * Em desenvolvimento, cria uma nova instância para ser compatível com Hot Module Replacement (HMR).
   */
  if (process.env.NODE_ENV === 'production') {
    // Em produção, usa a instância singleton
    if (!globalThis.__redis) {
      globalThis.__redis = new IORedis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
      });
      edgeLogger.info('Nova conexão Redis de produção criada.');
    }
    redis = globalThis.__redis;
  } else {
    // Em desenvolvimento, cria uma nova conexão para evitar problemas com HMR
    redis = new IORedis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: false, // Menos estrito em dev
    });
    edgeLogger.info('Nova conexão Redis de desenvolvimento criada.');
  }

  /**
   * @description Listener para erros de conexão com o Redis.
   */
  redis.on('error', (err) => {
    edgeLogger.error('Erro no cliente Redis', err);
  });

  /**
   * @description Listener para quando a conexão com o Redis é estabelecida com sucesso.
   */
  redis.on('connect', () => {
    edgeLogger.info('Cliente Redis conectado com sucesso.');
  });
}

export default redis;

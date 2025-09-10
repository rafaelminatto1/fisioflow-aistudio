import IORedis from 'ioredis';
import edgeLogger from './edge-logger';

// Declaração para o cache global da instância do Redis
declare global {
  // eslint-disable-next-line no-var
  var __redis: IORedis | undefined;
}

let redis: IORedis;

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  edgeLogger.warn('REDIS_URL não está definido. Usando um mock do Redis para fins de build e desenvolvimento local. Funcionalidades de cache avançado como tags não funcionarão.');

  // Mock do IORedis para evitar que a aplicação quebre durante o build ou em ambientes sem Redis.
  // Ele simula a interface do ioredis, mas não armazena dados.
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

  redis.on('error', (err) => {
    edgeLogger.error('Erro no cliente Redis', err);
  });

  redis.on('connect', () => {
    edgeLogger.info('Cliente Redis conectado com sucesso.');
  });
}

export default redis;

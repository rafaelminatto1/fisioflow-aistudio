// Script para testar conexão Redis
const redis = require('./lib/redis');

async function testRedis() {
  try {
    console.log('=== TESTE REDIS ===');
    
    // Testar conexão básica
    await redis.set('test', 'hello');
    const value = await redis.get('test');
    console.log('✅ Redis funcionando:', value === 'hello');
    
    // Testar rate limiting
    const rateLimitKey = 'rate_limit:login:admin@fisioflow.com';
    
    // Limpar qualquer rate limit existente
    await redis.del(rateLimitKey);
    console.log('✅ Rate limit limpo');
    
    // Verificar se existe rate limit
    const attempts = await redis.get(rateLimitKey);
    console.log('Rate limit atual:', attempts);
    
    if (attempts && Number(attempts) >= 5) {
      console.log('❌ Rate limit ativo! Limpando...');
      await redis.del(rateLimitKey);
      console.log('✅ Rate limit removido');
    } else {
      console.log('✅ Sem rate limit ativo');
    }
    
  } catch (error) {
    console.error('❌ Erro Redis:', error.message);
    console.log('Redis pode não estar disponível, mas isso não deveria impedir o login');
  }
}

testRedis();
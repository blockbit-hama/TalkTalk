require('dotenv').config({ path: '.env.development.local' });
const { Redis } = require('@upstash/redis');

console.log('🔍 환경변수 확인:');
console.log('KV_REST_API_URL:', process.env.KV_REST_API_URL);
console.log('KV_REST_API_TOKEN 설정 여부:', !!process.env.KV_REST_API_TOKEN);
console.log('UPSTASH_REDIS_REST_URL:', process.env.UPSTASH_REDIS_REST_URL);
console.log('UPSTASH_REDIS_REST_TOKEN 설정 여부:', !!process.env.UPSTASH_REDIS_REST_TOKEN);

async function testRedisFromEnv() {
  try {
    console.log('🔄 Redis.fromEnv() 패턴으로 연결 시도');

    // Vercel 권장 방식 사용
    const redis = Redis.fromEnv();
    console.log('✅ Redis.fromEnv() 인스턴스 생성 성공');

    console.log('⏳ Redis 연결 테스트 중...');

    // 테스트 키 설정
    const testKey = 'test:fromenv';
    const testValue = { message: 'Hello Redis fromEnv!', timestamp: new Date().toISOString() };

    // SET 테스트
    console.log('📝 SET 테스트...');
    await redis.set(testKey, testValue);
    console.log('✅ SET 성공');

    // GET 테스트
    console.log('📖 GET 테스트...');
    const result = await redis.get(testKey);
    console.log('✅ GET 성공:', result);

    // 전화번호 매핑 테스트
    const phoneTestKey = 'phone:01011111111';
    const phoneTestValue = {
      phoneNumber: '01011111111',
      walletAddress: 'rU362zHMUKMkp9r5weu7UNZTvUVnMAjArx',
      userName: '이승현',
      createdAt: new Date().toISOString()
    };

    console.log('📞 전화번호 매핑 SET 테스트...');
    await redis.set(phoneTestKey, phoneTestValue);
    console.log('✅ 전화번호 매핑 SET 성공');

    console.log('📞 전화번호 매핑 GET 테스트...');
    const phoneResult = await redis.get(phoneTestKey);
    console.log('✅ 전화번호 매핑 GET 성공:', phoneResult);

    // keys 테스트
    console.log('🔍 Keys 테스트...');
    const keys = await redis.keys('test:*');
    console.log('✅ Keys 조회 성공:', keys);

    console.log('🎉 모든 Redis.fromEnv() 테스트 성공!');

  } catch (error) {
    console.error('❌ Redis.fromEnv() 테스트 실패:', error);
    console.error('상세 오류:', error.message);
    console.error('스택 트레이스:', error.stack);
  }
}

testRedisFromEnv();
require('dotenv').config({ path: '.env.development.local' });
const { Redis } = require('@upstash/redis');

console.log('🔍 환경변수 확인:');
console.log('UPSTASH_REDIS_REST_URL:', process.env.UPSTASH_REDIS_REST_URL);
console.log('KV_REST_API_URL:', process.env.KV_REST_API_URL);
console.log('TOKEN 설정 여부:', !!process.env.UPSTASH_REDIS_REST_TOKEN || !!process.env.KV_REST_API_TOKEN);

async function testRedis() {
  try {
    let redis;

    try {
      // 직접 KV_REST_API_URL과 KV_REST_API_TOKEN 사용
      console.log('🔄 KV_REST_API 환경변수로 직접 연결 시도');
      redis = new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      });
      console.log('✅ Redis 수동 설정 성공');
    } catch (error) {
      console.log('⚠️ Redis 수동 설정 실패, fromEnv() 패턴 시도:', error);

      try {
        // Vercel 문서에 따른 Redis.fromEnv() 패턴 사용
        console.log('🔄 Redis.fromEnv() 패턴 시도');
        redis = Redis.fromEnv();
        console.log('✅ Redis.fromEnv() 성공');
      } catch (envError) {
        console.log('❌ Redis.fromEnv() 실패:', envError);
        console.log('❌ Redis 연결을 설정할 수 없습니다.');
        return;
      }
    }

    console.log('⏳ Redis 연결 테스트 중...');

    // 테스트 키 설정
    const testKey = 'test:connection';
    const testValue = { message: 'Hello Redis!', timestamp: new Date().toISOString() };

    // SET 테스트
    console.log('📝 SET 테스트...');
    await redis.set(testKey, testValue);
    console.log('✅ SET 성공');

    // GET 테스트
    console.log('📖 GET 테스트...');
    const result = await redis.get(testKey);
    console.log('✅ GET 성공:', result);

    // 친구 테스트 키 설정
    const friendsKey = 'friends:test_user';
    const friendsValue = [
      {
        userId: 'test_user',
        friendId: 'friend_123',
        friendName: '테스트 친구',
        friendPhone: '010-1234-5678',
        friendAddress: 'rTestAddress123',
        isOnline: true,
        lastSeen: new Date(),
        createdAt: new Date().toISOString()
      }
    ];

    console.log('👥 친구 데이터 SET 테스트...');
    await redis.set(friendsKey, friendsValue);
    console.log('✅ 친구 데이터 SET 성공');

    console.log('👥 친구 데이터 GET 테스트...');
    const friendsResult = await redis.get(friendsKey);
    console.log('✅ 친구 데이터 GET 성공:', friendsResult);

    console.log('🎉 모든 Redis 연결 테스트 성공!');

  } catch (error) {
    console.error('❌ Redis 연결 테스트 실패:', error);
  }
}

testRedis();
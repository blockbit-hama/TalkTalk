require('dotenv').config({ path: '.env.development.local' });
const { kv } = require('@vercel/kv');

console.log('🗑️ 모든 데이터 초기화 시작...');

async function clearAllData() {
  // 1. Redis 데이터 삭제
  try {
    console.log('\n🔍 Redis 데이터 삭제 중...');
    const allKeys = await kv.keys('*');

    if (allKeys.length > 0) {
      console.log(`📝 Redis에서 ${allKeys.length}개 키 발견:`);
      allKeys.forEach((key, index) => {
        console.log(`  ${index + 1}. ${key}`);
      });

      const deletePromises = allKeys.map(key => kv.del(key));
      const results = await Promise.all(deletePromises);
      const deletedCount = results.reduce((count, result) => count + result, 0);

      console.log(`✅ Redis 삭제 완료: ${deletedCount}개 키 삭제됨`);
    } else {
      console.log('✅ Redis에 삭제할 데이터가 없습니다.');
    }
  } catch (error) {
    console.error('❌ Redis 삭제 실패:', error.message);
  }

  // 2. localStorage 삭제 안내
  console.log('\n🗂️ localStorage 삭제 방법:');
  console.log('브라우저에서 개발자 도구(F12) 열고 Console에서 실행:');
  console.log('');
  console.log('localStorage.clear();');
  console.log('sessionStorage.clear();');
  console.log('console.log("✅ 브라우저 저장소 삭제 완료");');
  console.log('');
  console.log('또는 Application/Storage 탭에서 모든 localStorage 항목 삭제');

  // 3. 삭제할 localStorage 키 목록 출력
  console.log('\n📋 삭제될 localStorage 키 목록:');
  const localStorageKeys = [
    'hdWallet_*',           // 브라우저별 지갑
    'wallets',              // HD 지갑 목록
    'selectedWalletId',     // 선택된 지갑 ID
    'enabledAssets',        // 활성화된 자산
    'serverRegistrations',  // 서버 등록 정보
    'registeredUsers'       // 등록된 사용자
  ];

  localStorageKeys.forEach((key, index) => {
    console.log(`  ${index + 1}. ${key}`);
  });

  console.log('\n🎯 브라우저 캐시도 삭제하는 것을 권장합니다:');
  console.log('   Chrome: Ctrl+Shift+Delete → 모든 데이터 삭제');
  console.log('   또는 시크릿/비공개 브라우징 모드 사용');

  console.log('\n🎉 초기화 가이드 완료!');
  console.log('브라우저에서 localStorage.clear() 실행 후 페이지 새로고침하세요.');
}

clearAllData().catch(console.error);
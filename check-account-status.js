require('dotenv').config({ path: '.env.development.local' });
const { Client } = require('xrpl');

console.log('🔍 서비스 Faucet으로 받은 XRP 계정 상태 확인 중...');

async function checkAccountStatus() {
  try {
    // XRPL Devnet 연결
    const client = new Client('wss://s.devnet.rippletest.net:51233');
    await client.connect();
    console.log('✅ XRPL Devnet 연결 성공');

    // 계정 주소들 확인
    const accounts = [
      'rBCgWARXCAWFmgW3o3nGMGcCx4viDQpZxc',  // 발신자
      'rEzJTfkwo2qup1ozjXcqvAEYJXGqNrUcpb'   // 수신자
    ];

    for (const address of accounts) {
      try {
        console.log(`\n🔍 계정 확인: ${address}`);
        
        const accountInfo = await client.request({
          command: 'account_info',
          account: address,
        });

        const balance = parseFloat(accountInfo.result.account_data.Balance);
        const balanceXRP = balance / 1000000; // drops to XRP

        console.log('✅ 계정 활성화됨:', {
          address: address,
          balance: `${balanceXRP} XRP (${balance} drops)`,
          sequence: accountInfo.result.account_data.Sequence,
          reserve: accountInfo.result.account_data.Reserve
        });

        // 잔액이 충분한지 확인
        if (balanceXRP < 20) {
          console.log(`⚠️ 잔액 부족: ${balanceXRP} XRP (최소 20 XRP 권장)`);
        } else {
          console.log(`✅ 잔액 충분: ${balanceXRP} XRP`);
        }

      } catch (error) {
        if (error.message && error.message.includes('Account not found')) {
          console.log(`❌ 계정 미활성화: ${address}`);
          console.log(`💡 서비스 내 Faucet 버튼을 다시 눌러주세요`);
        } else {
          console.log(`❌ 계정 조회 실패: ${error.message}`);
        }
      }
    }

    await client.disconnect();
    console.log('\n✅ 계정 상태 확인 완료');

  } catch (error) {
    console.error('❌ 계정 상태 확인 실패:', error);
  }
}

checkAccountStatus();
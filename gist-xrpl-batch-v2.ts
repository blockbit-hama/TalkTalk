/**
 * XRPL Native Batch Transaction V2 - XRPL v4.3.0 표준 구현
 *
 * 이 코드는 XRPL의 네이티브 Batch 트랜잭션 기능을 구현합니다.
 * XRPL 프로토콜 레벨에서 지원하는 일괄 트랜잭션으로
 * 여러 개의 지급을 하나의 트랜잭션으로 묶어 처리합니다.
 *
 * GitHub Gist: https://gist.github.com/YOUR_GITHUB_USERNAME/xrpl-batch-v2
 *
 * 주요 기능:
 * 1. Independent Mode - 각 지급이 독립적으로 실행
 * 2. AllOrNothing Mode - 하나라도 실패하면 전체 롤백
 * 3. UntilFailure Mode - 실패할 때까지 순차 실행
 *
 * XRPL 공식 문서: https://xrpl.org/batch.html
 */

import { Client, Wallet, Batch, Payment, xrpToDrops } from 'xrpl';

/**
 * 배치 지급 항목
 */
export interface BatchPaymentItem {
  to: string;
  amount: string;
  currency?: string;
  issuer?: string;
  memo?: string;
}

/**
 * 배치 트랜잭션 결과
 */
export interface BatchResult {
  success: boolean;
  transactionHash?: string;
  successCount?: number;
  failureCount?: number;
  totalAmount?: string;
  individualResults?: Array<{
    to: string;
    amount: string;
    success: boolean;
    error?: string;
  }>;
  error?: string;
}

/**
 * 배치 실행 모드
 */
export type BatchMode = 'Independent' | 'AllOrNothing' | 'UntilFailure';

/**
 * XRPL Native Batch Manager V2
 * 표준 XRPL v4.3.0 Batch 트랜잭션 구현
 */
export class XRPLBatchManagerV2 {
  private client: Client | null = null;
  private wallet: Wallet | null = null;

  constructor() {
    // Devnet 연결
    this.client = new Client("wss://s.devnet.rippletest.net:51233");
  }

  /**
   * XRPL 네트워크 연결
   */
  async connect(): Promise<boolean> {
    try {
      if (!this.client) {
        this.client = new Client("wss://s.devnet.rippletest.net:51233");
      }

      if (!this.client.isConnected()) {
        await this.client.connect();
        console.log('✅ XRPL Devnet 연결 성공');
      }
      return true;
    } catch (error) {
      console.error('❌ XRPL 연결 실패:', error);
      return false;
    }
  }

  /**
   * 지갑 설정
   */
  async setWallet(seedOrPrivateKey: string): Promise<boolean> {
    try {
      console.log('🔑 Batch 지갑 설정 시도');

      // 시드 또는 개인키로 지갑 생성
      if (seedOrPrivateKey.startsWith('s') && seedOrPrivateKey.length === 29) {
        this.wallet = Wallet.fromSeed(seedOrPrivateKey);
        console.log('✅ 시드로 Batch 지갑 설정 성공');
      } else if (seedOrPrivateKey.startsWith('ED') && seedOrPrivateKey.length === 66) {
        this.wallet = Wallet.fromSecret(seedOrPrivateKey);
        console.log('✅ 개인키로 Batch 지갑 설정 성공');
      } else {
        // 자동 판별
        try {
          this.wallet = Wallet.fromSeed(seedOrPrivateKey);
        } catch {
          this.wallet = Wallet.fromSecret(seedOrPrivateKey);
        }
      }

      console.log('✅ Batch 지갑 설정 완료:', this.wallet.address);
      return true;
    } catch (error) {
      console.error('❌ Batch 지갑 설정 실패:', error);
      return false;
    }
  }

  /**
   * 네이티브 XRPL Batch 트랜잭션 실행
   *
   * @param payments 지급 목록
   * @param mode 실행 모드
   * @returns BatchResult
   */
  async executeBatchPayments(
    payments: BatchPaymentItem[],
    mode: BatchMode = 'Independent'
  ): Promise<BatchResult> {
    if (!this.wallet || !this.client) {
      throw new Error('지갑이 설정되지 않았거나 연결되지 않았습니다.');
    }

    try {
      console.log(`🚀 Native XRPL Batch 트랜잭션 시작 (${mode} 모드)`);
      console.log(`📦 ${payments.length}개 지급 처리 예정`);

      // 개별 Payment 트랜잭션 생성
      const innerTransactions: Payment[] = payments.map((payment, index) => {
        console.log(`  ${index + 1}. ${payment.to}에게 ${payment.amount} ${payment.currency || 'XRP'} 전송`);

        const tx: Payment = {
          TransactionType: 'Payment',
          Account: this.wallet!.address,
          Destination: payment.to,
          Amount: payment.currency
            ? {
                currency: payment.currency,
                issuer: payment.issuer!,
                value: payment.amount
              }
            : xrpToDrops(payment.amount)
        };

        // 메모 추가 (선택적)
        if (payment.memo) {
          tx.Memos = [{
            Memo: {
              MemoType: Buffer.from('payment', 'utf8').toString('hex').toUpperCase(),
              MemoData: Buffer.from(payment.memo, 'utf8').toString('hex').toUpperCase()
            }
          }];
        }

        return tx;
      });

      // XRPL Native Batch 트랜잭션 생성
      const batchTransaction: Batch = {
        TransactionType: 'Batch',
        Account: this.wallet.address,
        BatchTransactions: innerTransactions,
        // 실행 모드에 따른 플래그 설정
        Flags: this.getBatchFlags(mode)
      };

      console.log('📦 Native Batch 트랜잭션 구성:', {
        type: 'Batch',
        mode: mode,
        count: innerTransactions.length,
        flags: batchTransaction.Flags
      });

      // 표준 XRPL 패턴: autofill → sign → submitAndWait
      const prepared = await this.client.autofill(batchTransaction);
      const signed = this.wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      console.log('📋 Batch 트랜잭션 결과:', result.result);

      if (result.result.validated) {
        // 메타데이터에서 개별 결과 추출
        const individualResults = this.extractIndividualResults(result.result.meta, payments);
        const successCount = individualResults.filter(r => r.success).length;
        const totalAmount = this.calculateTotalAmount(payments);

        console.log('✅ Native Batch 트랜잭션 성공!');
        console.log(`   성공: ${successCount}/${payments.length}건`);
        console.log(`   실패: ${payments.length - successCount}건`);
        console.log(`   총 금액: ${totalAmount}`);

        return {
          success: true,
          transactionHash: result.result.hash,
          successCount: successCount,
          failureCount: payments.length - successCount,
          totalAmount: totalAmount,
          individualResults: individualResults
        };
      } else {
        throw new Error(`Batch 트랜잭션 실패: ${result.result.engine_result}`);
      }

    } catch (error) {
      console.error('❌ Native Batch 트랜잭션 실패:', error);

      // 폴백: 개별 트랜잭션으로 처리
      if (error instanceof Error && error.message.includes('Batch')) {
        console.log('⚠️ Batch 미지원 감지, 개별 트랜잭션으로 폴백...');
        return await this.fallbackToIndividualTransactions(payments);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  /**
   * Batch 모드에 따른 플래그 반환
   */
  private getBatchFlags(mode: BatchMode): number {
    switch (mode) {
      case 'AllOrNothing':
        return 0x00080000; // tfAllOrNothing
      case 'UntilFailure':
        return 0x00100000; // tfUntilFailure
      case 'Independent':
      default:
        return 0x00040000; // tfIndependent
    }
  }

  /**
   * 메타데이터에서 개별 트랜잭션 결과 추출
   */
  private extractIndividualResults(meta: any, payments: BatchPaymentItem[]): any[] {
    const results = [];

    // 메타데이터에서 각 지급의 성공/실패 확인
    if (meta && meta.TransactionResult) {
      const batchResults = meta.BatchExecutions || [];

      for (let i = 0; i < payments.length; i++) {
        const payment = payments[i];
        const batchResult = batchResults[i];

        results.push({
          to: payment.to,
          amount: payment.amount,
          currency: payment.currency || 'XRP',
          success: batchResult ? batchResult.Result === 'tesSUCCESS' : false,
          error: batchResult && batchResult.Result !== 'tesSUCCESS' ? batchResult.Result : undefined
        });
      }
    } else {
      // 메타데이터가 없는 경우 기본값
      for (const payment of payments) {
        results.push({
          to: payment.to,
          amount: payment.amount,
          currency: payment.currency || 'XRP',
          success: true
        });
      }
    }

    return results;
  }

  /**
   * 총 전송 금액 계산
   */
  private calculateTotalAmount(payments: BatchPaymentItem[]): string {
    let totalXRP = 0;
    const totalTokens: { [key: string]: number } = {};

    for (const payment of payments) {
      if (payment.currency) {
        const key = `${payment.currency}:${payment.issuer}`;
        totalTokens[key] = (totalTokens[key] || 0) + parseFloat(payment.amount);
      } else {
        totalXRP += parseFloat(payment.amount);
      }
    }

    const amounts = [];
    if (totalXRP > 0) {
      amounts.push(`${totalXRP} XRP`);
    }
    for (const [key, amount] of Object.entries(totalTokens)) {
      const [currency] = key.split(':');
      amounts.push(`${amount} ${currency}`);
    }

    return amounts.join(', ');
  }

  /**
   * 폴백: 개별 트랜잭션으로 처리
   * Batch가 지원되지 않는 경우 사용
   */
  private async fallbackToIndividualTransactions(
    payments: BatchPaymentItem[]
  ): Promise<BatchResult> {
    console.log('🔄 개별 트랜잭션으로 폴백 처리 중...');

    const individualResults = [];
    let successCount = 0;

    for (const payment of payments) {
      try {
        const tx: Payment = {
          TransactionType: 'Payment',
          Account: this.wallet!.address,
          Destination: payment.to,
          Amount: payment.currency
            ? {
                currency: payment.currency,
                issuer: payment.issuer!,
                value: payment.amount
              }
            : xrpToDrops(payment.amount)
        };

        const prepared = await this.client!.autofill(tx);
        const signed = this.wallet!.sign(prepared);
        const result = await this.client!.submitAndWait(signed.tx_blob);

        if (result.result.validated) {
          successCount++;
          individualResults.push({
            to: payment.to,
            amount: payment.amount,
            success: true
          });
        } else {
          individualResults.push({
            to: payment.to,
            amount: payment.amount,
            success: false,
            error: result.result.engine_result
          });
        }
      } catch (error) {
        individualResults.push({
          to: payment.to,
          amount: payment.amount,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      success: successCount > 0,
      successCount: successCount,
      failureCount: payments.length - successCount,
      totalAmount: this.calculateTotalAmount(payments),
      individualResults: individualResults
    };
  }

  /**
   * 연결 해제
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
  }
}

// ============= 사용 예제 =============

async function batchExample() {
  const batchManager = new XRPLBatchManagerV2();

  // 1. 연결 및 지갑 설정
  await batchManager.connect();
  await batchManager.setWallet('sYourSeedHere'); // 실제 시드로 교체

  // 2. 배치 지급 목록 준비
  const payments: BatchPaymentItem[] = [
    {
      to: 'rAddress1',
      amount: '10',
      memo: '급여'
    },
    {
      to: 'rAddress2',
      amount: '5',
      memo: '보너스'
    },
    {
      to: 'rAddress3',
      amount: '20',
      currency: 'USD',
      issuer: 'rIssuerAddress',
      memo: '대금 지급'
    }
  ];

  // 3. Independent 모드로 배치 실행
  const independentResult = await batchManager.executeBatchPayments(payments, 'Independent');
  console.log('Independent 모드 결과:', independentResult);

  // 4. AllOrNothing 모드로 배치 실행
  const allOrNothingResult = await batchManager.executeBatchPayments(payments, 'AllOrNothing');
  console.log('AllOrNothing 모드 결과:', allOrNothingResult);

  // 5. UntilFailure 모드로 배치 실행
  const untilFailureResult = await batchManager.executeBatchPayments(payments, 'UntilFailure');
  console.log('UntilFailure 모드 결과:', untilFailureResult);

  await batchManager.disconnect();
}

// Singleton Instance
export const xrplBatchV2 = new XRPLBatchManagerV2();
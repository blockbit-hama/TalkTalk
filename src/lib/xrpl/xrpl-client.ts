import { Client, Wallet, Transaction, Payment } from 'xrpl';
import { XRPLAccount, XRPLToken, XRPLTransaction, XRPLTransferRequest, XRPLNetworkInfo } from '@/types/xrpl';

class XRPLClient {
  private client: Client | null = null;
  private wallet: Wallet | null = null;
  private networkInfo: XRPLNetworkInfo = {
    network: 'testnet',
    server: 'wss://s.altnet.rippletest.net:51233',
    fee: '0.000012',
    reserve: '10',
  };

  async connect(): Promise<boolean> {
    try {
      this.client = new Client(this.networkInfo.server);
      await this.client.connect();
      console.log('XRPL client connected');
      return true;
    } catch (error) {
      console.error('Failed to connect to XRPL:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
  }

  async createWallet(): Promise<XRPLAccount | null> {
    if (!this.client) {
      await this.connect();
    }

    if (!this.client) return null;

    try {
      const wallet = Wallet.generate();
      const accountInfo = await this.client.request({
        command: 'account_info',
        account: wallet.address,
      });

      const account: XRPLAccount = {
        address: wallet.address,
        secret: wallet.seed,
        balance: accountInfo.result.account_data.Balance || '0',
        sequence: accountInfo.result.account_data.Sequence || 0,
        reserve: this.networkInfo.reserve,
      };

      this.wallet = wallet;
      return account;
    } catch (error) {
      console.error('Failed to create wallet:', error);
      return null;
    }
  }

  async importWallet(secret: string): Promise<XRPLAccount | null> {
    if (!this.client) {
      await this.connect();
    }

    if (!this.client) return null;

    try {
      const wallet = Wallet.fromSeed(secret);
      const accountInfo = await this.client.request({
        command: 'account_info',
        account: wallet.address,
      });

      const account: XRPLAccount = {
        address: wallet.address,
        secret: secret,
        balance: accountInfo.result.account_data.Balance || '0',
        sequence: accountInfo.result.account_data.Sequence || 0,
        reserve: this.networkInfo.reserve,
      };

      this.wallet = wallet;
      return account;
    } catch (error) {
      console.error('Failed to import wallet:', error);
      return null;
    }
  }

  async getAccountInfo(address: string): Promise<XRPLAccount | null> {
    if (!this.client) {
      await this.connect();
    }

    if (!this.client) return null;

    // WebSocket 연결이 완료될 때까지 대기
    if (!this.client.isConnected()) {
      await this.client.connect();
    }

    try {
      console.log('🔍 XRPL 계정 정보 요청:', address);
      const accountInfo = await this.client.request({
        command: 'account_info',
        account: address,
      });

      const account: XRPLAccount = {
        address: address,
        balance: accountInfo.result.account_data.Balance || '0',
        sequence: accountInfo.result.account_data.Sequence || 0,
        reserve: this.networkInfo.reserve,
      };

      return account;
    } catch (error: any) {
      // "Account not found" 에러는 새 계정의 정상적인 상태
      if (error.message && error.message.includes('Account not found')) {
        console.log(`💡 새 계정 감지: ${address} (Faucet으로 XRP를 충전해야 합니다)`);
      } else {
        console.error('XRPL 계정 정보 조회 실패:', error);
      }
      return null;
    }
  }

  async getAccountTokens(address: string): Promise<XRPLToken[]> {
    if (!this.client) {
      await this.connect();
    }

    if (!this.client) return [];

    // WebSocket 연결이 완료될 때까지 대기
    if (!this.client.isConnected()) {
      await this.client.connect();
    }

    try {
      const accountLines = await this.client.request({
        command: 'account_lines',
        account: address,
      });

      const tokens: XRPLToken[] = accountLines.result.lines.map((line: any) => ({
        currency: line.currency,
        issuer: line.account,
        value: line.balance,
      }));

      return tokens;
    } catch (error: any) {
      // "Account not found" 에러는 새 계정의 정상적인 상태
      if (error.message && error.message.includes('Account not found')) {
        console.log(`💡 새 계정 토큰 조회: ${address} (아직 Trust Line이 없습니다)`);
      } else {
        console.error('XRPL 토큰 정보 조회 실패:', error);
      }
      return [];
    }
  }

  async sendXRP(request: XRPLTransferRequest): Promise<XRPLTransaction | null> {
    if (!this.client || !this.wallet) {
      return null;
    }

    try {
      const payment: Payment = {
        TransactionType: 'Payment',
        Account: this.wallet.address,
        Destination: request.to,
        Amount: request.amount,
        Fee: this.networkInfo.fee,
      };

      if (request.destinationTag) {
        payment.DestinationTag = request.destinationTag;
      }

      if (request.memo) {
        payment.Memos = [{
          Memo: {
            MemoData: Buffer.from(request.memo, 'utf8').toString('hex').toUpperCase(),
          },
        }];
      }

      if (request.invoiceId) {
        payment.InvoiceID = request.invoiceId;
      }

      const prepared = await this.client.autofill(payment);
      const signed = this.wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed);

      const transaction: XRPLTransaction = {
        hash: result.result.hash,
        type: 'Payment',
        from: this.wallet.address,
        to: request.to,
        amount: request.amount,
        currency: 'XRP',
        fee: this.networkInfo.fee,
        timestamp: new Date(),
        status: result.result.validated ? 'success' : 'failed',
        metadata: {
          destinationTag: request.destinationTag,
          memo: request.memo,
          invoiceId: request.invoiceId,
        },
      };

      return transaction;
    } catch (error) {
      console.error('Failed to send XRP:', error);
      return null;
    }
  }

  async sendToken(request: XRPLTransferRequest, currency: string, issuer: string): Promise<XRPLTransaction | null> {
    if (!this.client || !this.wallet) {
      return null;
    }

    try {
      const payment: Payment = {
        TransactionType: 'Payment',
        Account: this.wallet.address,
        Destination: request.to,
        Amount: {
          currency: currency,
          issuer: issuer,
          value: request.amount,
        },
        Fee: this.networkInfo.fee,
      };

      if (request.destinationTag) {
        payment.DestinationTag = request.destinationTag;
      }

      if (request.memo) {
        payment.Memos = [{
          Memo: {
            MemoData: Buffer.from(request.memo, 'utf8').toString('hex').toUpperCase(),
          },
        }];
      }

      if (request.invoiceId) {
        payment.InvoiceID = request.invoiceId;
      }

      const prepared = await this.client.autofill(payment);
      const signed = this.wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed);

      const transaction: XRPLTransaction = {
        hash: result.result.hash,
        type: 'Payment',
        from: this.wallet.address,
        to: request.to,
        amount: request.amount,
        currency: currency,
        fee: this.networkInfo.fee,
        timestamp: new Date(),
        status: result.result.validated ? 'success' : 'failed',
        metadata: {
          destinationTag: request.destinationTag,
          memo: request.memo,
          invoiceId: request.invoiceId,
        },
      };

      return transaction;
    } catch (error) {
      console.error('Failed to send token:', error);
      return null;
    }
  }

  async getTransactionHistory(address: string, limit: number = 20): Promise<XRPLTransaction[]> {
    if (!this.client) {
      await this.connect();
    }

    if (!this.client) return [];

    try {
      const accountTx = await this.client.request({
        command: 'account_tx',
        account: address,
        limit: limit,
      });

      const transactions: XRPLTransaction[] = accountTx.result.transactions.map((tx: any) => ({
        hash: tx.tx.hash,
        type: tx.tx.TransactionType,
        from: tx.tx.Account,
        to: tx.tx.Destination,
        amount: tx.tx.Amount,
        currency: typeof tx.tx.Amount === 'string' ? 'XRP' : tx.tx.Amount.currency,
        fee: tx.tx.Fee,
        timestamp: new Date(tx.tx.date * 1000),
        status: 'success',
        metadata: {
          destinationTag: tx.tx.DestinationTag,
          memo: tx.tx.Memos?.[0]?.Memo?.MemoData,
          invoiceId: tx.tx.InvoiceID,
        },
      }));

      return transactions;
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  }

  async estimateFee(): Promise<string> {
    if (!this.client) {
      await this.connect();
    }

    if (!this.client) return this.networkInfo.fee;

    try {
      const fee = await this.client.request({
        command: 'fee',
      });

      return fee.result.drops.base_fee;
    } catch (error) {
      console.error('Failed to estimate fee:', error);
      return this.networkInfo.fee;
    }
  }

  getNetworkInfo(): XRPLNetworkInfo {
    return this.networkInfo;
  }

  setNetwork(network: 'mainnet' | 'testnet' | 'devnet'): void {
    switch (network) {
      case 'mainnet':
        this.networkInfo = {
          network: 'mainnet',
          server: 'wss://xrplcluster.com',
          fee: '0.000012',
          reserve: '10',
        };
        break;
      case 'testnet':
        this.networkInfo = {
          network: 'testnet',
          server: 'wss://s.altnet.rippletest.net:51233',
          fee: '0.000012',
          reserve: '10',
        };
        break;
      case 'devnet':
        this.networkInfo = {
          network: 'devnet',
          server: 'wss://s.devnet.rippletest.net:51233',
          fee: '0.000012',
          reserve: '10',
        };
        break;
    }
  }
}

// Singleton instance
export const xrplClient = new XRPLClient();
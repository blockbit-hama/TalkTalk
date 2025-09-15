import { atom } from 'jotai';
import { XRPLAccount, XRPLToken, XRPLTransaction, XRPLNetworkInfo } from '@/types/xrpl';

// XRPL Account
export const xrplAccountAtom = atom<XRPLAccount | null>(null);

// XRPL Tokens
export const xrplTokensAtom = atom<XRPLToken[]>([]);

// XRPL Transactions
export const xrplTransactionsAtom = atom<XRPLTransaction[]>([]);

// Network Info
export const xrplNetworkInfoAtom = atom<XRPLNetworkInfo>({
  network: 'testnet',
  server: 'wss://s.altnet.rippletest.net:51233',
  fee: '0.000012',
  reserve: '10',
});

// Connection state
export const isXRPLConnectedAtom = atom<boolean>(false);
export const isXRPLLoadingAtom = atom<boolean>(false);
export const xrplErrorAtom = atom<string | null>(null);

// Derived atoms
export const xrplBalanceAtom = atom((get) => {
  const account = get(xrplAccountAtom);
  return account?.balance || '0';
});

export const xrplAddressAtom = atom((get) => {
  const account = get(xrplAccountAtom);
  return account?.address || '';
});

export const xrplSequenceAtom = atom((get) => {
  const account = get(xrplAccountAtom);
  return account?.sequence || 0;
});

export const xrplReserveAtom = atom((get) => {
  const account = get(xrplAccountAtom);
  return account?.reserve || '10';
});

export const availableBalanceAtom = atom((get) => {
  const account = get(xrplAccountAtom);
  const reserve = get(xrplReserveAtom);
  
  if (!account) return '0';
  
  const balance = parseFloat(account.balance);
  const reserveAmount = parseFloat(reserve);
  
  return Math.max(0, balance - reserveAmount).toString();
});

export const recentTransactionsAtom = atom((get) => {
  const transactions = get(xrplTransactionsAtom);
  return transactions.slice(0, 10); // Last 10 transactions
});

// Action atoms
export const connectXRPLAtom = atom(
  null,
  async (get, set) => {
    set(isXRPLLoadingAtom, true);
    set(xrplErrorAtom, null);
    
    try {
      // This would typically call the XRPL client
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      set(isXRPLConnectedAtom, true);
      set(isXRPLLoadingAtom, false);
    } catch (error) {
      set(xrplErrorAtom, error instanceof Error ? error.message : 'Connection failed');
      set(isXRPLLoadingAtom, false);
    }
  }
);

export const createXRPLWalletAtom = atom(
  null,
  async (get, set) => {
    set(isXRPLLoadingAtom, true);
    set(xrplErrorAtom, null);
    
    try {
      // This would typically call the XRPL client
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newAccount: XRPLAccount = {
        address: 'rTest123456789012345678901234567890123456',
        secret: 'sTest123456789012345678901234567890123456',
        balance: '1000',
        sequence: 1,
        reserve: '10',
      };
      
      set(xrplAccountAtom, newAccount);
      set(isXRPLLoadingAtom, false);
    } catch (error) {
      set(xrplErrorAtom, error instanceof Error ? error.message : 'Wallet creation failed');
      set(isXRPLLoadingAtom, false);
    }
  }
);

export const importXRPLWalletAtom = atom(
  null,
  async (get, set, secret: string) => {
    set(isXRPLLoadingAtom, true);
    set(xrplErrorAtom, null);
    
    try {
      // This would typically call the XRPL client
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const importedAccount: XRPLAccount = {
        address: 'rImported123456789012345678901234567890123',
        secret: secret,
        balance: '500',
        sequence: 1,
        reserve: '10',
      };
      
      set(xrplAccountAtom, importedAccount);
      set(isXRPLLoadingAtom, false);
    } catch (error) {
      set(xrplErrorAtom, error instanceof Error ? error.message : 'Wallet import failed');
      set(isXRPLLoadingAtom, false);
    }
  }
);

export const refreshXRPLDataAtom = atom(
  null,
  async (get, set) => {
    const account = get(xrplAccountAtom);
    if (!account) return;
    
    set(isXRPLLoadingAtom, true);
    set(xrplErrorAtom, null);
    
    try {
      // This would typically call the XRPL client
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate updated balance
      const updatedAccount = {
        ...account,
        balance: (parseFloat(account.balance) + Math.random() * 10).toString(),
        sequence: account.sequence + 1,
      };
      
      set(xrplAccountAtom, updatedAccount);
      set(isXRPLLoadingAtom, false);
    } catch (error) {
      set(xrplErrorAtom, error instanceof Error ? error.message : 'Data refresh failed');
      set(isXRPLLoadingAtom, false);
    }
  }
);

export const sendXRPAtom = atom(
  null,
  async (get, set, { to, amount, memo }: {
    to: string;
    amount: string;
    memo?: string;
  }) => {
    set(isXRPLLoadingAtom, true);
    set(xrplErrorAtom, null);
    
    try {
      // This would typically call the XRPL client
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const account = get(xrplAccountAtom);
      if (!account) throw new Error('No account found');
      
      // Simulate transaction
      const transaction: XRPLTransaction = {
        hash: `tx_${Date.now()}`,
        type: 'Payment',
        from: account.address,
        to: to,
        amount: amount,
        currency: 'XRP',
        fee: '0.000012',
        timestamp: new Date(),
        status: 'success',
        metadata: { memo },
      };
      
      // Update transactions
      set(xrplTransactionsAtom, [transaction, ...get(xrplTransactionsAtom)]);
      
      // Update balance
      const newBalance = (parseFloat(account.balance) - parseFloat(amount) - 0.000012).toString();
      set(xrplAccountAtom, { ...account, balance: newBalance });
      
      set(isXRPLLoadingAtom, false);
      return transaction;
    } catch (error) {
      set(xrplErrorAtom, error instanceof Error ? error.message : 'XRP send failed');
      set(isXRPLLoadingAtom, false);
      throw error;
    }
  }
);

export const setXRPLNetworkAtom = atom(
  null,
  (get, set, network: 'mainnet' | 'testnet' | 'devnet') => {
    const networkInfo: XRPLNetworkInfo = {
      network,
      server: network === 'mainnet' 
        ? 'wss://xrplcluster.com'
        : network === 'testnet'
        ? 'wss://s.altnet.rippletest.net:51233'
        : 'wss://s.devnet.rippletest.net:51233',
      fee: '0.000012',
      reserve: '10',
    };
    
    set(xrplNetworkInfoAtom, networkInfo);
  }
);
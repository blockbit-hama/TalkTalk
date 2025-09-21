export interface XRPLAccount {
  address: string;
  secret?: string; // For wallet creation
  balance: string;
  sequence: number;
  reserve: string;
}

export interface XRPLToken {
  currency: string;
  issuer?: string;
  value: string;
  balance?: string;
}

export interface XRPLTransaction {
  hash: string;
  type: 'Payment' | 'TrustSet' | 'OfferCreate' | 'OfferCancel' | 'AccountSet';
  from: string;
  to?: string;
  amount: string;
  currency: string;
  fee: string;
  timestamp: Date;
  status: 'pending' | 'success' | 'failed';
  metadata?: {
    destinationTag?: number;
    memo?: string;
    invoiceId?: string;
  };
}

export interface XRPLTransferRequest {
  to: string;
  amount: string;
  currency: string;
  destinationTag?: number;
  memo?: string;
  invoiceId?: string;
}

export interface XRPLNetworkInfo {
  network: 'mainnet' | 'devnet';
  server: string;
  fee: string;
  reserve: string;
}

export interface XRPLWalletState {
  account?: XRPLAccount;
  tokens: XRPLToken[];
  transactions: XRPLTransaction[];
  networkInfo: XRPLNetworkInfo;
  isConnected: boolean;
  isLoading: boolean;
  error?: string;
}
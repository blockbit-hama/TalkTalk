export interface WalletBalance {
  xrpBalance: string;
  address: string;
}

export interface TransferEstimate {
  estimatedFee: string;
}

export interface WalletInfo {
  id: string;
  name: string;
  address: string;
}
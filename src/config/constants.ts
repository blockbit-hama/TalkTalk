// 환경 설정
export const ENV = {
  DEV: 'dev',
  TEST: 'test',
  PROD: 'prod'
} as const;

// API 엔드포인트
export const API_ENDPOINTS = {
  BASE_URL: process.env.GAS_COUPON_API_URL || 'http://localhost:9001',
  EXCHANGE_RATE: '/api/v1/exchange-rate',
  SPONSOR_TRANSACTION: '/api/v1/transaction/sponsor',
  TRANSACTION_STATUS: '/api/v1/transaction/status',
  NONCE: '/api/v1/auth/nonce'
} as const;

// 지갑 관련 상수
export const WALLET_CONSTANTS = {
  MNEMONIC_LENGTH: 12,
  DERIVATION_PATHS: {
    BTC: "m/44'/0'/0'/0/0",
    ETH: "m/44'/60'/0'/0/0",
    USDT: "m/44'/60'/0'/0/0",
    ETH_GOERLI: "m/44'/60'/0'/0/1",
    ETH_SEPOLIA: "m/44'/60'/0'/0/2",
    MATIC: "m/44'/60'/0'/0/3",
    BSC: "m/44'/60'/0'/0/4",
    AVAX: "m/44'/60'/0'/0/5"
  }
} as const;

// 가상자산 상수
export const ASSET_CONSTANTS = {
  DEFAULT_ENABLED_ASSETS: ['XRP', 'USD', 'CNY', 'EUR'],
  STORAGE_KEY: 'enabledAssets',
  
  // 자산 정보 (로컬 메모리용)
  ASSET_INFO: {
    XRP: {
      symbol: 'XRP',
      name: 'XRP',
      icon: 'X',
      color: '#F2A003',
      decimals: 6,
      type: 'native'
    },
    USD: {
      symbol: 'USD',
      name: 'US Dollar',
      icon: '$',
      color: '#26A17B',
      decimals: 2,
      type: 'token',
      issuer: 'rJgqyVQrzRQTQREVTYK21843LR7vb7LapX'
    },
    CNY: {
      symbol: 'CNY',
      name: 'Chinese Yuan',
      icon: '¥',
      color: '#FF6B6B',
      decimals: 2,
      type: 'token',
      issuer: 'rKNeAZt7zMLinPBBuopNk6uejPeARgEt5x'
    },
    EUR: {
      symbol: 'EUR',
      name: 'Euro',
      icon: '€',
      color: '#4ECDC4',
      decimals: 2,
      type: 'token',
      issuer: 'rBXYWgAg6z5NxCshzGkNuX3YjHFyN26cgj'
    },
    TST: {
      symbol: 'TST',
      name: 'Test Token',
      icon: 'T',
      color: '#9B59B6',
      decimals: 2,
      type: 'token',
      issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd'
    }
  }
} as const;

// UI 상수
export const UI_CONSTANTS = {
  COLORS: {
    PRIMARY: '#F2A003',
    SUCCESS: '#6FCF97',
    ERROR: '#EB5757',
    BACKGROUND: '#1A1A1A',
    CARD_BACKGROUND: '#23242A'
  }
} as const; 
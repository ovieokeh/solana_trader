export interface Coin {
  name?: string
  symbol?: string
  address?: string
  mint?: string
  decimals: number
  chainId?: number
}
export interface ValidCoin {
  name: string
  symbol: string
  address: string
  decimals: number
  chainId?: number
}

export interface CoinPriceData {
  value: number
  updateUnixTime: number
  updateHumanTime: string
  priceChange24h: number
  liquidity: number
}

export interface Token {
  address: string
  timestamp: number // The timestamp when the token was added for tracking
}

export interface MarketOrderConfig {
  amount: number
}

export interface LimitOrderConfig {
  amount: number
  targetPrice: number
}

export interface EnrichedTokenData {
  address: string
  symbol: string
  name: string
  price: number
  decimals: number
  priceChange30mPercent: number
  priceChange1hPercent: number
  uniqueView30m: number
  uniqueWallet30m: number
  v1hUSD: number
  v30mUSD: number
  liquidity: number
}

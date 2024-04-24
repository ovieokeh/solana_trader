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
  logoURI: string
  price: number
  priceChange30mPercent: number
  priceChange1hPercent: number
  priceChange2hPercent: number
  priceChange4hPercent: number
  priceChange6hPercent: number
  priceChange8hPercent: number
  priceChange12hPercent: number
  priceChange24hPercent: number
  tradingVolumeChangePercent: number
  view30mChangePercent: number
  uniqueView30mChangePercent: number
}

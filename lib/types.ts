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

export interface BaseTokenDetails {
  address: string
  symbol: string
  name: string
  decimals: number
  dailyVolume?: number
}

export interface JupiterExtendedPriceData {
  id: string
  type: string
  price: string
  lastSwappedPrice: {
    lastJupiterSellAt: number
    lastJupiterSellPrice: string
    lastJupiterBuyAt: number
    lastJupiterBuyPrice: string
  }
  quotedPrice: {
    buyPrice: string
    buyAt: number
    sellPrice: string
    sellAt: number
  }
  confidenceLevel: string
  depth: {
    buyPriceImpactRatio: {
      depth: {
        10: number
        100: number
        1000: number
      }
      timestamp: number
    }
    sellPriceImpactRatio: {
      depth: {
        10: number
        100: number
        1000: number
      }
      timestamp: number
    }
  }
}

export interface TokenDetailsWithExtendedPrice extends BaseTokenDetails {
  priceData: JupiterExtendedPriceData
}

export interface TokenDetailsWithPrice extends BaseTokenDetails {
  price: number
  priceMovement: BirdEyeHistoricalPriceData
}

export interface BirdEyePriceData {
  value: number
  updateUnixTime: number
  updateHumanTime: string
}

export interface BirdEyeHistoricalPriceData {
  items: {
    unixTime: number
    value: number
  }[]
}

export interface EnrichedSolanaFMTokenData {
  mint: string
  tokenName: string
  symbol: string
  decimals: number
  description: string
  logo: string
  tags: string[]
  verified: string
  network: string[]
  metadataToken: string
}

export interface SolanaFMSupplyData {
  circulatingSupply: number
  tokenWithheldAmount: number
  userTotalWithheldAmount: number
  totalWithheldAmount: number
  realCirculatingSupply: number
  decimals: number
}

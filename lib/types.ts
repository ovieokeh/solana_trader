export interface Coin {
  name?: string
  symbol?: string
  address?: string
  mint?: string
  decimals: number
  chainId?: number
}

export interface Token {
  address: string
  timestamp: number // The timestamp when the token was added for tracking
}

export interface BaseTokenDetails {
  address: string
  symbol: string
  name: string
  decimals: number
  dailyVolume?: number
}

export interface JupiterMarketOrderConfig {
  amount: number
}

export interface JupiterLimitOrderConfig {
  amount: number
  targetPrice: number
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

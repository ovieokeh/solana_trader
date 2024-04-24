import fetch from 'node-fetch'

import { createLogger } from './logger'
import type { EnrichedTokenData, Token } from '../types'
import { createLimitOrder, createMarketOrder } from './trader'

const log = createLogger('coin-analysis.ts')
const BIRDEYE_API_KEY = process.env['BIRDEYE_API_KEY']

if (!BIRDEYE_API_KEY) {
  throw new Error('BIRDEYE_API_KEY is required but was not provided.')
}

async function enrichTokenData(
  address: string,
): Promise<EnrichedTokenData | null> {
  const options = {
    method: 'GET',
    headers: { 'X-API-KEY': BIRDEYE_API_KEY! },
  }

  try {
    const response = await fetch(
      `https://public-api.birdeye.so/defi/token_overview?address=${address}`,
      options,
    )
    if (!response.ok) {
      // Consider retry logic here
      log(`Response not OK, status: ${response.status}`)
      return null
    }
    const parsedResponse = (await response.json()) as {
      data: EnrichedTokenData
    }
    return parsedResponse.data
  } catch (error) {
    log(`Error fetching data for address ${address}: `, error)
    return null
  }
}

function matchesBuyCriteria(tokenData: EnrichedTokenData): boolean {
  return (
    tokenData.priceChange6hPercent > 100 &&
    tokenData.tradingVolumeChangePercent > 200 &&
    tokenData.view30mChangePercent > 100 &&
    tokenData.uniqueView30mChangePercent > 50
  )
}

async function processPromisingCoin(
  token: Token,
  tokenData: EnrichedTokenData,
): Promise<void> {
  const BUY_AMOUNT_SOL = 0.005
  const buyAmount = BUY_AMOUNT_SOL / tokenData.price

  const stopLossPercentage = 0.85
  const firstTakeProfitPercentage = 1.5
  const secondTakeProfitPercentage = 5.0

  // Calculating dynamic trading parameters
  const stopLossPrice = tokenData.price * stopLossPercentage
  const firstTakeProfitPrice = tokenData.price * firstTakeProfitPercentage
  // remove 75% of the initial buy amount
  const firstTakeProfitAmount = buyAmount * 0.25
  const secondTakeProfitPrice = tokenData.price * secondTakeProfitPercentage
  // remove remaining 25% of the initial buy amount
  const secondTakeProfitAmount = buyAmount * 0.75

  const resolvedMarketOrder = await createMarketOrder(token.address, {
    amount: buyAmount,
  })

  const limitOrders = [
    createLimitOrder(token.address, {
      amount: buyAmount,
      targetPrice: stopLossPrice,
    }),
    createLimitOrder(token.address, {
      amount: firstTakeProfitAmount,
      targetPrice: firstTakeProfitPrice,
    }),
    createLimitOrder(token.address, {
      amount: secondTakeProfitAmount,
      targetPrice: secondTakeProfitPrice,
    }),
  ]

  const resolvedLimitOrders = await Promise.all(limitOrders)

  const completeRecord = {
    token,
    tokenData,
    stopLossPrice,
    firstTakeProfitPrice,
    secondTakeProfitPrice,
    resolvedMarketOrder,
    resolvedLimitOrders,
  }

  const TRADES_REGISTER_PATH = 'data/trades.json'
  const TRADES_REGISTER = await Bun.file(TRADES_REGISTER_PATH).json()

  await Bun.write('data/trades.json', {
    ...TRADES_REGISTER,
    [token.address]: completeRecord,
  })
}

export async function processTrackedCoins(
  trackedCoins: Token[],
): Promise<Token[]> {
  const currentTime = Date.now()
  const oneHour = 60 * 60 * 1000 // One hour in milliseconds

  const remainingCoins = trackedCoins.filter(async (token) => {
    const tokenData = await enrichTokenData(token.address)
    if (!tokenData) {
      return false // Remove token if data couldn't be fetched
    }

    if (matchesBuyCriteria(tokenData)) {
      await processPromisingCoin(token, tokenData)
      return false // Token was promising and processed, remove it
    } else {
      return currentTime - token.timestamp <= oneHour // Keep token if it hasn't been there for over one hour
    }
  })

  return Promise.all(remainingCoins)
}

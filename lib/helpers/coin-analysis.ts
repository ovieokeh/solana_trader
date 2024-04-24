import fetch from 'node-fetch'

import { createLogger } from './logger'
import type { EnrichedTokenData, Token } from '../types'
import { createLimitOrder, createMarketOrder } from './trader'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { TRADE_AMOUNT_IN_SOL } from '../config/general'

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
  const MINIMUM_LIQUIDITY_THRESHOLD = 20_000
  const MINIMUM_VIEW_INCREASE_PERCENT = 20
  const MINIMUM_WALLET_INTERACTION = 200
  const VOLUME_SPIKE_PERCENT = 200
  const PRICE_SURGE_MIN_PERCENT = 100

  const volumeSpikeLastHour =
    tokenData.v1hUSD > tokenData.v30mUSD * (1 + VOLUME_SPIKE_PERCENT / 100)
  const priceSurge =
    tokenData.priceChange30mPercent > PRICE_SURGE_MIN_PERCENT ||
    tokenData.priceChange1hPercent > PRICE_SURGE_MIN_PERCENT
  const liquidityCheck = tokenData.liquidity > MINIMUM_LIQUIDITY_THRESHOLD
  const socialSentimentPositive =
    tokenData.uniqueView30m > MINIMUM_WALLET_INTERACTION &&
    tokenData.uniqueWallet30m > MINIMUM_VIEW_INCREASE_PERCENT

  log('matchesBuyCriteria', {
    volumeSpikeLastHour,
    priceSurge,
    liquidityCheck,
    socialSentimentPositive,
  })

  return (
    volumeSpikeLastHour &&
    priceSurge &&
    liquidityCheck &&
    socialSentimentPositive
  )
}

async function processPromisingCoin(
  token: Token,
  tokenData: EnrichedTokenData,
): Promise<void> {
  try {
    const BUY_PRICE_SOL = Math.floor(TRADE_AMOUNT_IN_SOL * LAMPORTS_PER_SOL)
    const TOKEN_PRICE = tokenData.price * Math.pow(10, tokenData.decimals)

    const buyAmount =
      BUY_PRICE_SOL / TOKEN_PRICE > 1
        ? Math.floor(BUY_PRICE_SOL / TOKEN_PRICE)
        : 10_000
    const stopLossPercentage = 0.85
    const firstTakeProfitPercentage = 1.5
    const secondTakeProfitPercentage = 5.0

    // Correct profit calculation logic
    const stopLossPrice = TOKEN_PRICE * stopLossPercentage
    const firstTakeProfitPrice = TOKEN_PRICE * firstTakeProfitPercentage
    // Sell 75% of the initial buy amount at the first target
    const firstTakeProfitAmount = Math.ceil(buyAmount * 0.75)
    const secondTakeProfitPrice = TOKEN_PRICE * secondTakeProfitPercentage
    // Sell remaining 25% of the initial buy amount at the second target
    const secondTakeProfitAmount = buyAmount - firstTakeProfitAmount

    const resolvedMarketOrder = await createMarketOrder(token.address, {
      amount: buyAmount,
    })

    if (!resolvedMarketOrder) {
      log('Unable to create market order.')
      return
    }

    const limitOrders = [
      createLimitOrder(token.address, {
        amount: firstTakeProfitAmount,
        targetPrice: firstTakeProfitPrice,
      }),
      createLimitOrder(token.address, {
        amount: buyAmount,
        targetPrice: stopLossPrice,
      }),
      createLimitOrder(token.address, {
        amount: secondTakeProfitAmount,
        targetPrice: secondTakeProfitPrice,
      }),
    ]

    const resolvedLimitOrders: (string | undefined)[] = []
    for await (const order of limitOrders) {
      resolvedLimitOrders.push(order)
    }

    const completeRecord = {
      token,
      tokenData,
      stopLossPrice,
      firstTakeProfitPrice,
      secondTakeProfitPrice,
      buyAmount,
      resolvedMarketOrder,
      resolvedLimitOrders,
    }

    const TRADES_REGISTER_PATH = 'data/trades.json'
    const tradesRegister = await Bun.file(TRADES_REGISTER_PATH)
      .json()
      .catch(() => ({}))

    await Bun.write(TRADES_REGISTER_PATH, {
      ...tradesRegister,
      [token.address]: completeRecord,
    })
  } catch (error: any) {
    log(`ProcessPromisingCoin Error: ${error.message}`)
  }
}

export async function processTrackedCoins(
  trackedCoins: Token[],
): Promise<Token[]> {
  log('processing tracked coins')

  if (trackedCoins.length === 0) {
    log('no tracked coins. exiting...')
    return []
  }

  const currentTime = Date.now()
  const oneHour = 60 * 60 * 1000 // One hour in milliseconds

  const remainingCoins = trackedCoins.filter(async (token) => {
    log('processing token', token.address)

    const tokenData = await enrichTokenData(token.address)
    if (!tokenData) {
      log('token data could not be fetched')
      return false // Remove token if data couldn't be fetched
    }

    log('checking buy criteria', tokenData.name, tokenData.symbol)

    if (matchesBuyCriteria(tokenData)) {
      try {
        await processPromisingCoin(token, tokenData)
        log('token matched buy criteria and processed')
      } catch {
      } finally {
        return false // Token was promising and processed, remove it
      }
    } else {
      log('token did not match buy criteria')
      return currentTime - token.timestamp <= oneHour // Keep token if it hasn't been there for over one hour
    }
  })

  return Promise.all(remainingCoins)
}

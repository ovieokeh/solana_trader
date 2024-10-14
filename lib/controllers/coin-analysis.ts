import { LAMPORTS_PER_SOL } from '@solana/web3.js'

import type { Token, TokenDetailsWithExtendedPrice } from '../types'
import { TRADE_AMOUNT_IN_SOL } from '../config/general'
import { createLogger } from '../utils/logger'

import { createLimitOrder, createMarketOrder } from './trader'
import { fetchTokenDetails, fetchTokenPrice } from '../utils/jupiter-ag'

const log = createLogger('coin-analysis.ts')

const removeTrackedCoin = (trackedCoins: Token[], token: Token) => {
  const indexOfToken = trackedCoins.findIndex(
    (coin) => coin.address === token.address,
  )
  trackedCoins.splice(indexOfToken, 1)
}

async function processPromisingCoin(
  token: Token,
  tokenData: TokenDetailsWithExtendedPrice,
): Promise<void> {
  try {
    const BUY_PRICE_SOL = Math.floor(TRADE_AMOUNT_IN_SOL * LAMPORTS_PER_SOL)
    const TOKEN_PRICE =
      +tokenData.priceData.price * Math.pow(10, tokenData.decimals)

    const buyAmount =
      BUY_PRICE_SOL / TOKEN_PRICE > 1
        ? Math.floor(BUY_PRICE_SOL / TOKEN_PRICE)
        : 10_000
    const stopLossPercentage = 0.85
    const firstTakeProfitPercentage = 1.5
    const secondTakeProfitPercentage = 2.5

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

    await Bun.write(
      TRADES_REGISTER_PATH,
      JSON.stringify({
        ...tradesRegister,
        [token.address]: completeRecord,
      }),
    )
  } catch (error: any) {
    log(`ProcessPromisingCoin Error: ${error.message}`)
  }
}

export async function processTrackedCoins(
  trackedCoins: Token[],
): Promise<Token[]> {
  log('processing tracked coins')

  if (trackedCoins.length === 0) {
    log('no tracked coins. sleeping...')
    return []
  }

  for await (const token of trackedCoins) {
    log('processing token', token.address)

    const [baseTokenDetailsQuery, tokenPriceDataQuery] =
      await Promise.allSettled([
        fetchTokenDetails(token.address),
        fetchTokenPrice(token.address),
      ])

    if (baseTokenDetailsQuery.status === 'rejected') {
      log('token data could not be fetched')
      removeTrackedCoin(trackedCoins, token)
      continue
    }
    if (tokenPriceDataQuery.status === 'rejected') {
      log('token price data could not be fetched')
      removeTrackedCoin(trackedCoins, token)
      continue
    }

    const baseTokenDetails = baseTokenDetailsQuery.value
    const tokenPriceData = tokenPriceDataQuery.value
    if (!baseTokenDetails || !tokenPriceData) {
      log('token data or price data not found', {
        baseTokenDetails,
        tokenPriceData,
      })
      removeTrackedCoin(trackedCoins, token)
      continue
    }

    const tokenData: TokenDetailsWithExtendedPrice = {
      ...baseTokenDetails,
      priceData: tokenPriceData,
    }

    log('checking buy criteria', tokenData.symbol, tokenData.address)

    try {
      await processPromisingCoin(token, tokenData)
      log('token matched buy criteria and processed')
      removeTrackedCoin(trackedCoins, token)
    } catch (error: any) {
      log('unhandled error processing promising coin:', error.message)
    } finally {
      continue
    }
  }

  return Promise.all(trackedCoins)
}

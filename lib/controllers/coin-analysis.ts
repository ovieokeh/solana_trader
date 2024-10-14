import { LAMPORTS_PER_SOL } from '@solana/web3.js'

import type { Token, TokenDetailsWithExtendedPrice } from '../types'
import { TRADE_AMOUNT_IN_SOL } from '../config/general'
import { createLogger } from '../utils/logger'

import { createLimitOrder, createMarketOrder } from './trader'
import { fetchTokenDetails, fetchTokenPrice } from './apis/jupiter-ag'

const log = createLogger('coin-analysis.ts')

function matchesBuyCriteria(
  enrichedToken: TokenDetailsWithExtendedPrice,
): boolean {
  // price data comes in chunks of 15 minutes
  // we want an increase of at least 150 points in the last 1 hour
  return true
  // const PRICE_DIFFERENCE_THRESHOLD = 150

  // const priceData = enrichedToken.priceMovement.items
  // const priceDataLength = priceData.length

  // if (priceDataLength < 5) {
  //   return false
  // }

  // // we want to consider only the last 1 hour of data
  // const lastHourData = priceData.slice(priceDataLength - 5)
  // const priceDifference =
  //   lastHourData[lastHourData.length - 1].value - lastHourData[0].value
  // const priceDifferencePercentage =
  //   (priceDifference / lastHourData[0].value) * 100

  // return (
  //   priceDifference > PRICE_DIFFERENCE_THRESHOLD &&
  //   priceDifferencePercentage > 0
  // )
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
    log('no tracked coins. sleeping...')
    return []
  }

  const currentTime = Date.now()
  const oneHour = 60 * 60 * 1000 // One hour in milliseconds

  const remainingCoins = trackedCoins
  for await (const token of remainingCoins) {
    log('processing token', token.address)

    const [baseTokenDetailsQuery, tokenPriceDataQuery] =
      await Promise.allSettled([
        fetchTokenDetails(token.address),
        fetchTokenPrice(token.address),
      ])

    if (baseTokenDetailsQuery.status === 'rejected') {
      log('token data could not be fetched')
      remainingCoins.filter((coin) => coin.address !== token.address)

      continue
    }
    if (tokenPriceDataQuery.status === 'rejected') {
      log('token price data could not be fetched')
      remainingCoins.filter((coin) => coin.address !== token.address)

      continue
    }

    const baseTokenDetails = baseTokenDetailsQuery.value
    const tokenPriceData = tokenPriceDataQuery.value
    if (!baseTokenDetails || !tokenPriceData) {
      log('token data or price data not found', {
        baseTokenDetails,
        tokenPriceData,
      })
      remainingCoins.filter((coin) => coin.address !== token.address)
      continue
    }

    const tokenData: TokenDetailsWithExtendedPrice = {
      ...baseTokenDetails,
      priceData: tokenPriceData,
    }

    log('checking buy criteria', tokenData.symbol, tokenData.address)

    if (matchesBuyCriteria(tokenData)) {
      try {
        await processPromisingCoin(token, tokenData)
        log('token matched buy criteria and processed')
      } catch (error: any) {
        log('unhandled error processing promising coin:', error.message)
      } finally {
        continue
      }
    } else {
      log('token did not match buy criteria')
      if (currentTime - token.timestamp <= oneHour) {
        remainingCoins.push(token)
      } // Keep token if it hasn't been there for over one hour
    }
  }

  return Promise.all(remainingCoins)
}

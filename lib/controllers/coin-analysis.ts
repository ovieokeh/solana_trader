import BigNumber from 'bignumber.js'

import type { Token, TokenDetailsWithExtendedPrice } from '../types'
import {
  FIRST_TAKE_PROFIT_PERCENTAGE,
  SECOND_TAKE_PROFIT_PERCENTAGE,
  STOP_LOSS_PERCENTAGE,
  TRADE_AMOUNT_IN_SOL,
} from '../config/general'
import { createLogger } from '../utils/logger'

import { createLimitOrder, createMarketOrder } from './trader'
import { fetchTokenDetails, fetchTokenPrice } from '../utils/jupiter-ag'
import { SOLANA_ADDRESS } from '../config/wallet-setup'

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
    const solanaCurrentPrice = await fetchTokenPrice(SOLANA_ADDRESS) // Fetch current SOL price in USD
    const SOL_USD_PRICE = new BigNumber(solanaCurrentPrice?.price ?? '0')

    if (SOL_USD_PRICE.isZero()) {
      log('Error: SOL price is zero or could not be fetched.')
      return
    }

    const BUY_PRICE_USD = new BigNumber(TRADE_AMOUNT_IN_SOL).multipliedBy(
      SOL_USD_PRICE,
    )
    const TOKEN_PRICE = +tokenData.priceData.price // Price per token in USD

    const buyAmount = new BigNumber(BUY_PRICE_USD).dividedBy(TOKEN_PRICE)
    const adjustedBuyAmount = buyAmount.multipliedBy(
      new BigNumber(10).pow(tokenData.decimals),
    )

    const stopLossPrice = new BigNumber(TOKEN_PRICE).multipliedBy(
      STOP_LOSS_PERCENTAGE,
    )
    const firstTakeProfitPrice = new BigNumber(TOKEN_PRICE).multipliedBy(
      FIRST_TAKE_PROFIT_PERCENTAGE,
    )
    const secondTakeProfitPrice = new BigNumber(TOKEN_PRICE).multipliedBy(
      SECOND_TAKE_PROFIT_PERCENTAGE,
    )

    const firstTakeProfitAmount = adjustedBuyAmount
      .multipliedBy(0.75)
      .integerValue(BigNumber.ROUND_CEIL)
    const secondTakeProfitAmount = adjustedBuyAmount.minus(
      firstTakeProfitAmount,
    )

    let resolvedMarketOrder
    try {
      resolvedMarketOrder = await createMarketOrder(token.address, {
        amount: +adjustedBuyAmount.toFixed(0),
      })
    } catch (error) {
      log('Error creating market order:', error)
      return
    }

    if (!resolvedMarketOrder) {
      log('Unable to create market order.')
      return
    }

    const limitOrders = [
      createLimitOrder(token.address, {
        amount: +firstTakeProfitAmount.toFixed(0),
        targetPrice: +firstTakeProfitPrice,
      }),
      createLimitOrder(token.address, {
        amount: +adjustedBuyAmount.toFixed(0),
        targetPrice: +stopLossPrice,
      }),
      createLimitOrder(token.address, {
        amount: +secondTakeProfitAmount.toFixed(0),
        targetPrice: +secondTakeProfitPrice,
      }),
    ]

    const resolvedLimitOrders: (string | undefined)[] = []
    for (const orderPromise of limitOrders) {
      try {
        const order = await orderPromise
        resolvedLimitOrders.push(order)
      } catch (error) {
        log('Error creating limit order:', error)
        resolvedLimitOrders.push(undefined)
      }
    }

    const completeRecord = {
      token,
      tokenData,
      stopLossPrice,
      firstTakeProfitPrice,
      secondTakeProfitPrice,
      buyAmount: adjustedBuyAmount.toFixed(0),
      resolvedMarketOrder,
      resolvedLimitOrders,
    }

    const TRADES_REGISTER_PATH = 'data/trades.json'
    let tradesRegister = {}
    try {
      tradesRegister = await Bun.file(TRADES_REGISTER_PATH).json()
    } catch (error) {
      log('Error reading trades register:', error)
    }

    try {
      await Bun.write(
        TRADES_REGISTER_PATH,
        JSON.stringify({
          ...tradesRegister,
          [token.address]: completeRecord,
        }),
      )
    } catch (error) {
      log('Error writing to trades register:', error)
    }
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

  const tokensToRemove: Token[] = []

  for (const token of trackedCoins) {
    log('processing token', token.address)

    const [baseTokenDetailsQuery, tokenPriceDataQuery] =
      await Promise.allSettled([
        fetchTokenDetails(token.address),
        fetchTokenPrice(token.address),
      ])

    if (baseTokenDetailsQuery.status === 'rejected') {
      log('token data could not be fetched')
      tokensToRemove.push(token)
      continue
    }
    if (tokenPriceDataQuery.status === 'rejected') {
      log('token price data could not be fetched')
      tokensToRemove.push(token)
      continue
    }

    const baseTokenDetails = baseTokenDetailsQuery.value
    const tokenPriceData = tokenPriceDataQuery.value
    if (
      !baseTokenDetails ||
      !tokenPriceData?.price ||
      !baseTokenDetails.decimals
    ) {
      log('invalid token data or token data not found', {
        baseTokenDetails,
        tokenPriceData,
      })
      tokensToRemove.push(token)
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
      tokensToRemove.push(token)
    } catch (error: any) {
      log('unhandled error processing promising coin:', error.message)
    } finally {
      continue
    }
  }

  for (const tokenToRemove of tokensToRemove) {
    removeTrackedCoin(trackedCoins, tokenToRemove)
  }

  return Promise.all(trackedCoins)
}

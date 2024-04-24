import fetch from 'node-fetch'
import { createLogger } from '../helpers/logger'
import { getCoinFromSymbol } from '../helpers/coins-list'
import type { ValidCoin } from '../types'

const log = createLogger('jupiter-trader.ts')
const BIRDEYE_API_KEY = process.env['BIRDEYE_API_KEY'] || ''

async function getCoinPrice(
  coinAddress: string,
): Promise<{ coinPrice: any; solPrice: any } | null> {
  if (!BIRDEYE_API_KEY) {
    return null
  }

  try {
    const SOL_ADDRESS = 'So11111111111111111111111111111111111111112'

    const listAddress = [coinAddress, SOL_ADDRESS].join(',')
    log('getCoinPrice: listAddress:', listAddress)

    const response = await fetch(
      `https://public-api.birdeye.so/defi/multi_price?list_address=${listAddress}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': BIRDEYE_API_KEY,
        },
      },
    ).then((res) => res.json() as any)

    const data = response?.data

    if (!data) {
      log('getCoinPrice: data not found')
      return null
    }

    const coinPriceData = data[coinAddress]
    const solPriceData = data[SOL_ADDRESS]

    return { coinPrice: coinPriceData, solPrice: solPriceData }
  } catch (error: any) {
    log('getCoinPrice: error fetching data from Jupiter API:', error.message)
    throw error
  }
}

// function calculateTransactionDetails(
//   coinPrice: number,
//   coinVolume: number,
// ): void {
//   // Constants
//   const BUY_AMOUNT_SOL = 0.005
//   const STOP_LOSS_PERCENTAGE = 0.5
//   const FIRST_TAKE_PROFIT_PERCENTAGE = 2.0
//   const SECOND_TAKE_PROFIT_PERCENTAGE = 5.0

//   // Calculate transaction details
//   const buyAmountUSD = BUY_AMOUNT_SOL * coinPrice
//   const stopLossPrice = coinPrice * (1 - STOP_LOSS_PERCENTAGE)
//   const firstTakeProfitPrice = coinPrice * (1 + FIRST_TAKE_PROFIT_PERCENTAGE)
//   const secondTakeProfitPrice = coinPrice * (1 + SECOND_TAKE_PROFIT_PERCENTAGE)

//   // Write transaction details to a file (for demonstration, print to console)
//   log(`calculateTransactionDetails: coin price: ${coinPrice} USD`)
//   log(`calculateTransactionDetails: coin volume: ${coinVolume} SOL`)
//   log(
//     `calculateTransactionDetails: buy amount (USD): ${buyAmountUSD.toFixed(2)}`,
//   )
//   log(
//     `calculateTransactionDetails: stop loss price: ${stopLossPrice.toFixed(2)}`,
//   )
//   log(
//     `calculateTransactionDetails: first take profit price: ${firstTakeProfitPrice.toFixed(
//       2,
//     )}`,
//   )
//   log(
//     `calculateTransactionDetails: second take profit price: ${secondTakeProfitPrice.toFixed(
//       2,
//     )}`,
//   )

//   // Determine whether to skip the coin
//   if (coinVolume < 300000) {
//     log('calculateTransactionDetails: skipping the coin (volume < 300,000 SOL)')
//   } else {
//     log('calculateTransactionDetails: executing trading strategy...')
//     // Implement your trading logic here
//   }
// }

/**
 * Trading instructions:
 *
 * 1. Get coin current price and volume
 * 2. If volume is greater than 300,000
 * 2.1 Buy 0.005 SOL worth of coin
 * 2.2 Set stop loss at 50% of the buy price
 * 2.3 Set first take profit (sell 75%) at 200% of the buy price
 * 2.4 Set second take profit (sell 25%) at 500% of the buy price
 * 2.5 Write transaction details to a file
 * 3. If volume is less than 300,000
 * 3.1 Skip the coin
 *
 * Use Jupiter's Station API (station.jup.ag/docs/api)
 */
export async function jupiterTrader(coinSymbol: string) {
  const coinDetails = await getCoinFromSymbol(coinSymbol)
  if (!coinDetails) {
    log('jupiterTrader: coin not found')
    return
  }

  const essentialCoinDetails = {
    name: coinDetails.name,
    address: coinDetails.address || coinDetails.mint,
    decimals: coinDetails.decimals,
  } as ValidCoin

  const hasAllEssentialDetails = Object.values(essentialCoinDetails).every(
    (detail) => !!detail,
  )
  if (!hasAllEssentialDetails) {
    log('jupiterTrader: essential coin details missing', essentialCoinDetails)
    return
  }

  const coinPriceDetails = await getCoinPrice(essentialCoinDetails.address)
  if (!coinPriceDetails) {
    log('jupiterTrader: coin price not found')
    return
  }

  const { coinPrice, solPrice } = coinPriceDetails

  log('jupiterTrader: coin price:', coinPrice, solPrice)
}

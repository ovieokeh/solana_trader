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
// import axios from 'axios'
import fetch from 'node-fetch'

// axios.defaults.headers.common['Accept-Encoding'] = 'gzip'

// Function to get coin price and volume from Jupiter's Station API
async function getCoinPriceAndVolume(
  coinSymbol: string,
): Promise<{ price: number; volume: number }> {
  try {
    const response = await fetch(
      `https://token.jup.ag/search?symbol=${coinSymbol}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      },
    ).then((res) => res.json())

    console.log('Response:', response)
    const { price, volume } = (response as any).data
    return { price, volume }
  } catch (error: any) {
    console.error('Error fetching data from Jupiter API:', error.message)
    throw error
  }
}

// Function to calculate transaction details
function calculateTransactionDetails(
  coinPrice: number,
  coinVolume: number,
): void {
  // Constants
  const BUY_AMOUNT_SOL = 0.005
  const STOP_LOSS_PERCENTAGE = 0.5
  const FIRST_TAKE_PROFIT_PERCENTAGE = 2.0
  const SECOND_TAKE_PROFIT_PERCENTAGE = 5.0

  // Calculate transaction details
  const buyAmountUSD = BUY_AMOUNT_SOL * coinPrice
  const stopLossPrice = coinPrice * (1 - STOP_LOSS_PERCENTAGE)
  const firstTakeProfitPrice = coinPrice * (1 + FIRST_TAKE_PROFIT_PERCENTAGE)
  const secondTakeProfitPrice = coinPrice * (1 + SECOND_TAKE_PROFIT_PERCENTAGE)

  // Write transaction details to a file (for demonstration, print to console)
  console.log(`Coin Price: ${coinPrice} USD`)
  console.log(`Coin Volume: ${coinVolume} SOL`)
  console.log(`Buy Amount (USD): ${buyAmountUSD.toFixed(2)}`)
  console.log(`Stop Loss Price: ${stopLossPrice.toFixed(2)}`)
  console.log(`First Take Profit Price: ${firstTakeProfitPrice.toFixed(2)}`)
  console.log(`Second Take Profit Price: ${secondTakeProfitPrice.toFixed(2)}`)

  // Determine whether to skip the coin
  if (coinVolume < 300000) {
    console.log('Skipping the coin (volume < 300,000 SOL)')
  } else {
    console.log('Executing trading strategy...')
    // Implement your trading logic here
  }
}

// Example usage
const coinSymbol = 'POG' // Replace with the actual coin symbol
getCoinPriceAndVolume(coinSymbol)
  .then(({ price, volume }) => calculateTransactionDetails(price, volume))
  .catch((error) => console.error('Error:', error.message))

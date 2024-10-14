import fetch from 'node-fetch'

import { createLogger } from '../../utils/logger'
import type { BirdEyeHistoricalPriceData } from '../../types'

const log = createLogger('birdeye-so.ts')
const BIRDEYE_API_URL = process.env['BIRDEYE_API_URL']
const BIRDEYE_API_KEY = process.env['BIRDEYE_API_KEY']

if (!BIRDEYE_API_KEY) {
  throw new Error('BIRDEYE_API_KEY is required but was not provided.')
}

enum PRICE_MOVEMENT_DISTANCE {
  ONE_HOUR = 1,
  TWO_HOURS = 2,
}
enum PRICE_MOVEMENT_INTERVALS {
  FIFTEEN_MINUTES = '15m',
  THIRTY_MINUTES = '30m',
  ONE_HOUR = '1h',
}

const birdeyeSo = async (url: string, options: any = {}) => {
  const defaultHeaders = {
    'X-API-KEY': BIRDEYE_API_KEY,
  }
  const finalOptions = {
    method: 'GET',
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options?.headers ?? {}),
    },
  }
  const res = await fetch(`${BIRDEYE_API_URL}/${url}`, finalOptions)
  return await res.json()
}

export async function getPriceMovement(
  address: string,
  distance: PRICE_MOVEMENT_DISTANCE = PRICE_MOVEMENT_DISTANCE.ONE_HOUR,
  interval: PRICE_MOVEMENT_INTERVALS = PRICE_MOVEMENT_INTERVALS.FIFTEEN_MINUTES,
): Promise<BirdEyeHistoricalPriceData | null> {
  try {
    const TODAY_DATE_TIME_UNIX = Math.floor(Date.now() / 1000)
    const TIME_FROM_UNIX = TODAY_DATE_TIME_UNIX - 60 * 60 * distance

    const priceMovementResponse = (await birdeyeSo(
      `defi/history_price?address=${address}&address_type=token&type=${interval}&time_from=${TIME_FROM_UNIX}&time_to=${TODAY_DATE_TIME_UNIX}`,
    )) as {
      data: BirdEyeHistoricalPriceData
    }

    return priceMovementResponse.data
  } catch (error) {
    log(`Price movement fetch failed for ${address}`)
    return null
  }
}

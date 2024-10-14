import axios from 'axios'
import { createLogger } from '../../utils/logger'
import type { BaseTokenDetails, JupiterExtendedPriceData } from '../../types'

const log = createLogger('jupiter-ag.ts')
const JUPITER_API_URL = 'https://tokens.jup.ag'

export async function fetchTokenDetails(
  address: string,
): Promise<BaseTokenDetails | null> {
  try {
    const parsedTokenDetails = (await axios(
      `${JUPITER_API_URL}/token/${address}`,
    )) as {
      data: any
    }

    const convertedData: BaseTokenDetails = {
      name: parsedTokenDetails.data.name,
      symbol: parsedTokenDetails.data.symbol,
      address: parsedTokenDetails.data.address,
      decimals: parsedTokenDetails.data.decimals,
      dailyVolume: parsedTokenDetails.data.daily_volume,
    }

    return convertedData
  } catch (error: any) {
    log(`Error fetching token details for address ${address}: `, error.message)
    return null
  }
}

export async function fetchTokenPrice(
  address: string,
): Promise<JupiterExtendedPriceData | undefined> {
  try {
    const parsedTokenPrice = (await axios(
      `https://api.jup.ag/price/v2?ids=${address}&showExtraInfo=true`,
    )) as {
      data: any
    }

    return parsedTokenPrice?.data?.data?.[address] as JupiterExtendedPriceData
  } catch (error) {
    log(`Error fetching token price for address ${address}: `, error)
    return undefined
  }
}

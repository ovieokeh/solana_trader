import fetch, { type HeadersInit } from 'node-fetch'

import { createLogger } from '../../utils/logger'
import type { EnrichedSolanaFMTokenData, BaseTokenDetails } from '../../types'

const log = createLogger('solana-fm.ts')
const SOLANA_FM_API_URL = process.env['SOLANA_FM_API_URL']
const SOLANA_FM_API_KEY = process.env['SOLANA_FM_API_KEY']

const solanaFM = async (url: string, options: any = {}) => {
  const defaultHeaders: HeadersInit = {
    ApiKey: SOLANA_FM_API_KEY!,
  }
  const finalOptions = {
    method: 'GET',
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options?.headers ?? {}),
    },
  }
  const res = await fetch(`${SOLANA_FM_API_URL}/${url}`, finalOptions)
  return await res.json()
}

export async function fetchTokenDetails(
  address: string,
): Promise<BaseTokenDetails | null> {
  try {
    const tokenDetailsQuery = await solanaFM(`v0/tokens/${address}`)
    const parsedTokenDetails = (await tokenDetailsQuery) as {
      data: EnrichedSolanaFMTokenData
    }

    const convertedData: BaseTokenDetails = {
      address: parsedTokenDetails.data.mint,
      symbol: parsedTokenDetails.data.symbol,
      name: parsedTokenDetails.data.tokenName,
      decimals: parsedTokenDetails.data.decimals,
    }

    return convertedData
  } catch (error) {
    log(`Error fetching token details for address ${address}: `, error)
    return null
  }
}

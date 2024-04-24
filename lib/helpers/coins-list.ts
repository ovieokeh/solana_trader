import { exec } from 'child_process'
import { createLogger } from './logger'
import { COINS_PATH } from '../config/wallet-setup'
import type { Coin } from '../types'

const log = createLogger('coins-list.ts')

export async function updateCoinList() {
  try {
    const coinsURL = 'https://api.raydium.io/v2/sdk/token/raydium.mainnet.json'

    const curlCommand = `curl -X GET ${coinsURL} -o ${COINS_PATH}`

    log('updateCoinList: fetching data from Raydium API')
    return new Promise<boolean>((resolve) => {
      exec(curlCommand, (error) => {
        if (error) {
          log(
            'updateCoinList: error fetching data from Raydium API:',
            error.message,
          )
          resolve(false)
        }
        log('updateCoinList: updated coins list from Raydium API')
        resolve(true)
      })
    })
  } catch (error: any) {
    log('updateCoinList: error fetching data from Raydium API:', error.message)
    throw error
  }
}

export async function coinListUpdater(force?: boolean) {
  const currentList = await getCoinList()

  if (currentList.length && !force) {
    log('coinListUpdater: skipping coins list update (list already exists)')
    return
  }

  log('coinListUpdater: starting coin list updater')
  await updateCoinList()

  const time = 10 * 60 * 1000 // 10 minutes
  setInterval(async () => {
    await updateCoinList()
  }, time)
}

export async function getCoinList(): Promise<Coin[]> {
  try {
    const coinsRaw = Bun.file(COINS_PATH)
    const coinsData = await coinsRaw?.json?.()

    if (!coinsData.official || !coinsData.unOfficial) {
      log('getCoinList: coin list not found')
      return []
    }

    const parsedCoins = [...coinsData.official, ...coinsData.unOfficial]
    return parsedCoins
  } catch (error: any) {
    log('getCoinList: error fetching coin list:', error.message)
    throw error
  }
}

export async function getCoinFromSymbol(coinSymbol: string) {
  try {
    const coins = await getCoinList()
    const exactHit = coins.find((hit) => hit?.symbol === coinSymbol)

    if (!exactHit) {
      log('searchCoinSymbol: coin symbol not found')
      return null
    }

    return exactHit
  } catch (error: any) {
    log(
      'searchCoinSymbol: error fetching data from Jupiter API:',
      error.message,
    )
    throw error
  }
}

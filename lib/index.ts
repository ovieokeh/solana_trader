import dotenv from 'dotenv'
dotenv.config()

import { NewMessage, NewMessageEvent } from 'telegram/events'
import { client } from './config/telegram-setup'
import { processCieloMessage } from './handlers/cielo-message-handler'
import { checkWalletBalance } from './helpers/check-wallet-balance'
import { coinListUpdater } from './helpers/coins-list'
import { createLogger } from './helpers/logger'
import { processTrackedCoins } from './helpers/coin-analysis'
import type { Token } from './types'
import { processIFTTMessage } from './handlers/iftt-message-handler'

const log = createLogger('index.ts')

async function main() {
  try {
    await coinListUpdater()
    const walletBalance = await checkWalletBalance()
    log('wallet balance: ', walletBalance, 'SOL')

    const TRACKED_COINS: Token[] = []

    const newMessageHandler = async (event: NewMessageEvent) => {
      processCieloMessage(event, TRACKED_COINS)
      processIFTTMessage(event, TRACKED_COINS)
    }
    client.addEventHandler(newMessageHandler, new NewMessage({}))
    log('listening for new messages')

    const thirtySeconds = 30 * 1000
    setInterval(async () => {
      try {
        await processTrackedCoins(TRACKED_COINS)
      } catch (error) {
        log('error processing tracked coins: ', error)
      }
    }, thirtySeconds)
  } catch (error) {
    log('error in main loop: ', error)
  }
}

main().catch((error) => {
  log('Unhandled error in main: ', error)
})

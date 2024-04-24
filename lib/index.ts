import dotenv from 'dotenv'
import { NewMessage, NewMessageEvent } from 'telegram/events'
import { client } from './config/telegram-setup'
import { processCieloWalletEvent } from './handlers/cielo-tracker-handler'
import { checkWalletBalance } from './helpers/check-wallet-balance'
import { coinListUpdater } from './helpers/coins-list'
import { createLogger } from './helpers/logger'
import { processTrackedCoins } from './helpers/coin-analysis'
import type { Token } from './types'
import { processIFTTMessage } from './handlers/iftt-tracker-handler'

dotenv.config()

const log = createLogger('index.ts')

await coinListUpdater()
const walletBalance = await checkWalletBalance()
log('wallet balance: ', walletBalance, 'SOL')

const TRACKED_COINS: Token[] = []

const newMessageHandler = async (event: NewMessageEvent) => {
  processCieloWalletEvent(event, TRACKED_COINS)
  processIFTTMessage(event, TRACKED_COINS)
}
client.addEventHandler(newMessageHandler, new NewMessage({}))
log('listening for new messages')

const thirtySeconds = 30 * 1000
setInterval(() => {
  processTrackedCoins(TRACKED_COINS).catch(log)
}, thirtySeconds)

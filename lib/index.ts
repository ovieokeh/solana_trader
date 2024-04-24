import dotenv from 'dotenv'
import { NewMessage, NewMessageEvent } from 'telegram/events'
import { client } from './config/telegram-setup'
import { processCieloWalletEvent } from './handlers/cielo-wallet-tracker'
import { checkWalletBalance } from './helpers/check-wallet-balance'
import { coinListUpdater } from './helpers/coins-list'
import { createLogger } from './helpers/logger'

dotenv.config()

const log = createLogger('index.ts')

await coinListUpdater()
const walletBalance = await checkWalletBalance()
log('wallet balance: ', walletBalance, 'SOL')

const newMessageHandler = async (event: NewMessageEvent) => {
  processCieloWalletEvent(event)
}
client.addEventHandler(newMessageHandler, new NewMessage({}))
log('listening for new messages')

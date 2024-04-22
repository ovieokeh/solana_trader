import dotenv from 'dotenv'
import { NewMessage, NewMessageEvent } from 'telegram/events'
import { client } from './config/telegram-setup'
import { processCieloWalletEvent } from './handlers/cielo-wallet-tracker'
import { checkWalletBalance } from './helpers/check-wallet-balance'

dotenv.config()

const newMessageHandler = async (event: NewMessageEvent) => {
  processCieloWalletEvent(event)
}
client.addEventHandler(newMessageHandler, new NewMessage({}))

const walletBalance = await checkWalletBalance()
console.info('Wallet balance: ', walletBalance, 'SOL')

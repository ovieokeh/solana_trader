import dotenv from 'dotenv'
import { NewMessage, NewMessageEvent } from 'telegram/events'
import { client } from './telegram-setup'
import { CIELO_WALLET_BOT_TELEGRAM_ID } from './config'

dotenv.config()

// Listen for new messages
const newMessageHandler = async (event: NewMessageEvent) => {
  const message = event.message
  const isFromCieloBot =
    message.senderId?.toString() === CIELO_WALLET_BOT_TELEGRAM_ID

  if (!isFromCieloBot) {
    console.info(`Ignoring message from ${message.senderId}: ${message.text}`)
    return
  }

  console.info(`Received new message from ${message.senderId}: ${message.text}`)
}
client.addEventHandler(newMessageHandler, new NewMessage({}))

// Send an initial message
await client.sendMessage('me', {
  message: `Hello from dev ${new Date().toLocaleTimeString()}`,
})

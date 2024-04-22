import type { NewMessageEvent } from 'telegram/events'
import { parseTransactionMessage } from '../helpers/formatters'
import { createLogger } from '../helpers/logger'
import { CIELO_WALLET_BOT_TELEGRAM_ID } from '../config/telegram-setup'

const log = createLogger('processCieloWalletEvent')
export const processCieloWalletEvent = async (event: NewMessageEvent) => {
  const message = event.message

  const isFromCieloBot =
    message.senderId?.toString() === CIELO_WALLET_BOT_TELEGRAM_ID
  if (!isFromCieloBot) {
    log(`ignoring message from ${message.senderId}: ${message.text}`)
    return
  }

  try {
    const transactionDetails = parseTransactionMessage(message.text)
    log(
      `received new message from ${message.senderId}: ${message.text}`,
      transactionDetails,
    )
  } catch (error) {
    log(
      `processCieloWalletEvent: error processing message from ${message.senderId}: ${error}`,
    )
  }
}

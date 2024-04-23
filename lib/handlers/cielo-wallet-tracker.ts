import type { NewMessageEvent } from 'telegram/events'
import { parseTransactionMessage } from '../helpers/formatters'
import { createLogger } from '../helpers/logger'
import { CIELO_WALLET_BOT_TELEGRAM_ID } from '../config/telegram-setup'

const log = createLogger('cielo-wallet-tracker.ts')
export const processCieloWalletEvent = async (event: NewMessageEvent) => {
  const message = event.message

  const isFromCieloBot =
    message.senderId?.toString() === CIELO_WALLET_BOT_TELEGRAM_ID
  if (!isFromCieloBot) {
    log(`processCieloWalletEvent: ignoring message from ${message.senderId}`)
    // return
  }

  try {
    const transactionDetails = parseTransactionMessage(message.text)
    log(
      `processCieloWalletEvent: parsed transaction details in message from ${message.senderId}:`,
      transactionDetails,
    )
  } catch (error) {
    log(
      `processCieloWalletEvent: error processing message from ${message.senderId}: ${error}`,
    )
  }
}

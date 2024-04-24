import type { NewMessageEvent } from 'telegram/events'
import {
  isBuyTransactionDetails,
  parseTransactionMessage,
} from '../helpers/formatters'
import { createLogger } from '../helpers/logger'
import { CIELO_WALLET_BOT_TELEGRAM_ID } from '../config/telegram-setup'
import { jupiterTrader } from './jupiter-trader'

const log = createLogger('cielo-wallet-tracker.ts')
export const processCieloWalletEvent = async (event: NewMessageEvent) => {
  const message = event.message

  const isFromCieloBot =
    message.senderId?.toString() === CIELO_WALLET_BOT_TELEGRAM_ID
  if (!isFromCieloBot) {
    log(
      `processCieloWalletEvent: ignoring message from ${message.senderId}`,
      message.text,
    )
    // return
  }

  try {
    const transactionDetails = parseTransactionMessage(message.text)
    if (!transactionDetails) {
      log(
        `processCieloWalletEvent: unable to parse transaction details in message from ${message.senderId}`,
      )
      return
    }

    log(
      `processCieloWalletEvent: parsed transaction details in message from ${message.senderId}:`,
      transactionDetails,
    )

    const isBuyTransaction = isBuyTransactionDetails(transactionDetails)
    if (isBuyTransaction) {
      await jupiterTrader(transactionDetails.quoteBought)
    } else {
      log(
        `processCieloWalletEvent: ignoring sell transaction from ${message.senderId}`,
      )
    }
  } catch (error) {
    log(
      `processCieloWalletEvent: error processing message from ${message.senderId}: ${error}`,
    )
  }
}

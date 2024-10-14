import type { NewMessageEvent } from 'telegram/events'
import {
  isBuyMessage,
  parseMessage,
} from '../message-parsers/cielo-message-parser'
import { createLogger } from '../utils/logger'
import { CIELO_WALLET_BOT_TELEGRAM_ID } from '../config/telegram-setup'
import type { Token } from '../types'

const log = createLogger('cielo-wallet-tracker.ts')

export const processCieloMessage = async (
  event: NewMessageEvent,
  TRACKED_COINS: Token[],
) => {
  const message = event.message

  const isFromCieloBot =
    message.senderId?.toString() === CIELO_WALLET_BOT_TELEGRAM_ID
  if (!isFromCieloBot) {
    log(`processCieloMessage: ignoring message from ${message.senderId}`)
    return
  }

  try {
    const transactionDetails = parseMessage(message.text)
    if (!transactionDetails) {
      return log(
        `processCieloMessage: unable to parse transaction details in message:\n \x1b[34m${message.text}\x1b[0m`,
      )
    }

    const isBuyTransaction = isBuyMessage(transactionDetails)
    if (!isBuyTransaction) {
      return log(
        `processCieloMessage: ignoring sell transaction from ${message.senderId}`,
      )
    }

    if (!transactionDetails.address) {
      return log('coin not found', transactionDetails.base)
    }

    if (TRACKED_COINS.find((c) => c.address === transactionDetails.address)) {
      return log('coin already being tracked', transactionDetails.base)
    }

    TRACKED_COINS.push({
      address: transactionDetails.address,
      timestamp: Date.now(),
    })

    log(`tracked coin ${transactionDetails.quote} from ${message.senderId}
        `)
  } catch (error) {
    log(
      `processCieloMessage: error processing message from ${message.senderId}: ${error}`,
    )
  }
}

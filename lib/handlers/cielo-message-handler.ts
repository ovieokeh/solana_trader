import type { NewMessageEvent } from 'telegram/events'
import {
  isBuyTransactionDetails,
  parseCieloTransactionMessage,
} from '../formatters/cielo-message-formatter'
import { createLogger } from '../helpers/logger'
import { CIELO_WALLET_BOT_TELEGRAM_ID } from '../config/telegram-setup'
import type { Token } from '../types'
import { getCoinFromSymbol } from '../helpers/coins-list'

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
    const transactionDetails = parseCieloTransactionMessage(message.text)
    if (!transactionDetails) {
      log(
        `processCieloMessage: unable to parse transaction details in message from ${message.senderId}`,
      )
      return
    }

    const isBuyTransaction = isBuyTransactionDetails(transactionDetails)
    if (isBuyTransaction) {
      const coinDetails = await getCoinFromSymbol(
        transactionDetails.quoteBought,
      )
      if (!coinDetails || !coinDetails.address) {
        log('coin not found', transactionDetails.quoteBought)
        return
      }

      if (TRACKED_COINS.find((c) => c.address === coinDetails.address)) {
        log('coin already being tracked', transactionDetails.quoteBought)
        return
      }

      TRACKED_COINS.push({
        address: coinDetails.address,
        timestamp: Date.now(),
      })

      log(`tracked coin ${transactionDetails.quoteBought} from ${message.senderId}
        `)
    } else {
      log(
        `processCieloMessage: ignoring sell transaction from ${message.senderId}`,
      )
    }
  } catch (error) {
    log(
      `processCieloMessage: error processing message from ${message.senderId}: ${error}`,
    )
  }
}

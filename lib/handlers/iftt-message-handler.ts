import type { NewMessageEvent } from 'telegram/events'
import { IFTT_BOT_TELEGRAM_ID } from '../config/telegram-setup'
import type { Token } from '../types'
import { createLogger } from '../helpers/logger'
import { coinListUpdater, getCoinFromSymbol } from '../helpers/coins-list'

const log = createLogger('iftt-handler.ts')

export const processIFTTMessage = async (
  message: NewMessageEvent,
  TRACKED_COINS: Token[],
) => {
  const senderId = message.message.senderId?.toString()
  const isIFTTMessage = senderId === IFTT_BOT_TELEGRAM_ID
  if (!isIFTTMessage) {
    log('processIFTTMessage: ignoring message from', senderId)
    // return
  }

  await coinListUpdater(true)

  const messageText = message.message.text
  log('IFTT message:', messageText, TRACKED_COINS.length)

  if (!messageText.includes('Trending New TVL')) {
    log('not a TVL message')
    return
  }

  const coin = message.message.text.split(' - ')[1]

  const coinDetails = await getCoinFromSymbol(coin)
  if (!coinDetails || !coinDetails.address) {
    log('coin not found', coin)
    return
  }

  if (TRACKED_COINS.find((c) => c.address === coinDetails.address)) {
    log('coin already being tracked', coin)
    return
  }

  TRACKED_COINS.push({
    address: coinDetails.address,
    timestamp: Date.now(),
  })

  log('added coin to tracker', coin)
}

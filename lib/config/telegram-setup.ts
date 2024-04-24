import { TelegramClient } from 'telegram'
import { StoreSession } from 'telegram/sessions'
import readline from 'readline'
import dotenv from 'dotenv'
import { createLogger } from '../utils/logger'

dotenv.config()

const log = createLogger('telegram-setup.ts')

const apiId = process.env['TELEGRAM_API_ID']
  ? +process.env['TELEGRAM_API_ID']
  : 0
const apiHash = process.env['TELEGRAM_API_HASH'] || ''
const storeSession = new StoreSession('telegram_auth')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

export const client = new TelegramClient(storeSession, apiId, apiHash, {
  connectionRetries: 5,
})

// Start the client
await client.start({
  phoneNumber: async () =>
    new Promise((resolve) =>
      rl.question('Please enter your number: ', resolve),
    ),
  password: async () =>
    new Promise((resolve) =>
      rl.question('Please enter your password: ', resolve),
    ),
  phoneCode: async () =>
    new Promise((resolve) =>
      rl.question('Please enter the code you received: ', resolve),
    ),
  onError: (err) => log(err),
})

client.session.save()
log('you are now connected.')

export const CIELO_WALLET_BOT_TELEGRAM_ID =
  process.env['CIELO_WALLET_BOT_TELEGRAM_ID'] || '5347402666'

export const IFTT_BOT_TELEGRAM_ID =
  process.env['IFTT_BOT_TELEGRAM_ID'] || '240044026'

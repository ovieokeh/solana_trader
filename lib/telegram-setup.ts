import { TelegramClient } from 'telegram'
import { StoreSession } from 'telegram/sessions'
import readline from 'readline'
import dotenv from 'dotenv'

dotenv.config()

const apiId = process.env['TELEGRAM_API_ID']
  ? +process.env['TELEGRAM_API_ID']
  : 0
const apiHash = process.env['TELEGRAM_API_HASH'] || ''
const storeSession = new StoreSession('telegram_auth')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

console.info('Loading interactive example...')
const client = new TelegramClient(storeSession, apiId, apiHash, {
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
  onError: (err) => console.error(err),
})

client.session.save()
console.info('You are now connected.')

export { client }

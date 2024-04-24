import web3 from '@solana/web3.js'
import dotenv from 'dotenv'
import base58 from 'bs58'
import { createLogger } from '../utils/logger'

dotenv.config()

const log = createLogger('wallet-setup.ts')

const web3Connection = new web3.Connection(
  web3.clusterApiUrl('mainnet-beta'),
  'confirmed',
)
const SECRET_KEY = base58.decode(
  process.env['SOLANA_PRIVATE_KEY_MAINNET'] || '',
)
const wallet = web3.Keypair.fromSecretKey(SECRET_KEY)
await web3Connection.getBalance(wallet.publicKey).then((balance) => {
  const parsedBalance = balance / web3.LAMPORTS_PER_SOL
  log(
    `using wallet ${wallet.publicKey
      .toBase58()
      .slice(0, 8)}... > with balance: ${parsedBalance} SOL`,
  )
})

const COINS_PATH = 'data/coin-list.json'
export const SOLANA_ADDRESS = 'So11111111111111111111111111111111111111112'

export { web3Connection, wallet, COINS_PATH }

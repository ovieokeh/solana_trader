import web3 from '@solana/web3.js'
import dotenv from 'dotenv'
import base58 from 'bs58'
import { createLogger } from '../helpers/logger'

dotenv.config()

const log = createLogger('wallet-setup.ts')

const web3Connection = new web3.Connection(
  process.env['SOLANA_RPC_MAINNET'] || web3.clusterApiUrl('mainnet-beta'),
  'confirmed',
)
const SECRET_KEY = base58.decode(
  process.env['SOLANA_PRIVATE_KEY_MAINNET'] || '',
)
const wallet = web3.Keypair.fromSecretKey(SECRET_KEY)

log('using Wallet: ', wallet.publicKey.toBase58())

const COINS_PATH = 'data/coin-list.json'

export { web3Connection, wallet, COINS_PATH }

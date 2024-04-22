import web3 from '@solana/web3.js'
import dotenv from 'dotenv'
import base58 from 'bs58'

dotenv.config()

const connection = new web3.Connection(
  web3.clusterApiUrl('mainnet-beta'),
  'confirmed',
)
const SECRET_KEY = base58.decode(
  process.env['SOLANA_PRIVATE_KEY_MAINNET'] || '',
)
const wallet = web3.Keypair.fromSecretKey(SECRET_KEY)

console.info('Using Wallet: ', wallet.publicKey.toBase58())

export { connection, wallet }

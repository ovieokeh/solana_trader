import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { wallet, web3Connection } from '../config/wallet-setup'
import { createLogger } from './logger'

const log = createLogger('check-wallet-balance.ts')

export async function checkWalletBalance() {
  if (!web3Connection || !wallet) return

  try {
    const balance = await web3Connection.getBalance(wallet.publicKey)
    return balance / LAMPORTS_PER_SOL
  } catch (error) {
    log('error fetching wallet balance: ', error)
  }
}

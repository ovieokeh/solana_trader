import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { wallet, web3Connection } from '../config/wallet-setup'

export async function checkWalletBalance() {
  if (!web3Connection || !wallet) return

  try {
    const balance = await web3Connection.getBalance(wallet.publicKey)
    return balance / LAMPORTS_PER_SOL
  } catch (error) {
    console.error('Error fetching wallet balance: ', error)
  }
}

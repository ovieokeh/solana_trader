import fetch from 'node-fetch'
import { Keypair, VersionedTransaction } from '@solana/web3.js'

import { createLogger } from './logger'
import type { LimitOrderConfig, MarketOrderConfig } from '../types'
import { SOLANA_ADDRESS, wallet, web3Connection } from '../config/wallet-setup'

const log = createLogger('trader.ts')

export async function createMarketOrder(
  address: string,
  tradeSettings: MarketOrderConfig,
): Promise<string | undefined> {
  try {
    log(`Trading coin: ${address} with settings`, tradeSettings)

    const quoteResponse = (await (
      await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${SOLANA_ADDRESS}&outputMint=${address}&amount=${tradeSettings.amount}`,
      )
    ).json()) as any

    log('quoteResponse', quoteResponse)

    if (!quoteResponse) {
      log('no quote found')
      return ''
    }

    const swapTransactionResponse = (await (
      await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: wallet.publicKey.toBase58(),
          wrapAndUnwrapSol: true,
        }),
      })
    ).json()) as any

    const swapTransaction = swapTransactionResponse.swapTransaction

    if (!swapTransaction) {
      log('no swap transaction found')
      return ''
    }

    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64')
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf)
    transaction.sign([wallet])
    const rawTransaction = transaction.serialize()

    const latestBlockHash = await web3Connection.getLatestBlockhash()
    const txid = await web3Connection.sendRawTransaction(rawTransaction)
    await web3Connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: txid,
    })

    log(`https://solscan.io/tx/${txid}`)
    return txid
  } catch (error: any) {
    log('createMarketOrder: error creating market order:', error.message)
  }
}

// await createMarketOrder('8Kttuq5hbk8YETFmescjSJfv9rEYW4L4qRosx3iDP4mq', {
//   amount: 1_000_000,
// })

export async function createLimitOrder(
  address: string,
  tradeSettings: LimitOrderConfig,
): Promise<string | undefined> {
  try {
    log(
      `createLimitOrder: add limit order for coin: ${address} with settings`,
      tradeSettings,
    )

    const base = Keypair.generate()
    const transactions = (await (
      await fetch('https://jup.ag/api/limit/v1/createOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: wallet.publicKey.toString(),
          inAmount: tradeSettings.amount,
          outAmount: tradeSettings.targetPrice,
          inputMint: address.toString(),
          outputMint: SOLANA_ADDRESS.toString(),
          base: base.publicKey.toString(),
          expiredAt: null, // new Date().valueOf() / 1000,
        }),
      })
    ).json()) as any

    const { tx } = transactions
    const transactionBuf = Buffer.from(tx, 'base64')
    const transaction = VersionedTransaction.deserialize(transactionBuf)

    // sign the transaction using the required key
    // for create order, wallet and base key are required.
    transaction.sign([wallet, base])

    const rawTransaction = transaction.serialize()

    const latestBlockHash = await web3Connection.getLatestBlockhash()
    const txid = await web3Connection.sendRawTransaction(rawTransaction)
    await web3Connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: txid,
    })

    return txid
  } catch (error: any) {
    log('createLimitOrder: error creating limit order:', error.message)
  }
}

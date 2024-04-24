import fetch from 'node-fetch'
import { Keypair, VersionedTransaction } from '@solana/web3.js'

import { createLogger } from './logger'
import { SOLANA_ADDRESS, wallet, web3Connection } from '../config/wallet-setup'
import type { LimitOrderConfig, MarketOrderConfig } from '../types'

const log = createLogger('trader.ts')

const API_BASE_URL = 'https://jup.ag/api'
const CONTENT_TYPE_JSON = 'application/json'
const JUPITER_QUOTE_API = `${API_BASE_URL}/v6/quote`
const JUPITER_SWAP_API = `${API_BASE_URL}/v6/swap`
const JUPITER_LIMIT_ORDER_API = `${API_BASE_URL}/limit/v1/createOrder`

async function fetchData(url: string, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': CONTENT_TYPE_JSON,
    },
  }

  const finalOptions = { ...defaultOptions, ...options }

  try {
    const response = await fetch(url, finalOptions)
    if (!response.ok)
      throw new Error(`Network response was not ok: ${response.statusText}`)
    return (await response.json()) as any
  } catch (error) {
    log(`fetchData: error - `, error)
    throw error // Allows for specific error handling where this is called
  }
}

async function processAndSendTransaction(
  txBase64: string,
  signers: Keypair[] = [],
) {
  const transactionBuf = Buffer.from(txBase64, 'base64')
  const transaction = VersionedTransaction.deserialize(transactionBuf)
  transaction.sign([wallet, ...signers])

  const latestBlockHash = await web3Connection.getLatestBlockhash()
  const txid = await web3Connection.sendRawTransaction(
    transaction.serialize(),
    {
      skipPreflight: true,
      maxRetries: 2,
    },
  )

  await web3Connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: txid,
  })

  log(`Transaction successful: https://solscan.io/tx/${txid}`)
  return txid
}

export async function createMarketOrder(
  address: string,
  tradeSettings: MarketOrderConfig,
): Promise<string | undefined> {
  try {
    log(`Trading coin: ${address} with settings`, tradeSettings)

    const quoteResponse = await fetchData(
      `${JUPITER_QUOTE_API}?inputMint=${SOLANA_ADDRESS}&outputMint=${address}&amount=${tradeSettings.amount}`,
      { method: 'GET' },
    )
    log('quoteResponse', quoteResponse)

    if (!quoteResponse) {
      log('no quote found')
      return ''
    }

    const swapTransactionResponse = await fetchData(JUPITER_SWAP_API, {
      method: 'POST',
      body: JSON.stringify({
        quoteResponse,
        userPublicKey: wallet.publicKey.toBase58(),
        wrapAndUnwrapSol: true,
      }),
    })

    const swapTransaction = swapTransactionResponse.swapTransaction

    if (!swapTransaction) {
      log('no swap transaction found')
      return ''
    }

    return await processAndSendTransaction(swapTransaction)
  } catch (error: any) {
    log('createMarketOrder: error creating market order:', error.message)
  }
}

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

    const limitOrderResponse = await fetchData(JUPITER_LIMIT_ORDER_API, {
      method: 'POST',
      body: JSON.stringify({
        owner: wallet.publicKey.toString(),
        inAmount: tradeSettings.amount,
        outAmount: tradeSettings.targetPrice,
        inputMint: address,
        outputMint: SOLANA_ADDRESS,
        base: base.publicKey.toString(),
      }),
    })

    const { tx } = limitOrderResponse

    return await processAndSendTransaction(tx, [base])
  } catch (error: any) {
    log('createLimitOrder: error creating limit order:', error.message)
  }
}

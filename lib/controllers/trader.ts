import axios from 'axios'
import { Keypair, VersionedTransaction } from '@solana/web3.js'

import { createLogger } from '../utils/logger'
import { SOLANA_ADDRESS, wallet, web3Connection } from '../config/wallet-setup'
import type {
  JupiterLimitOrderConfig,
  JupiterMarketOrderConfig,
} from '../types'
import { TRADE_SLIPPAGE_BPS } from '../config/general'

const log = createLogger('trader.ts')

const JUPITER_QUOTE_API = `https://public.jupiterapi.com/quote`
const JUPITER_SWAP_API = `https://public.jupiterapi.com/swap`
const JUPITER_LIMIT_ORDER_API = `https://jup.ag/api/limit/v1/createOrder`

async function fetchData(url: string, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  }

  const finalOptions = { ...defaultOptions, ...options }

  try {
    const response = await axios(url, {
      ...finalOptions,
    })
    if (!response.status || response.status !== 200)
      throw new Error(`Network response was not ok: ${response.statusText}`)
    return response.data
  } catch (error: any) {
    log(`fetchData: error - `, error)
    throw error
  }
}

async function processAndSendTransaction(
  txBase64: string,
  signers: Keypair[] = [],
) {
  const transactionBuf = Buffer.from(txBase64, 'base64')
  const transaction = VersionedTransaction.deserialize(
    new Uint8Array(transactionBuf),
  )
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
  tradeSettings: JupiterMarketOrderConfig,
): Promise<string | undefined> {
  try {
    log(`Trading coin: ${address} with settings`, tradeSettings)

    const quoteResponse = await fetchData(
      `${JUPITER_QUOTE_API}?inputMint=${SOLANA_ADDRESS}&outputMint=${address}&amount=${tradeSettings.amount}&slippageBps=${TRADE_SLIPPAGE_BPS}`,
      { method: 'GET' },
    )
    log('quoteResponse', quoteResponse)

    if (!quoteResponse) {
      log('no quote found')
      return ''
    }

    const swapTransactionResponse = await fetchData(JUPITER_SWAP_API, {
      method: 'POST',
      data: {
        quoteResponse,
        userPublicKey: wallet.publicKey.toBase58(),
        wrapAndUnwrapSol: true,
        prioritizationFeeLamports: 1000000, // 0.001 SOL
      },
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
  tradeSettings: JupiterLimitOrderConfig,
): Promise<string | undefined> {
  try {
    log(
      `createLimitOrder: add limit order for coin: ${address} with settings`,
      tradeSettings,
    )

    const base = Keypair.generate()

    const limitOrderResponse = await fetchData(JUPITER_LIMIT_ORDER_API, {
      method: 'POST',
      data: JSON.stringify({
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

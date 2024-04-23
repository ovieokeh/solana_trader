type BuyTransactionDetails = {
  quoteBought: string
  amountQuoteBought: number
  priceOfQuote: number
  baseSold: string
  amountBaseSold: number
  valueOfTransactionInDollars: number
}

type SellTransactionDetails = {
  quoteSold: string
  amountQuoteSold: number
  priceOfQuote: number
  baseReceived: string
  amountBaseReceived: number
  valueOfTransactionInDollars: number
}

export type TransactionDetails = BuyTransactionDetails | SellTransactionDetails
export function parseTransactionMessage(
  message: string,
): TransactionDetails | null {
  const regex =
    /Swapped ([\d,]+\.?\d*) #(\w+) \(\$([\d,]+\.?\d*)\) for ([\d,]+\.?\d*) #(\w+) @ \$([\d\.]+)/
  const match = message.match(regex)

  if (match) {
    const isBuySignal = match[2] === 'SOL' // Check if "SOL" is the quote sold
    if (isBuySignal) {
      return {
        quoteBought: match[5],
        amountQuoteBought: parseFloat(match[4].replace(/,/g, '')),
        priceOfQuote: parseFloat(match[6]),
        baseSold: match[2],
        amountBaseSold: parseFloat(match[1].replace(/,/g, '')),
        valueOfTransactionInDollars: parseFloat(match[3].replace(/,/g, '')),
      }
    } else {
      return {
        quoteSold: match[2],
        amountQuoteSold: parseFloat(match[1].replace(/,/g, '')),
        priceOfQuote: parseFloat(match[6]),
        baseReceived: match[5],
        amountBaseReceived: parseFloat(match[4].replace(/,/g, '')),
        valueOfTransactionInDollars: parseFloat(match[3].replace(/,/g, '')),
      }
    }
  }

  return null
}

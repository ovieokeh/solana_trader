type BuyTransactionDetails = {
  quoteBought: string
  amountQuoteBought: string
  priceOfQuote: string
  baseSold: string
  amountBaseSold: string
  valueOfTransactionInDollars: string
}

type SellTransactionDetails = {
  quoteSold: string
  amountQuoteSold: string
  priceOfQuote: string
  baseReceived: string
  amountBaseReceived: string
  valueOfTransactionInDollars: string
}

export type TransactionDetails = BuyTransactionDetails | SellTransactionDetails
export function parseTransactionMessage(message: string): TransactionDetails {
  const isBuyTransaction = message.startsWith('⭐️')
  const regex =
    /\s*Swapped\s+([\d,]+\.?\d*)\s+#(\w+).*?\(\$([\d,]+\.?\d*)\).*?for\s+([\d,]+\.?\d*)\s+#(\w+)\s+@\s+\$([\d,]+\.?\d*)/
  const matches = message.match(regex)

  const formattedMessage = isBuyTransaction
    ? {
        quoteBought: matches?.[5] ?? '',
        amountQuoteBought: matches?.[4]?.replace(/,/g, '') ?? '',
        priceOfQuote: matches?.[6]?.replace(/,/g, '') ?? '',
        baseSold: matches?.[2] ?? '',
        amountBaseSold: matches?.[1]?.replace(/,/g, '') ?? '',
        valueOfTransactionInDollars: matches?.[3]?.replace(/,/g, '') ?? '',
      }
    : {
        quoteSold: matches?.[2] ?? '',
        amountQuoteSold: matches?.[1]?.replace(/,/g, '') ?? '',
        priceOfQuote: matches?.[6]?.replace(/,/g, '') ?? '',
        baseReceived: matches?.[5] ?? '',
        amountBaseReceived: matches?.[4]?.replace(/,/g, '') ?? '',
        valueOfTransactionInDollars: matches?.[3]?.replace(/,/g, '') ?? '',
      }

  return formattedMessage
}

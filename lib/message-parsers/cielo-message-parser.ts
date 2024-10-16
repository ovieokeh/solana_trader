interface Message {
  sender: string
  type: 'swap' | 'transfer' | 'receive'
}

export interface SwapMessage extends Message {
  type: 'swap'
  starred: boolean
  quoteAmount: number
  quote: string
  quoteUSDValue: number
  baseAmount: number
  base: string
  baseUSDValue?: number
  address: string
  price: number
}

/**
 * Parses a Telegram message and returns a SwapMessage object.
 * @param rawMessage The raw message text.
 * @returns A SwapMessage object.
 */
function parseMessage(rawMessage: string): SwapMessage | null {
  const lines = rawMessage
    .trim()
    .split('\n')
    .map((line) => line.trim())
  if (lines.length < 2) return null

  const senderLine = lines[0]
  const messageLine = lines[1]
  const addressLine = lines[2]

  const senderMatch = senderLine.match(/^#([A-Za-z0-9\.]{4,})/)
  if (!senderMatch) return null
  const sender = senderMatch[0]

  if (!messageLine.includes('Swapped')) return null
  return parseSwapMessage(sender, messageLine, addressLine)
}

/**
 * Parses a swap message.
 * @param sender The sender address.
 * @param message The message text.
 * @returns A SwapMessage object.
 */
function parseSwapMessage(
  sender: string,
  message: string,
  addressLine?: string,
): SwapMessage | null {
  const parts = message.split(' ')
  // first digit is amount of quote token
  // first text after first digit is quote token
  // second digit in parentheses is USD value of quote token
  // third digit is amount of base token
  // first text after third digit is base token
  // digit with $ is quote price

  const details = {
    isStarred: message.includes('⭐️'),
    quote: '',
    address: '',
    quoteAmount: 0,
    quoteUSDValue: 0,
    base: '',
    baseAmount: 0,
    price: 0,
  }

  const addressParts = addressLine?.split(' ')
  addressParts &&
    addressParts.forEach((part) => {
      part = part.replaceAll('`', '')
      if (part.length > 40 && part.length < 46) {
        return (details.address = part)
      }
    })

  parts.forEach((part) => {
    part = part.replace(/,/g, '').replaceAll('*', '')

    if (isNaN(+part)) {
      // does it have parentheses?
      const hasParentheses = part.includes('(')
      if (hasParentheses) {
        const cleanedPart = part
          .replace('(', '')
          .replace(')', '')
          .replace('$', '')
        return (details['quoteUSDValue'] = parseFloat(cleanedPart))
      }

      const hasDollarSign = part.includes('$')
      if (hasDollarSign) {
        return (details['price'] = parseFloat(part.replace('$', '')))
      }

      const hasHashSign = part.includes('#')
      if (hasHashSign) {
        if (!details['quote']) {
          return (details['quote'] = part.replace('#', ''))
        }
        if (!details['base']) {
          return (details['base'] = part.replace('#', ''))
        }
      }
    } else {
      if (!details['quoteAmount']) {
        return (details['quoteAmount'] = parseFloat(part))
      }

      if (!details['baseAmount']) {
        return (details['baseAmount'] = parseFloat(part))
      }
    }
  })

  console.log({ details })

  return {
    sender,
    type: 'swap',
    starred: !!details['isStarred'],
    ...details,
  }
}

const isBuyMessage = (message: any): message is SwapMessage =>
  message.type === 'swap' && message.quoteAmount > 0 && message.quote === 'SOL'

// Exporting functions and types for testing and usage
export { parseMessage, parseSwapMessage, isBuyMessage }

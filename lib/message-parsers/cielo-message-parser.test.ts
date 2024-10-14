// messageParser.test.ts

import { describe, expect, test } from 'vitest'
import type { SwapMessage } from './cielo-message-parser'
import { parseMessage } from './cielo-message-parser'

describe('Message Parser', () => {
  test('parses swap message without star and platform', () => {
    const rawMessage = `
#EfwX...FbKc
Swapped 1,391.73 #RR ($0.51) for 0.0033 #SOL @ $0.00036
#solana | Cielo | ViewTx | Chart
🔫 Buy on Banana Gun
    `

    const parsed = parseMessage(rawMessage) as SwapMessage

    expect(parsed).not.toBeNull()
    expect(parsed.type).toBe('swap')
    expect(parsed.sender).toBe('#EfwX...FbKc')
    expect(parsed.starred).toBe(false)
    expect(parsed.quoteAmount).toBeCloseTo(1391.73)
    expect(parsed.quote).toBe('RR')
    expect(parsed.quoteUSDValue).toBeCloseTo(0.51)
    expect(parsed.baseAmount).toBeCloseTo(0.0033)
    expect(parsed.base).toBe('SOL')
    expect(parsed.price).toBeCloseTo(0.00036)
  })
  test('parses swap message without star and platform', () => {
    const rawMessage = `
    #13H2...iGJK
    Swapped 545,950.88 #RUFF ($2,172.78) for 13.79 #SOL @ $0.0040
    #solana | Cielo | ViewTx | Chart
    🔫 Buy on Banana Gun
    `

    const parsed = parseMessage(rawMessage) as SwapMessage

    expect(parsed).not.toBeNull()
    expect(parsed.type).toBe('swap')
    expect(parsed.sender).toBe('#13H2...iGJK')
    expect(parsed.starred).toBe(false)
    expect(parsed.quoteAmount).toBeCloseTo(545950.88)
    expect(parsed.quote).toBe('RUFF')
    expect(parsed.quoteUSDValue).toBeCloseTo(2172.78)
    expect(parsed.baseAmount).toBeCloseTo(13.79)
    expect(parsed.base).toBe('SOL')
    expect(parsed.price).toBeCloseTo(0.004)
  })

  test('parses swap message with star and platform', () => {
    const rawMessage = `
#EfwX...FbKc
⭐️ Swapped 0.00099 #SOL ($0.15) for 2,889.82 #Berry On #PumpFun @ $0.000052
#solana | Cielo | ViewTx | Chart
🔫 Buy on Banana Gun
    `

    const parsed = parseMessage(rawMessage) as SwapMessage

    expect(parsed).not.toBeNull()
    expect(parsed.type).toBe('swap')
    expect(parsed.sender).toBe('#EfwX...FbKc')
    expect(parsed.starred).toBe(true)
    expect(parsed.quoteAmount).toBeCloseTo(0.00099)
    expect(parsed.quote).toBe('SOL')
    expect(parsed.quoteUSDValue).toBeCloseTo(0.15)
    expect(parsed.baseAmount).toBeCloseTo(2889.82)
    expect(parsed.base).toBe('Berry')
    expect(parsed.price).toBeCloseTo(0.000052)
  })

  test('returns null for unrecognized message', () => {
    const rawMessage = `
#Unknown
Some random message that doesn't match
    `

    const parsed = parseMessage(rawMessage)

    expect(parsed).toBeNull()
  })
})

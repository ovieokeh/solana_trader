export interface Coin {
  name?: string
  symbol?: string
  address?: string
  mint?: string
  decimals: number
  chainId?: number
  icon?: string
  hasFreeze?: number
  extensions: { [x: string]: string } | undefined
}
export interface ValidCoin {
  name: string
  symbol: string
  address: string
  decimals: number
  chainId?: number
  icon?: string
  hasFreeze?: number
  extensions?: { [x: string]: string } | undefined
}

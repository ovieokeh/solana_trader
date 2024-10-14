import type { SolanaFMSupplyData } from '../types'

export class SupplyAnalysisModel {
  private circulatingSupply: number
  private totalWithheldAmount: number
  private realCirculatingSupply: number

  constructor(data: SolanaFMSupplyData) {
    // Adjust values based on decimals
    const decimalFactor = Math.pow(10, data.decimals)

    this.circulatingSupply = data.circulatingSupply / decimalFactor
    this.totalWithheldAmount = data.totalWithheldAmount / decimalFactor
    this.realCirculatingSupply = data.realCirculatingSupply / decimalFactor
  }

  /**
   * Calculates the percentage of tokens withheld from circulation.
   * @returns Percentage withheld as a number between 0 and 100.
   */
  public calculatePercentageWithheld(): number {
    const percentageWithheld =
      (this.totalWithheldAmount / this.circulatingSupply) * 100
    return parseFloat(percentageWithheld.toFixed(2))
  }

  /**
   * Calculates the percentage of tokens that are actually in circulation.
   * @returns Percentage of real circulation as a number between 0 and 100.
   */
  public calculatePercentageRealCirculation(): number {
    const percentageRealCirculation =
      (this.realCirculatingSupply / this.circulatingSupply) * 100
    return parseFloat(percentageRealCirculation.toFixed(2))
  }

  /**
   * Determines the liquidity status based on the percentage of real circulation.
   * @returns Liquidity status as a string ('Very Low', 'Low', 'Mid', 'High', 'Very High').
   */
  public getLiquidityStatus(): string {
    const percentageRealCirculation = this.calculatePercentageRealCirculation()

    if (percentageRealCirculation <= 5) {
      return 'Very Low'
    } else if (percentageRealCirculation <= 20) {
      return 'Low'
    } else if (percentageRealCirculation <= 50) {
      return 'Mid'
    } else if (percentageRealCirculation <= 80) {
      return 'High'
    } else {
      return 'Very High'
    }
  }

  /**
   * Calculates the purchase confidence percentage based on withheld and real circulation percentages.
   * Assumes that higher real circulation and lower withheld amounts increase purchase confidence.
   * @returns Purchase confidence as a number between 0 and 100.
   */
  public calculatePercentagePurchaseConfidence(): number {
    const percentageWithheld = this.calculatePercentageWithheld()
    const percentageRealCirculation = this.calculatePercentageRealCirculation()

    // Example formula: Purchase confidence increases with higher real circulation and decreases with higher withheld percentage.
    // Assign weights to each factor (these can be adjusted as needed).
    const weightRealCirculation = 0.6
    const weightWithheld = 0.4

    let confidence =
      percentageRealCirculation * weightRealCirculation -
      percentageWithheld * weightWithheld

    // Normalize confidence to be between 0 and 100
    confidence = Math.max(0, Math.min(100, confidence))

    return parseFloat(confidence.toFixed(2))
  }
}

const data: SolanaFMSupplyData = {
  circulatingSupply: 999999621.4017539,
  tokenWithheldAmount: 0,
  userTotalWithheldAmount: 0.0,
  totalWithheldAmount: 0.0,
  realCirculatingSupply: 999999621.4017539,
  decimals: 6,
}

const analysisModel = new SupplyAnalysisModel(data)

console.log(
  'Percentage Withheld:',
  analysisModel.calculatePercentageWithheld(),
  '%',
)
console.log(
  'Percentage Real Circulation:',
  analysisModel.calculatePercentageRealCirculation(),
  '%',
)
console.log('Liquidity Status:', analysisModel.getLiquidityStatus())
console.log(
  'Purchase Confidence:',
  analysisModel.calculatePercentagePurchaseConfidence(),
  '%',
)

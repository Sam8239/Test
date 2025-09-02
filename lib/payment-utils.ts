import { PaymentBreakdown, Product, CommissionConfig } from '@/types/marketplace'

export const DEFAULT_COMMISSION_CONFIG: CommissionConfig = {
  wellnessProviderCommissionRate: 0.15, // 15%
  companyCommissionRate: 0.10, // 10%
}

export function calculatePaymentBreakdown(
  product: Product,
  quantity: number = 1,
  config: CommissionConfig = DEFAULT_COMMISSION_CONFIG
): PaymentBreakdown {
  const totalAmount = product.retailPrice * quantity
  const wholesaleTotal = product.wholesalePrice * quantity
  
  // Calculate commissions based on total retail amount
  const wellnessProviderCommission = totalAmount * config.wellnessProviderCommissionRate
  const companyRevenue = totalAmount * config.companyCommissionRate
  
  // Brand partner gets wholesale price
  const brandPartnerRevenue = wholesaleTotal
  
  return {
    totalAmount,
    wholesalePrice: wholesaleTotal,
    wellnessProviderCommission,
    companyRevenue,
    brandPartnerRevenue,
  }
}

export function validatePaymentBreakdown(breakdown: PaymentBreakdown): boolean {
  const calculatedTotal = breakdown.brandPartnerRevenue + 
                         breakdown.wellnessProviderCommission + 
                         breakdown.companyRevenue
  
  // Allow for small rounding differences (within 1 cent)
  return Math.abs(calculatedTotal - breakdown.totalAmount) <= 0.01
}

export function convertToStripeAmount(amount: number): number {
  // Stripe expects amounts in cents
  return Math.round(amount * 100)
}

export function convertFromStripeAmount(amount: number): number {
  // Convert from cents to dollars
  return amount / 100
}

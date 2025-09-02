export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  stripeConnectAccountId?: string
}

export type UserRole = 'customer' | 'company' | 'brand_partner' | 'wellness_provider'

export interface Product {
  id: string
  name: string
  description: string
  retailPrice: number
  wholesalePrice: number
  brandPartnerId: string
  wellnessProviderId?: string
}

export interface CommissionConfig {
  wellnessProviderCommissionRate: number // e.g., 0.15 for 15%
  companyCommissionRate: number // e.g., 0.10 for 10%
}

export interface PaymentBreakdown {
  totalAmount: number
  wholesalePrice: number
  wellnessProviderCommission: number
  companyRevenue: number
  brandPartnerRevenue: number
}

export interface PaymentIntent {
  id: string
  productId: string
  customerId: string
  brandPartnerId: string
  wellnessProviderId?: string
  breakdown: PaymentBreakdown
  stripePaymentIntentId: string
  status: 'pending' | 'completed' | 'failed'
  transfersCompleted: boolean
  createdAt: Date
  completedAt?: Date
}

export interface StripeCheckoutSessionData {
  productId: string
  customerId: string
  brandPartnerId: string
  wellnessProviderId?: string
  quantity: number
}

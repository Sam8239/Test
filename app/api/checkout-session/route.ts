import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { calculatePaymentBreakdown, convertToStripeAmount } from '@/lib/payment-utils'
import { StripeCheckoutSessionData, Product } from '@/types/marketplace'

// Mock product data - in a real app, this would come from your database
const MOCK_PRODUCTS: Record<string, Product> = {
  'wellness-package-1': {
    id: 'wellness-package-1',
    name: 'Premium Wellness Package',
    description: 'Complete wellness solution with supplements and consultation',
    retailPrice: 299.99,
    wholesalePrice: 180.00,
    brandPartnerId: 'brand_partner_123',
    wellnessProviderId: 'wellness_provider_456',
  },
}

export async function POST(request: NextRequest) {
  try {
    const data: StripeCheckoutSessionData = await request.json()
    
    const { productId, customerId, quantity = 1 } = data
    
    // Get product details
    const product = MOCK_PRODUCTS[productId]
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }
    
    // Calculate payment breakdown
    const breakdown = calculatePaymentBreakdown(product, quantity)
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.name,
              description: product.description,
            },
            unit_amount: convertToStripeAmount(product.retailPrice),
          },
          quantity: quantity,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
      metadata: {
        productId,
        customerId,
        brandPartnerId: product.brandPartnerId,
        wellnessProviderId: product.wellnessProviderId || '',
        quantity: quantity.toString(),
        wholesalePrice: breakdown.wholesalePrice.toString(),
        wellnessProviderCommission: breakdown.wellnessProviderCommission.toString(),
        companyRevenue: breakdown.companyRevenue.toString(),
      },
      payment_intent_data: {
        metadata: {
          productId,
          customerId,
          brandPartnerId: product.brandPartnerId,
          wellnessProviderId: product.wellnessProviderId || '',
        },
      },
    })
    
    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url,
      breakdown 
    })
    
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

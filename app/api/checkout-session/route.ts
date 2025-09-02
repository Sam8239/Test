import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { convertToStripeAmount } from '@/lib/payment-utils'
import { TransferService } from '@/lib/transfer-service'
import { prisma } from '@/lib/prisma'
import { PaymentStatus } from '@prisma/client'

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

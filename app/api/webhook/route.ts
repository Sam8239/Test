import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe'
import { convertFromStripeAmount } from '@/lib/payment-utils'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  
  if (!signature || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 }
    )
  }
  
  let event: Stripe.Event
  
  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }
  
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
        
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
    
    return NextResponse.json({ received: true })
    
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout session completed:', session.id)
  
  // Here you would typically:
  // 1. Save the payment record to your database
  // 2. Mark the order as paid
  // 3. Trigger any post-payment workflows
  
  const metadata = session.metadata
  if (metadata) {
    console.log('Payment metadata:', {
      productId: metadata.productId,
      customerId: metadata.customerId,
      brandPartnerId: metadata.brandPartnerId,
      wellnessProviderId: metadata.wellnessProviderId,
    })
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id)
  
  const metadata = paymentIntent.metadata
  if (!metadata.brandPartnerId) {
    console.error('Missing brand partner ID in payment metadata')
    return
  }
  
  try {
    // Process transfers after payment is confirmed
    await processPaymentTransfers(paymentIntent)
  } catch (error) {
    console.error('Error processing payment transfers:', error)
    // In production, you might want to queue this for retry
  }
}

async function processPaymentTransfers(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata
  const amount = convertFromStripeAmount(paymentIntent.amount)
  
  console.log(`Processing transfers for payment ${paymentIntent.id}`)
  
  // Mock connected account IDs - in production, get these from your database
  const MOCK_CONNECTED_ACCOUNTS = {
    'brand_partner_123': 'acct_brand_partner_stripe_id',
    'wellness_provider_456': 'acct_wellness_provider_stripe_id',
  }
  
  const transfers = []
  
  // Transfer wholesale price to brand partner
  if (metadata.brandPartnerId) {
    const brandPartnerAccountId = MOCK_CONNECTED_ACCOUNTS[metadata.brandPartnerId as keyof typeof MOCK_CONNECTED_ACCOUNTS]
    
    if (brandPartnerAccountId && metadata.wholesalePrice) {
      const wholesaleAmount = parseFloat(metadata.wholesalePrice)
      
      try {
        const transfer = await stripe.transfers.create({
          amount: convertToStripeAmount(wholesaleAmount),
          currency: 'usd',
          destination: brandPartnerAccountId,
          metadata: {
            type: 'wholesale_payment',
            paymentIntentId: paymentIntent.id,
            brandPartnerId: metadata.brandPartnerId,
          },
        })
        
        transfers.push(transfer)
        console.log(`Transferred $${wholesaleAmount} to brand partner`)
      } catch (error) {
        console.error('Error transferring to brand partner:', error)
      }
    }
  }
  
  // Transfer commission to wellness provider
  if (metadata.wellnessProviderId && metadata.wellnessProviderCommission) {
    const wellnessProviderAccountId = MOCK_CONNECTED_ACCOUNTS[metadata.wellnessProviderId as keyof typeof MOCK_CONNECTED_ACCOUNTS]
    
    if (wellnessProviderAccountId) {
      const commissionAmount = parseFloat(metadata.wellnessProviderCommission)
      
      try {
        const transfer = await stripe.transfers.create({
          amount: convertToStripeAmount(commissionAmount),
          currency: 'usd',
          destination: wellnessProviderAccountId,
          metadata: {
            type: 'wellness_provider_commission',
            paymentIntentId: paymentIntent.id,
            wellnessProviderId: metadata.wellnessProviderId,
          },
        })
        
        transfers.push(transfer)
        console.log(`Transferred $${commissionAmount} commission to wellness provider`)
      } catch (error) {
        console.error('Error transferring to wellness provider:', error)
      }
    }
  }
  
  // Company keeps the remaining amount automatically
  const companyRevenue = parseFloat(metadata.companyRevenue || '0')
  console.log(`Company revenue: $${companyRevenue}`)
  
  console.log(`Completed ${transfers.length} transfers for payment ${paymentIntent.id}`)
}

import { NextRequest, NextResponse } from 'next/server'
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe'
import { TransferService } from '@/lib/transfer-service'
import { prisma } from '@/lib/prisma'
import { PaymentStatus } from '@prisma/client'
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

  const metadata = session.metadata
  if (!metadata?.paymentId) {
    console.error('Missing payment ID in session metadata')
    return
  }

  try {
    // Update payment status in database
    await prisma.payment.update({
      where: { id: metadata.paymentId },
      data: {
        status: PaymentStatus.PROCESSING,
        stripeSessionId: session.id
      }
    })

    console.log(`Payment ${metadata.paymentId} marked as processing`)
  } catch (error) {
    console.error('Error updating payment status:', error)
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id)

  const metadata = paymentIntent.metadata
  if (!metadata.paymentId) {
    console.error('Missing payment ID in payment intent metadata')
    return
  }

  try {
    // Update payment in database
    const payment = await prisma.payment.update({
      where: { id: metadata.paymentId },
      data: {
        status: PaymentStatus.COMPLETED,
        stripePaymentIntentId: paymentIntent.id,
        completedAt: new Date()
      }
    })

    console.log(`Payment ${payment.id} completed, executing transfers...`)

    // Execute all transfers using the flexible transfer system
    await TransferService.executeTransfers(payment.id)

    // Get transfer summary for logging
    const summary = await TransferService.getTransferSummary(payment.id)
    console.log(`Transfer summary for payment ${payment.id}:`, {
      totalTransferred: summary.total,
      completed: summary.completed,
      failed: summary.failed,
      pending: summary.pending
    })

  } catch (error) {
    console.error('Error processing payment completion:', error)

    // Mark payment as failed if transfer processing fails
    if (metadata.paymentId) {
      try {
        await prisma.payment.update({
          where: { id: metadata.paymentId },
          data: { status: PaymentStatus.FAILED }
        })
      } catch (dbError) {
        console.error('Error updating payment status to failed:', dbError)
      }
    }
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { convertToStripeAmount } from '@/lib/payment-utils'
import { TransferService } from '@/lib/transfer-service'
import { prisma } from '@/lib/prisma'
import { PaymentStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { productId, customerId, quantity = 1 } = data

    let product, customer

    try {
      // Try to get product and customer from database
      const results = await Promise.all([
        prisma.product.findUnique({
          where: { id: productId },
          include: {
            transferRules: {
              where: { isActive: true },
              include: { recipient: true },
              orderBy: { priority: 'asc' }
            }
          }
        }),
        // Try to find customer by ID first, then by email
        customerId.includes('@')
          ? prisma.user.findUnique({ where: { email: customerId } })
          : prisma.user.findUnique({ where: { id: customerId } })
      ])

      product = results[0]
      customer = results[1]
    } catch (dbError) {
      console.warn('Database not available, using fallback data:', dbError)

      // Fallback data when database is not available
      if (productId === 'wellness-package-1') {
        product = {
          id: 'wellness-package-1',
          name: 'Premium Wellness Package',
          description: 'Complete wellness solution with supplements and consultation',
          retailPrice: 299.99,
          wholesalePrice: 180.00,
          transferRules: []
        }
      }

      customer = {
        id: 'customer_fallback',
        email: customerId.includes('@') ? customerId : 'customer@example.com',
        name: 'Demo Customer'
      }
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    const totalAmount = product.retailPrice * quantity

    let payment, breakdown

    try {
      // Create payment record in database
      payment = await prisma.payment.create({
        data: {
          amount: totalAmount,
          status: PaymentStatus.PENDING,
          customerId: customer.id,
          productId,
          metadata: {
            quantity,
            unitPrice: product.retailPrice
          }
        }
      })

      // Calculate transfer breakdown for display
      const transferCalculations = await TransferService.calculateTransfers(payment.id)
      breakdown = {
        totalAmount,
        transfers: transferCalculations.map(calc => ({
          recipientName: calc.recipientName,
          amount: calc.amount,
          type: calc.type
        }))
      }
    } catch (dbError) {
      console.warn('Database payment creation failed, using fallback:', dbError)

      // Fallback payment data
      payment = {
        id: `payment_${Date.now()}`,
        amount: totalAmount
      }

      // Fallback breakdown data
      breakdown = {
        totalAmount,
        transfers: [
          { recipientName: 'Brand Partner', amount: 180.00, type: 'WHOLESALE' },
          { recipientName: 'Wellness Provider', amount: 45.00, type: 'COMMISSION' },
          { recipientName: 'Company', amount: 30.00, type: 'FEE' },
          { recipientName: 'Platform', amount: 44.99, type: 'FEE' }
        ]
      }
    }

    // Check if Stripe is properly configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('your_secret_key_here')) {
      return NextResponse.json(
        {
          error: 'Stripe is not configured. Please set up your Stripe secret key.',
          details: 'Contact admin to configure STRIPE_SECRET_KEY environment variable.'
        },
        { status: 503 }
      )
    }

    let session
    try {
      // Create Stripe checkout session
      session = await stripe.checkout.sessions.create({
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
          paymentId: payment.id,
          productId,
          customerId: customer.id,
          quantity: quantity.toString(),
        },
        payment_intent_data: {
          metadata: {
            paymentId: payment.id,
            productId,
            customerId: customer.id,
          },
        },
      })
    } catch (stripeError: any) {
      console.error('Stripe error:', stripeError)
      return NextResponse.json(
        {
          error: 'Payment service configuration error',
          details: stripeError.message || 'Unable to create checkout session'
        },
        { status: 503 }
      )
    }

    // Update payment with Stripe session ID (if database is available)
    try {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { stripeSessionId: session.id }
      })
    } catch (dbError) {
      console.warn('Could not update payment with session ID:', dbError)
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      breakdown
    })

  } catch (error) {
    console.error('Error creating checkout session:', error)

    // Ensure we always return a JSON response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

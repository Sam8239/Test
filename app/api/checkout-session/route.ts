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

    // Get product and customer from database
    const [product, customer] = await Promise.all([
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

    // Create payment record in database
    const payment = await prisma.payment.create({
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
    const breakdown = {
      totalAmount,
      transfers: transferCalculations.map(calc => ({
        recipientName: calc.recipientName,
        amount: calc.amount,
        type: calc.type
      }))
    }

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
        paymentId: payment.id,
        productId,
        customerId,
        quantity: quantity.toString(),
      },
      payment_intent_data: {
        metadata: {
          paymentId: payment.id,
          productId,
          customerId,
        },
      },
    })

    // Update payment with Stripe session ID
    await prisma.payment.update({
      where: { id: payment.id },
      data: { stripeSessionId: session.id }
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

'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { PaymentBreakdown } from '@/types/marketplace'

interface StripePaymentButtonProps {
  productId: string
  customerId: string
  quantity?: number
  className?: string
  children?: React.ReactNode
}

export default function StripePaymentButton({
  productId,
  customerId,
  quantity = 1,
  className = '',
  children = 'Pay Now',
}: StripePaymentButtonProps) {
  const [loading, setLoading] = useState(false)
  const [breakdown, setBreakdown] = useState<PaymentBreakdown | null>(null)

  const handlePayment = async () => {
    setLoading(true)

    try {
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      // Create checkout session
      const response = await fetch('/api/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          customerId,
          quantity,
        }),
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        throw new Error('Failed to parse server response')
      }

      if (!response.ok) {
        throw new Error(data?.error || `Server error: ${response.status}`)
      }

      setBreakdown(data.breakdown)

      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      })

      if (error) {
        console.error('Stripe redirect error:', error)
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handlePayment}
        disabled={loading}
        className={`
          inline-flex items-center justify-center px-6 py-3 border border-transparent
          text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed transition-colors
          ${className}
        `}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          children
        )}
      </button>
      
      {breakdown && (
        <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Payment Breakdown:</h3>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Total Amount:</span>
              <span className="font-medium">${breakdown.totalAmount.toFixed(2)}</span>
            </div>
            {breakdown.transfers?.map((transfer: any, index: number) => (
              <div key={index} className="flex justify-between">
                <span>{transfer.recipientName} ({transfer.type}):</span>
                <span>${transfer.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

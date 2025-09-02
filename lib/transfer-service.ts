import { prisma } from './prisma'
import { stripe } from './stripe'
import { convertToStripeAmount, convertFromStripeAmount } from './payment-utils'
import { TransferType, TransferStatus, PaymentStatus } from '@prisma/client'

export interface TransferCalculation {
  recipientId: string
  recipientName: string
  amount: number
  type: TransferType
  transferRuleId: string
  stripeConnectAccountId?: string
}

export class TransferService {
  /**
   * Calculate all transfers for a given payment
   */
  static async calculateTransfers(paymentId: string): Promise<TransferCalculation[]> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        product: {
          include: {
            transferRules: {
              where: { isActive: true },
              include: { recipient: true },
              orderBy: { priority: 'asc' }
            }
          }
        }
      }
    })

    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`)
    }

    const transfers: TransferCalculation[] = []
    
    for (const rule of payment.product.transferRules) {
      let amount: number

      if (rule.type === TransferType.WHOLESALE && rule.amount) {
        // Fixed wholesale amount
        amount = rule.amount
      } else if (rule.percentage) {
        // Percentage-based calculation
        amount = payment.amount * rule.percentage
      } else {
        console.warn(`Transfer rule ${rule.id} has no amount or percentage defined`)
        continue
      }

      transfers.push({
        recipientId: rule.recipientId,
        recipientName: rule.recipient.name,
        amount,
        type: rule.type,
        transferRuleId: rule.id,
        stripeConnectAccountId: rule.recipient.stripeConnectAccountId || undefined
      })
    }

    return transfers
  }

  /**
   * Execute all transfers for a payment
   */
  static async executeTransfers(paymentId: string): Promise<void> {
    const transfers = await this.calculateTransfers(paymentId)
    
    console.log(`Executing ${transfers.length} transfers for payment ${paymentId}`)

    for (const transfer of transfers) {
      try {
        await this.executeTransfer(paymentId, transfer)
      } catch (error) {
        console.error(`Failed to execute transfer to ${transfer.recipientName}:`, error)
        // Continue with other transfers even if one fails
      }
    }

    // Mark payment transfers as completed
    await prisma.payment.update({
      where: { id: paymentId },
      data: { transfersCompleted: true }
    })
  }

  /**
   * Execute a single transfer
   */
  private static async executeTransfer(
    paymentId: string, 
    transferCalc: TransferCalculation
  ): Promise<void> {
    // Create transfer record in database
    const transfer = await prisma.transfer.create({
      data: {
        amount: transferCalc.amount,
        type: transferCalc.type,
        status: TransferStatus.PENDING,
        paymentId,
        recipientId: transferCalc.recipientId,
        transferRuleId: transferCalc.transferRuleId,
        metadata: {
          calculatedAt: new Date().toISOString()
        }
      }
    })

    try {
      // Only execute Stripe transfer if recipient has connected account
      if (transferCalc.stripeConnectAccountId) {
        const stripeTransfer = await stripe.transfers.create({
          amount: convertToStripeAmount(transferCalc.amount),
          currency: 'usd',
          destination: transferCalc.stripeConnectAccountId,
          metadata: {
            transferId: transfer.id,
            paymentId,
            type: transferCalc.type,
            recipientId: transferCalc.recipientId
          }
        })

        // Update transfer with Stripe ID and mark as completed
        await prisma.transfer.update({
          where: { id: transfer.id },
          data: {
            stripeTransferId: stripeTransfer.id,
            status: TransferStatus.COMPLETED,
            completedAt: new Date()
          }
        })

        console.log(`✅ Transfer completed: $${transferCalc.amount} to ${transferCalc.recipientName}`)
      } else {
        // Mark as completed but note no Stripe transfer (e.g., for company revenue)
        await prisma.transfer.update({
          where: { id: transfer.id },
          data: {
            status: TransferStatus.COMPLETED,
            completedAt: new Date(),
            metadata: {
              ...transfer.metadata as object,
              note: 'No Stripe transfer - recipient has no connected account'
            }
          }
        })

        console.log(`✅ Transfer recorded: $${transferCalc.amount} to ${transferCalc.recipientName} (no Stripe account)`)
      }
    } catch (error) {
      // Update transfer as failed
      await prisma.transfer.update({
        where: { id: transfer.id },
        data: {
          status: TransferStatus.FAILED,
          failedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      throw error
    }
  }

  /**
   * Get transfer summary for a payment
   */
  static async getTransferSummary(paymentId: string) {
    const transfers = await prisma.transfer.findMany({
      where: { paymentId },
      include: {
        recipient: true,
        transferRule: true
      }
    })

    return {
      total: transfers.reduce((sum, t) => sum + t.amount, 0),
      completed: transfers.filter(t => t.status === TransferStatus.COMPLETED).length,
      failed: transfers.filter(t => t.status === TransferStatus.FAILED).length,
      pending: transfers.filter(t => t.status === TransferStatus.PENDING).length,
      transfers: transfers.map(t => ({
        id: t.id,
        amount: t.amount,
        status: t.status,
        type: t.type,
        recipient: t.recipient.name,
        stripeTransferId: t.stripeTransferId,
        completedAt: t.completedAt,
        errorMessage: t.errorMessage
      }))
    }
  }
}

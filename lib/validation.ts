import { z } from 'zod'

// Install zod: npm install zod

export const CheckoutSessionSchema = z.object({
  productId: z.string().min(1).max(100),
  customerId: z.string().email().or(z.string().min(1).max(100)),
  quantity: z.number().int().min(1).max(100).default(1),
})

export const TransferRuleSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  type: z.enum(['WHOLESALE', 'COMMISSION', 'FEE', 'BONUS', 'REFERRAL', 'CUSTOM']),
  amount: z.number().positive().optional(),
  percentage: z.number().min(0).max(1).optional(),
  priority: z.number().int().min(0).default(0),
  productId: z.string().min(1),
  recipientId: z.string().min(1),
  isActive: z.boolean().default(true),
})

export const WebhookEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.record(z.any()),
  }),
  created: z.number(),
})

// Validation helper functions
export function validateCheckoutSession(data: unknown) {
  return CheckoutSessionSchema.safeParse(data)
}

export function validateTransferRule(data: unknown) {
  return TransferRuleSchema.safeParse(data)
}

export function validateWebhookEvent(data: unknown) {
  return WebhookEventSchema.safeParse(data)
}

// Environment variable validation
export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  NEXT_PUBLIC_APP_URL: z.string().url(),
})

export function validateEnv() {
  const result = EnvSchema.safeParse(process.env)
  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.flatten().fieldErrors)
    throw new Error('Invalid environment configuration')
  }
  return result.data
}

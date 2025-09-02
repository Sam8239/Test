import { validateEnv } from './validation'

// Validate environment variables on startup
const env = validateEnv()

export const config = {
  // App configuration
  app: {
    name: 'Stripe Connect Marketplace',
    version: process.env.npm_package_version || '0.1.0',
    url: env.NEXT_PUBLIC_APP_URL,
    environment: env.NODE_ENV,
  },

  // Database configuration
  database: {
    url: env.DATABASE_URL,
    connectionLimit: process.env.DATABASE_CONNECTION_LIMIT 
      ? parseInt(process.env.DATABASE_CONNECTION_LIMIT) 
      : 10,
  },

  // Stripe configuration
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    publishableKey: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    apiVersion: '2024-06-20' as const,
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: env.NODE_ENV === 'production' ? 100 : 1000,
    apiMaxRequests: env.NODE_ENV === 'production' ? 20 : 200,
  },

  // Logging
  logging: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    enableConsole: env.NODE_ENV !== 'production',
  },

  // Feature flags
  features: {
    enableAnalytics: env.NODE_ENV === 'production',
    enableErrorTracking: env.NODE_ENV === 'production',
    enablePerformanceMonitoring: env.NODE_ENV === 'production',
  },

  // Pagination defaults
  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
  },

  // Transfer configuration
  transfers: {
    maxTransfersPerPayment: 10,
    minTransferAmount: 0.50, // $0.50 minimum
    maxTransferAmount: 10000.00, // $10,000 maximum
  },
}

export default config

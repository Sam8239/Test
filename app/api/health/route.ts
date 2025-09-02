import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function GET() {
  const startTime = Date.now()
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    checks: {
      database: { status: 'unknown', responseTime: 0 },
      stripe: { status: 'unknown', responseTime: 0 },
      memory: { status: 'healthy', usage: process.memoryUsage() },
    },
  }

  // Database health check
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    checks.checks.database = {
      status: 'healthy',
      responseTime: Date.now() - dbStart,
    }
  } catch (error) {
    checks.checks.database = {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
    checks.status = 'degraded'
  }

  // Stripe health check (minimal API call)
  try {
    const stripeStart = Date.now()
    await stripe.products.list({ limit: 1 })
    checks.checks.stripe = {
      status: 'healthy',
      responseTime: Date.now() - stripeStart,
    }
  } catch (error) {
    checks.checks.stripe = {
      status: 'unhealthy',
      responseTime: Date.now() - stripeStart,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
    checks.status = 'degraded'
  }

  // Memory usage check
  const memoryUsage = process.memoryUsage()
  const memoryThreshold = 1024 * 1024 * 1024 // 1GB
  if (memoryUsage.heapUsed > memoryThreshold) {
    checks.checks.memory.status = 'warning'
    checks.status = 'degraded'
  }

  const totalResponseTime = Date.now() - startTime
  const statusCode = checks.status === 'healthy' ? 200 : 503

  return NextResponse.json(
    {
      ...checks,
      responseTime: totalResponseTime,
    },
    {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache',
        'X-Response-Time': `${totalResponseTime}ms`,
      },
    }
  )
}

// Readiness probe (simpler check for load balancers)
export async function HEAD() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}

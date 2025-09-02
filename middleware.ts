import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Rate limiting store (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // requests per window
  apiMaxRequests: 20, // API requests per window
}

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown'
  return `${ip}:${request.nextUrl.pathname}`
}

function isRateLimited(key: string, maxRequests: number): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(key)
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
    })
    return false
  }
  
  if (record.count >= maxRequests) {
    return true
  }
  
  record.count++
  return false
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Security headers for all requests
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' js.stripe.com",
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    "font-src 'self' fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self' api.stripe.com",
    "frame-src js.stripe.com",
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  // Rate limiting
  const rateLimitKey = getRateLimitKey(request)
  const isApiRoute = pathname.startsWith('/api/')
  const maxRequests = isApiRoute 
    ? RATE_LIMIT_CONFIG.apiMaxRequests 
    : RATE_LIMIT_CONFIG.maxRequests
  
  if (isRateLimited(rateLimitKey, maxRequests)) {
    return NextResponse.json(
      { 
        error: 'Too many requests',
        retryAfter: Math.ceil(RATE_LIMIT_CONFIG.windowMs / 1000)
      },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil(RATE_LIMIT_CONFIG.windowMs / 1000).toString(),
        }
      }
    )
  }
  
  // API route protection
  if (isApiRoute) {
    // Add request ID for tracing
    response.headers.set('X-Request-ID', crypto.randomUUID())
    
    // Log API requests (in production, use proper logger)
    console.log(`API Request: ${request.method} ${pathname} from ${getRateLimitKey(request)}`)
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}

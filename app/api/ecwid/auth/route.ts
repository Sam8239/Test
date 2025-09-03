import { NextRequest, NextResponse } from 'next/server'
import { ecwidConfig } from '@/lib/ecwid-config'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is a brand partner
    if (user.role !== 'BRAND_PARTNER') {
      return NextResponse.json(
        { error: 'Only brand partners can connect Ecwid stores' },
        { status: 403 }
      )
    }

    // Generate OAuth state parameter for security
    const state = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15)

    // Store state in session or database for verification
    // For simplicity, we'll include user ID in state (in production, use proper session storage)
    const stateData = `${state}_${user.id}`

    // Build Ecwid OAuth URL
    const authUrl = new URL(ecwidConfig.authUrl)
    authUrl.searchParams.set('client_id', ecwidConfig.clientId)
    authUrl.searchParams.set('redirect_uri', ecwidConfig.redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', ecwidConfig.scopes.join(' '))
    authUrl.searchParams.set('state', stateData)

    // Return the authorization URL
    return NextResponse.json({
      authUrl: authUrl.toString(),
      state: stateData
    })

  } catch (error) {
    console.error('Ecwid OAuth initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is a brand partner
    if (user.role !== 'BRAND_PARTNER') {
      return NextResponse.json(
        { error: 'Only brand partners can connect Ecwid stores' },
        { status: 403 }
      )
    }

    // Generate OAuth state parameter
    const state = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15)
    const stateData = `${state}_${user.id}`

    // Build Ecwid OAuth URL
    const authUrl = new URL(ecwidConfig.authUrl)
    authUrl.searchParams.set('client_id', ecwidConfig.clientId)
    authUrl.searchParams.set('redirect_uri', ecwidConfig.redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', ecwidConfig.scopes.join(' '))
    authUrl.searchParams.set('state', stateData)

    return NextResponse.json({
      authUrl: authUrl.toString(),
      state: stateData
    })

  } catch (error) {
    console.error('Ecwid OAuth initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    )
  }
}

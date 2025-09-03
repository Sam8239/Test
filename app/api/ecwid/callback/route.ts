import { NextRequest, NextResponse } from 'next/server'
import { ecwidConfig, type EcwidTokenResponse } from '@/lib/ecwid-config'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      const errorDescription = searchParams.get('error_description')
      console.error('Ecwid OAuth error:', error, errorDescription)
      
      return NextResponse.redirect(
        new URL(`/dashboard/integrations?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=missing_parameters', request.url)
      )
    }

    // Extract user ID from state
    const stateParts = state.split('_')
    if (stateParts.length < 2) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=invalid_state', request.url)
      )
    }

    const userId = stateParts[1]

    // Verify user exists and is a brand partner
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || user.role !== 'BRAND_PARTNER') {
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=unauthorized', request.url)
      )
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch(ecwidConfig.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: ecwidConfig.clientId,
        client_secret: ecwidConfig.clientSecret,
        code: code,
        redirect_uri: ecwidConfig.redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=token_exchange_failed', request.url)
      )
    }

    const tokenData: EcwidTokenResponse = await tokenResponse.json()

    // Fetch store profile to get store information
    const storeProfileResponse = await fetch(
      `${ecwidConfig.apiBaseUrl}/${tokenData.store_id}/profile`,
      {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!storeProfileResponse.ok) {
      console.error('Failed to fetch store profile')
      return NextResponse.redirect(
        new URL('/dashboard/integrations?error=store_profile_failed', request.url)
      )
    }

    const storeProfile = await storeProfileResponse.json()

    // Store the OAuth token and store information in database
    const existingStore = await prisma.ecwidStore.findUnique({
      where: { ecwidStoreId: tokenData.store_id.toString() }
    })

    if (existingStore) {
      // Update existing store
      await prisma.ecwidStore.update({
        where: { id: existingStore.id },
        data: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.public_token || null,
          storeName: storeProfile.generalInfo?.storeTitle || storeProfile.account?.accountName || 'Unknown Store',
          storeUrl: storeProfile.generalInfo?.storeUrl || null,
          storeData: storeProfile,
          isActive: true,
          syncEnabled: true,
          updatedAt: new Date(),
        }
      })
    } else {
      // Create new store record
      await prisma.ecwidStore.create({
        data: {
          ecwidStoreId: tokenData.store_id.toString(),
          userId: userId,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.public_token || null,
          storeName: storeProfile.generalInfo?.storeTitle || storeProfile.account?.accountName || 'Unknown Store',
          storeUrl: storeProfile.generalInfo?.storeUrl || null,
          storeData: storeProfile,
          isActive: true,
          syncEnabled: true,
        }
      })
    }

    // Redirect to success page
    return NextResponse.redirect(
      new URL('/dashboard/integrations?success=ecwid_connected', request.url)
    )

  } catch (error) {
    console.error('Ecwid OAuth callback error:', error)
    
    return NextResponse.redirect(
      new URL('/dashboard/integrations?error=callback_failed', request.url)
    )
  }
}

// Handle POST requests for manual token refresh
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { storeId, refreshToken } = body

    if (!storeId || !refreshToken) {
      return NextResponse.json(
        { error: 'Store ID and refresh token are required' },
        { status: 400 }
      )
    }

    // Refresh the access token
    const tokenResponse = await fetch(ecwidConfig.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: ecwidConfig.clientId,
        client_secret: ecwidConfig.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token refresh failed:', errorText)
      
      return NextResponse.json(
        { error: 'Failed to refresh token' },
        { status: 400 }
      )
    }

    const tokenData: EcwidTokenResponse = await tokenResponse.json()

    // Update the store with new token
    await prisma.ecwidStore.update({
      where: { ecwidStoreId: storeId },
      data: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.public_token || refreshToken,
        updatedAt: new Date(),
      }
    })

    return NextResponse.json({
      message: 'Token refreshed successfully',
      storeId: tokenData.store_id
    })

  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    )
  }
}

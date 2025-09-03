import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import EcwidService from '@/lib/ecwid-service'

export async function POST(request: NextRequest) {
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
      where: { email: session.user.email },
      include: {
        ecwidStores: true
      }
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
        { error: 'Only brand partners can sync Ecwid stores' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { storeId, syncType = 'all' } = body

    // Get the specific store or use the first active store
    let store
    if (storeId) {
      store = user.ecwidStores.find(s => s.id === storeId && s.isActive)
    } else {
      store = user.ecwidStores.find(s => s.isActive && s.syncEnabled)
    }

    if (!store) {
      return NextResponse.json(
        { error: 'No active Ecwid store found' },
        { status: 404 }
      )
    }

    // Create Ecwid service instance
    const ecwidService = new EcwidService(store.accessToken, store.ecwidStoreId)

    // Test connection first
    const isConnected = await ecwidService.testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Unable to connect to Ecwid store. Please check your integration.' },
        { status: 400 }
      )
    }

    const results: any = {
      storeId: store.id,
      storeName: store.storeName,
      syncType,
      startTime: new Date().toISOString()
    }

    // Sync products
    if (syncType === 'all' || syncType === 'products') {
      try {
        const productSync = await ecwidService.syncProducts()
        results.products = {
          synced: productSync.synced,
          errors: productSync.errors
        }
      } catch (error) {
        results.products = {
          synced: 0,
          errors: [`Product sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
        }
      }
    }

    // Sync orders
    if (syncType === 'all' || syncType === 'orders') {
      try {
        // Sync orders from the last sync date or last 30 days
        const fromDate = store.lastSyncAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const orderSync = await ecwidService.syncOrders(fromDate)
        results.orders = {
          synced: orderSync.synced,
          errors: orderSync.errors
        }
      } catch (error) {
        results.orders = {
          synced: 0,
          errors: [`Order sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
        }
      }
    }

    results.endTime = new Date().toISOString()
    results.success = true

    return NextResponse.json(results)

  } catch (error) {
    console.error('Ecwid sync error:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Get sync status and history
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
      where: { email: session.user.email },
      include: {
        ecwidStores: {
          include: {
            _count: {
              select: {
                products: true,
                orders: true
              }
            }
          }
        }
      }
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
        { error: 'Only brand partners can view sync status' },
        { status: 403 }
      )
    }

    const stores = user.ecwidStores.map(store => ({
      id: store.id,
      ecwidStoreId: store.ecwidStoreId,
      storeName: store.storeName,
      storeUrl: store.storeUrl,
      isActive: store.isActive,
      syncEnabled: store.syncEnabled,
      lastSyncAt: store.lastSyncAt,
      productCount: store._count.products,
      orderCount: store._count.orders,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt
    }))

    return NextResponse.json({
      stores,
      totalStores: stores.length,
      activeStores: stores.filter(s => s.isActive).length
    })

  } catch (error) {
    console.error('Ecwid sync status error:', error)
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import EcwidService from '@/lib/ecwid-service'

// Get user's Ecwid stores
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

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

    if (user.role !== 'BRAND_PARTNER') {
      return NextResponse.json(
        { error: 'Only brand partners can view Ecwid stores' },
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

    return NextResponse.json({ stores })

  } catch (error) {
    console.error('Get Ecwid stores error:', error)
    return NextResponse.json(
      { error: 'Failed to get stores' },
      { status: 500 }
    )
  }
}

// Update store settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.role !== 'BRAND_PARTNER') {
      return NextResponse.json(
        { error: 'Only brand partners can update Ecwid stores' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { storeId, syncEnabled, isActive } = body

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      )
    }

    // Verify the store belongs to the user
    const store = await prisma.ecwidStore.findFirst({
      where: {
        id: storeId,
        userId: user.id
      }
    })

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found or access denied' },
        { status: 404 }
      )
    }

    // Update store settings
    const updatedStore = await prisma.ecwidStore.update({
      where: { id: storeId },
      data: {
        ...(syncEnabled !== undefined && { syncEnabled }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      message: 'Store updated successfully',
      store: {
        id: updatedStore.id,
        storeName: updatedStore.storeName,
        syncEnabled: updatedStore.syncEnabled,
        isActive: updatedStore.isActive,
        updatedAt: updatedStore.updatedAt
      }
    })

  } catch (error) {
    console.error('Update Ecwid store error:', error)
    return NextResponse.json(
      { error: 'Failed to update store' },
      { status: 500 }
    )
  }
}

// Disconnect/delete Ecwid store
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.role !== 'BRAND_PARTNER') {
      return NextResponse.json(
        { error: 'Only brand partners can disconnect Ecwid stores' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      )
    }

    // Verify the store belongs to the user
    const store = await prisma.ecwidStore.findFirst({
      where: {
        id: storeId,
        userId: user.id
      }
    })

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found or access denied' },
        { status: 404 }
      )
    }

    // Delete related data first (due to foreign key constraints)
    await prisma.$transaction(async (tx) => {
      // Delete products
      await tx.ecwidProduct.deleteMany({
        where: { ecwidStoreId: store.id }
      })

      // Delete orders
      await tx.ecwidOrder.deleteMany({
        where: { ecwidStoreId: store.id }
      })

      // Delete the store
      await tx.ecwidStore.delete({
        where: { id: storeId }
      })
    })

    return NextResponse.json({
      message: 'Store disconnected successfully',
      storeId
    })

  } catch (error) {
    console.error('Delete Ecwid store error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect store' },
      { status: 500 }
    )
  }
}

// Test store connection
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.role !== 'BRAND_PARTNER') {
      return NextResponse.json(
        { error: 'Only brand partners can test Ecwid store connections' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { storeId } = body

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      )
    }

    // Verify the store belongs to the user
    const store = await prisma.ecwidStore.findFirst({
      where: {
        id: storeId,
        userId: user.id
      }
    })

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found or access denied' },
        { status: 404 }
      )
    }

    // Test connection
    const ecwidService = new EcwidService(store.accessToken, store.ecwidStoreId)
    const isConnected = await ecwidService.testConnection()

    if (isConnected) {
      // Get store profile for additional info
      try {
        const profile = await ecwidService.getStoreProfile()
        return NextResponse.json({
          connected: true,
          storeInfo: {
            name: profile.generalInfo?.storeTitle || store.storeName,
            url: profile.generalInfo?.storeUrl || store.storeUrl,
            country: profile.generalInfo?.storeLocation?.country
          }
        })
      } catch (error) {
        return NextResponse.json({
          connected: true,
          storeInfo: {
            name: store.storeName,
            url: store.storeUrl
          }
        })
      }
    } else {
      return NextResponse.json({
        connected: false,
        error: 'Unable to connect to Ecwid store'
      })
    }

  } catch (error) {
    console.error('Test Ecwid store connection error:', error)
    return NextResponse.json(
      { error: 'Failed to test connection' },
      { status: 500 }
    )
  }
}

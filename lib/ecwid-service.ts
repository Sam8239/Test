import { ecwidConfig, type EcwidProduct, type EcwidOrder, type EcwidApiError } from './ecwid-config'
import { prisma } from './prisma'

export class EcwidService {
  private accessToken: string
  private storeId: string

  constructor(accessToken: string, storeId: string) {
    this.accessToken = accessToken
    this.storeId = storeId
  }

  /**
   * Create an EcwidService instance from database store record
   */
  static async fromStoreId(ecwidStoreId: string): Promise<EcwidService | null> {
    const store = await prisma.ecwidStore.findUnique({
      where: { ecwidStoreId }
    })

    if (!store || !store.isActive) {
      return null
    }

    return new EcwidService(store.accessToken, store.ecwidStoreId)
  }

  /**
   * Create an EcwidService instance from user ID
   */
  static async fromUserId(userId: string): Promise<EcwidService | null> {
    const store = await prisma.ecwidStore.findFirst({
      where: { 
        userId,
        isActive: true
      }
    })

    if (!store) {
      return null
    }

    return new EcwidService(store.accessToken, store.ecwidStoreId)
  }

  /**
   * Make authenticated request to Ecwid API
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${ecwidConfig.apiBaseUrl}/${this.storeId}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData: EcwidApiError = await response.json().catch(() => ({
        errorMessage: `HTTP ${response.status}: ${response.statusText}`
      }))
      
      throw new Error(`Ecwid API Error: ${errorData.errorMessage}`)
    }

    return response.json()
  }

  /**
   * Get store profile information
   */
  async getStoreProfile() {
    return this.makeRequest('/profile')
  }

  /**
   * Get all products from Ecwid store
   */
  async getProducts(params: {
    offset?: number
    limit?: number
    enabled?: boolean
    inStock?: boolean
    category?: number
  } = {}): Promise<{ items: EcwidProduct[]; total: number; count: number; offset: number; limit: number }> {
    const searchParams = new URLSearchParams()
    
    if (params.offset !== undefined) searchParams.set('offset', params.offset.toString())
    if (params.limit !== undefined) searchParams.set('limit', params.limit.toString())
    if (params.enabled !== undefined) searchParams.set('enabled', params.enabled.toString())
    if (params.inStock !== undefined) searchParams.set('inStock', params.inStock.toString())
    if (params.category !== undefined) searchParams.set('category', params.category.toString())

    const query = searchParams.toString()
    const endpoint = `/products${query ? `?${query}` : ''}`
    
    return this.makeRequest(endpoint)
  }

  /**
   * Get a single product by ID
   */
  async getProduct(productId: number): Promise<EcwidProduct> {
    return this.makeRequest(`/products/${productId}`)
  }

  /**
   * Get all orders from Ecwid store
   */
  async getOrders(params: {
    offset?: number
    limit?: number
    createdFrom?: string
    createdTo?: string
    updatedFrom?: string
    updatedTo?: string
    fulfillmentStatus?: string
    paymentStatus?: string
  } = {}): Promise<{ items: EcwidOrder[]; total: number; count: number; offset: number; limit: number }> {
    const searchParams = new URLSearchParams()
    
    if (params.offset !== undefined) searchParams.set('offset', params.offset.toString())
    if (params.limit !== undefined) searchParams.set('limit', params.limit.toString())
    if (params.createdFrom) searchParams.set('createdFrom', params.createdFrom)
    if (params.createdTo) searchParams.set('createdTo', params.createdTo)
    if (params.updatedFrom) searchParams.set('updatedFrom', params.updatedFrom)
    if (params.updatedTo) searchParams.set('updatedTo', params.updatedTo)
    if (params.fulfillmentStatus) searchParams.set('fulfillmentStatus', params.fulfillmentStatus)
    if (params.paymentStatus) searchParams.set('paymentStatus', params.paymentStatus)

    const query = searchParams.toString()
    const endpoint = `/orders${query ? `?${query}` : ''}`
    
    return this.makeRequest(endpoint)
  }

  /**
   * Get a single order by ID
   */
  async getOrder(orderNumber: number): Promise<EcwidOrder> {
    return this.makeRequest(`/orders/${orderNumber}`)
  }

  /**
   * Update order status
   */
  async updateOrder(orderNumber: number, updates: {
    fulfillmentStatus?: string
    paymentStatus?: string
    trackingNumber?: string
    notes?: string
  }): Promise<void> {
    await this.makeRequest(`/orders/${orderNumber}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  /**
   * Get product categories
   */
  async getCategories(params: {
    parent?: number
    offset?: number
    limit?: number
  } = {}) {
    const searchParams = new URLSearchParams()
    
    if (params.parent !== undefined) searchParams.set('parent', params.parent.toString())
    if (params.offset !== undefined) searchParams.set('offset', params.offset.toString())
    if (params.limit !== undefined) searchParams.set('limit', params.limit.toString())

    const query = searchParams.toString()
    const endpoint = `/categories${query ? `?${query}` : ''}`
    
    return this.makeRequest(endpoint)
  }

  /**
   * Get customers
   */
  async getCustomers(params: {
    offset?: number
    limit?: number
    keyword?: string
  } = {}) {
    const searchParams = new URLSearchParams()
    
    if (params.offset !== undefined) searchParams.set('offset', params.offset.toString())
    if (params.limit !== undefined) searchParams.set('limit', params.limit.toString())
    if (params.keyword) searchParams.set('keyword', params.keyword)

    const query = searchParams.toString()
    const endpoint = `/customers${query ? `?${query}` : ''}`
    
    return this.makeRequest(endpoint)
  }

  /**
   * Sync products from Ecwid to local database
   */
  async syncProducts(): Promise<{ synced: number; errors: string[] }> {
    let synced = 0
    const errors: string[] = []
    let offset = 0
    const limit = 100

    try {
      while (true) {
        const response = await this.getProducts({ offset, limit, enabled: true })
        
        if (response.items.length === 0) break

        for (const product of response.items) {
          try {
            await prisma.ecwidProduct.upsert({
              where: {
                ecwidProductId_ecwidStoreId: {
                  ecwidProductId: product.id.toString(),
                  ecwidStoreId: this.storeId
                }
              },
              update: {
                name: product.name,
                description: product.description || null,
                sku: product.sku || null,
                price: product.price,
                compareToPrice: product.compareToPrice || null,
                wholesalePrice: product.wholesalePrice || null,
                weight: product.weight || null,
                enabled: product.enabled,
                inStock: product.inStock,
                quantity: product.quantity || null,
                categoryIds: product.categoryIds || null,
                imageUrls: product.imageUrls || null,
                ecwidData: product as any,
                lastSyncAt: new Date(),
                updatedAt: new Date(),
              },
              create: {
                ecwidProductId: product.id.toString(),
                ecwidStoreId: this.storeId,
                name: product.name,
                description: product.description || null,
                sku: product.sku || null,
                price: product.price,
                compareToPrice: product.compareToPrice || null,
                wholesalePrice: product.wholesalePrice || null,
                weight: product.weight || null,
                enabled: product.enabled,
                inStock: product.inStock,
                quantity: product.quantity || null,
                categoryIds: product.categoryIds || null,
                imageUrls: product.imageUrls || null,
                ecwidData: product as any,
                lastSyncAt: new Date(),
              }
            })
            synced++
          } catch (error) {
            errors.push(`Product ${product.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }

        offset += limit
        
        // Break if we've processed all products
        if (offset >= response.total) break
      }

      // Update last sync time for the store
      await prisma.ecwidStore.update({
        where: { ecwidStoreId: this.storeId },
        data: { lastSyncAt: new Date() }
      })

    } catch (error) {
      errors.push(`General sync error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return { synced, errors }
  }

  /**
   * Sync orders from Ecwid to local database
   */
  async syncOrders(fromDate?: Date): Promise<{ synced: number; errors: string[] }> {
    let synced = 0
    const errors: string[] = []
    let offset = 0
    const limit = 100

    try {
      const params: any = { offset, limit }
      if (fromDate) {
        params.createdFrom = fromDate.toISOString()
      }

      while (true) {
        const response = await this.getOrders(params)
        
        if (response.items.length === 0) break

        for (const order of response.items) {
          try {
            await prisma.ecwidOrder.upsert({
              where: {
                ecwidOrderId_ecwidStoreId: {
                  ecwidOrderId: order.orderNumber.toString(),
                  ecwidStoreId: this.storeId
                }
              },
              update: {
                orderNumber: order.orderNumber.toString(),
                customerEmail: order.email || null,
                customerName: order.customerName || null,
                total: order.total,
                subtotal: order.subtotal || null,
                tax: order.tax || null,
                shipping: order.shipping || null,
                discount: order.discount || null,
                fulfillmentStatus: order.fulfillmentStatus,
                paymentStatus: order.paymentStatus,
                orderDate: new Date(order.createDate),
                items: order.items || null,
                shippingAddress: order.shippingAddress || null,
                billingAddress: order.billingAddress || null,
                ecwidData: order as any,
                lastSyncAt: new Date(),
                updatedAt: new Date(),
              },
              create: {
                ecwidOrderId: order.orderNumber.toString(),
                ecwidStoreId: this.storeId,
                orderNumber: order.orderNumber.toString(),
                customerEmail: order.email || null,
                customerName: order.customerName || null,
                total: order.total,
                subtotal: order.subtotal || null,
                tax: order.tax || null,
                shipping: order.shipping || null,
                discount: order.discount || null,
                fulfillmentStatus: order.fulfillmentStatus,
                paymentStatus: order.paymentStatus,
                orderDate: new Date(order.createDate),
                items: order.items || null,
                shippingAddress: order.shippingAddress || null,
                billingAddress: order.billingAddress || null,
                ecwidData: order as any,
                lastSyncAt: new Date(),
              }
            })
            synced++
          } catch (error) {
            errors.push(`Order ${order.orderNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }

        offset += limit
        params.offset = offset
        
        // Break if we've processed all orders
        if (offset >= response.total) break
      }

      // Update last sync time for the store
      await prisma.ecwidStore.update({
        where: { ecwidStoreId: this.storeId },
        data: { lastSyncAt: new Date() }
      })

    } catch (error) {
      errors.push(`General sync error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return { synced, errors }
  }

  /**
   * Test connection to Ecwid store
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getStoreProfile()
      return true
    } catch (error) {
      console.error('Ecwid connection test failed:', error)
      return false
    }
  }
}

export default EcwidService

export const ecwidConfig = {
  clientId: process.env.ECWID_CLIENT_ID!,
  clientSecret: process.env.ECWID_CLIENT_SECRET!,
  redirectUri: process.env.ECWID_REDIRECT_URI!,
  apiBaseUrl: process.env.ECWID_API_BASE_URL!,
  
  // OAuth scopes required for integration
  scopes: [
    'read_store_profile',
    'read_catalog',
    'update_catalog',
    'create_catalog',
    'read_orders',
    'update_orders',
    'read_customers',
    'update_customers'
  ],
  
  // OAuth URLs
  authUrl: 'https://my.ecwid.com/api/oauth/authorize',
  tokenUrl: 'https://my.ecwid.com/api/oauth/token',
  
  // API endpoints
  endpoints: {
    profile: '/profile',
    products: '/products',
    orders: '/orders',
    customers: '/customers',
    categories: '/categories'
  }
}

export type EcwidStore = {
  id: string
  storeId: string
  storeName: string
  storeUrl?: string
  accessToken: string
  refreshToken?: string
  tokenExpiresAt?: Date
  isActive: boolean
  syncEnabled: boolean
  lastSyncAt?: Date
}

export type EcwidProduct = {
  id: number
  name: string
  description?: string
  sku?: string
  price: number
  compareToPrice?: number
  wholesalePrice?: number
  weight?: number
  enabled: boolean
  inStock: boolean
  quantity?: number
  categoryIds?: number[]
  imageUrls?: string[]
  created: string
  updated: string
}

export type EcwidOrder = {
  orderNumber: number
  vendorOrderNumber?: string
  email?: string
  customerName?: string
  total: number
  subtotal?: number
  tax?: number
  shipping?: number
  discount?: number
  fulfillmentStatus: string
  paymentStatus: string
  createDate: string
  updateDate?: string
  items: EcwidOrderItem[]
  shippingAddress?: EcwidAddress
  billingAddress?: EcwidAddress
}

export type EcwidOrderItem = {
  id: number
  productId: number
  categoryId?: number
  price: number
  productPrice: number
  sku?: string
  quantity: number
  name: string
  weight?: number
}

export type EcwidAddress = {
  name?: string
  companyName?: string
  street?: string
  city?: string
  countryCode?: string
  countryName?: string
  postalCode?: string
  stateOrProvinceCode?: string
  stateOrProvinceName?: string
  phone?: string
}

export type EcwidTokenResponse = {
  access_token: string
  token_type: string
  scope: string
  store_id: number
  public_token?: string
}

export type EcwidApiError = {
  errorMessage: string
  errorCode?: string
}

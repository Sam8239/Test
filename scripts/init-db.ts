import { prisma } from '../lib/prisma'
import { UserRole, TransferType } from '@prisma/client'

async function initializeDatabase() {
  try {
    console.log('🚀 Initializing database with sample data...')
    
    // Create sample users
    const companyUser = await prisma.user.upsert({
      where: { email: 'company@example.com' },
      update: {},
      create: {
        email: 'company@example.com',
        name: 'Company Admin',
        role: UserRole.COMPANY,
      },
    })
    
    const brandPartner = await prisma.user.upsert({
      where: { email: 'brand@example.com' },
      update: {},
      create: {
        email: 'brand@example.com',
        name: 'Brand Partner',
        role: UserRole.BRAND_PARTNER,
        stripeConnectAccountId: 'acct_brand_partner_stripe_id',
      },
    })
    
    const wellnessProvider = await prisma.user.upsert({
      where: { email: 'wellness@example.com' },
      update: {},
      create: {
        email: 'wellness@example.com',
        name: 'Wellness Provider',
        role: UserRole.WELLNESS_PROVIDER,
        stripeConnectAccountId: 'acct_wellness_provider_stripe_id',
      },
    })
    
    const affiliate = await prisma.user.upsert({
      where: { email: 'affiliate@example.com' },
      update: {},
      create: {
        email: 'affiliate@example.com',
        name: 'Affiliate Partner',
        role: UserRole.AFFILIATE,
        stripeConnectAccountId: 'acct_affiliate_stripe_id',
      },
    })
    
    const customer = await prisma.user.upsert({
      where: { email: 'customer@example.com' },
      update: {},
      create: {
        email: 'customer@example.com',
        name: 'Test Customer',
        role: UserRole.CUSTOMER,
      },
    })
    
    // Create sample product
    const product = await prisma.product.upsert({
      where: { id: 'wellness-package-1' },
      update: {},
      create: {
        id: 'wellness-package-1',
        name: 'Premium Wellness Package',
        description: 'Complete wellness solution with supplements and consultation',
        retailPrice: 299.99,
        wholesalePrice: 180.00,
        creatorId: brandPartner.id,
      },
    })
    
    // Create flexible transfer rules
    const transferRules = await Promise.all([
      // Brand partner gets wholesale amount
      prisma.transferRule.upsert({
        where: { id: 'rule-wholesale-brand' },
        update: {},
        create: {
          id: 'rule-wholesale-brand',
          name: 'Brand Partner Wholesale',
          description: 'Fixed wholesale amount to brand partner',
          type: TransferType.WHOLESALE,
          amount: 180.00,
          priority: 1,
          productId: product.id,
          recipientId: brandPartner.id,
        },
      }),
      
      // Wellness provider gets 15% commission
      prisma.transferRule.upsert({
        where: { id: 'rule-wellness-commission' },
        update: {},
        create: {
          id: 'rule-wellness-commission',
          name: 'Wellness Provider Commission',
          description: '15% commission to wellness provider',
          type: TransferType.COMMISSION,
          percentage: 0.15,
          priority: 2,
          productId: product.id,
          recipientId: wellnessProvider.id,
        },
      }),
      
      // Affiliate gets 5% commission
      prisma.transferRule.upsert({
        where: { id: 'rule-affiliate-commission' },
        update: {},
        create: {
          id: 'rule-affiliate-commission',
          name: 'Affiliate Commission',
          description: '5% commission to affiliate partner',
          type: TransferType.COMMISSION,
          percentage: 0.05,
          priority: 3,
          productId: product.id,
          recipientId: affiliate.id,
        },
      }),
      
      // Company keeps 10% as platform fee
      prisma.transferRule.upsert({
        where: { id: 'rule-platform-fee' },
        update: {},
        create: {
          id: 'rule-platform-fee',
          name: 'Platform Fee',
          description: '10% platform fee for company',
          type: TransferType.FEE,
          percentage: 0.10,
          priority: 4,
          productId: product.id,
          recipientId: companyUser.id,
        },
      }),
    ])
    
    console.log('✅ Database initialized successfully!')
    console.log(`Created ${transferRules.length} transfer rules for product: ${product.name}`)
    
  } catch (error) {
    console.error('❌ Error initializing database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  initializeDatabase()
}

export { initializeDatabase }

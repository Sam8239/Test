# Supabase + Prisma Setup Guide

This marketplace uses Supabase as the PostgreSQL database with Prisma as the ORM, providing a flexible transfer system for multiple partners.

## 🚀 Quick Setup

### 1. Connect to Supabase MCP
Click [Connect to Supabase](#open-mcp-popover) to connect your Supabase account.

### 2. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key

### 3. Update Environment Variables
Use the DevServerControl tool to set these variables:
- `DATABASE_URL`: Your Supabase PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL  
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key

### 4. Initialize Database
Run these commands in order:
```bash
npm run db:push      # Push schema to Supabase
npm run db:generate  # Generate Prisma client
npm run db:init      # Seed with sample data
```

## 🏗️ Database Schema

### Flexible Transfer System
The new system supports unlimited transfer types:
- **WHOLESALE**: Fixed amounts to brand partners
- **COMMISSION**: Percentage-based commissions
- **FEE**: Platform fees
- **BONUS**: Performance bonuses
- **REFERRAL**: Referral commissions
- **CUSTOM**: Custom transfer amounts

### Transfer Rules
Each product can have multiple transfer rules with:
- **Priority**: Execution order
- **Type**: Transfer type (wholesale, commission, etc.)
- **Amount**: Fixed amount OR percentage
- **Recipient**: User who receives the transfer
- **Active status**: Can be enabled/disabled

### Example Transfer Rules for a $299.99 Product:
1. **Brand Partner Wholesale**: $180.00 (fixed amount)
2. **Wellness Provider Commission**: 15% = $45.00
3. **Affiliate Commission**: 5% = $15.00
4. **Platform Fee**: 10% = $30.00
5. **Remaining**: $29.99 (automatically kept by company)

## 🔧 Adding New Transfer Types

### 1. Add New Transfer Rule
```typescript
await prisma.transferRule.create({
  data: {
    name: 'Distributor Commission',
    description: '8% commission to distributor',
    type: TransferType.COMMISSION,
    percentage: 0.08,
    priority: 5,
    productId: 'product-id',
    recipientId: 'distributor-user-id',
  }
})
```

### 2. No Code Changes Required!
The transfer system automatically:
- Calculates all active transfer rules
- Executes transfers in priority order
- Handles Stripe Connect transfers
- Records all transactions in database

## 🎯 Key Features

### Automatic Transfer Processing
- **Webhook-driven**: Transfers execute after payment confirmation
- **Fault-tolerant**: Failed transfers don't stop others
- **Auditable**: All transfers logged with status and timestamps
- **Flexible**: Add/remove partners without code changes

### Database-Driven Configuration
- **Transfer rules**: Stored in database, not hardcoded
- **User management**: Support for multiple user roles
- **Product catalog**: Each product can have unique transfer rules
- **Status tracking**: Monitor payment and transfer statuses

### Stripe Connect Integration
- **Multi-party payments**: Automatically distribute funds
- **Connected accounts**: Support for multiple partner accounts
- **Transfer tracking**: Stripe transfer IDs stored for reconciliation
- **Error handling**: Failed transfers logged with error messages

## 🔍 Monitoring Transfers

### View Transfer Summary
```typescript
const summary = await TransferService.getTransferSummary(paymentId)
console.log(summary)
// {
//   total: 270.00,
//   completed: 4,
//   failed: 0,
//   pending: 0,
//   transfers: [...]
// }
```

### Database Studio
View and manage data with Prisma Studio:
```bash
npm run db:studio
```

## ⚠️ Important Notes

1. **Stripe Connect Setup**: Ensure all partners have connected Stripe accounts
2. **Environment Variables**: Keep secrets secure and never commit to repository
3. **Database Backups**: Supabase automatically backs up your data
4. **Testing**: Use Stripe test mode for development

## 🚨 Troubleshooting

### Transfer Failures
- Check Stripe Connect account status
- Verify recipient has valid connected account
- Review transfer logs in database

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check Supabase project status
- Run `npm run db:push` to sync schema

### Missing Transfers
- Check transfer rule priority order
- Verify rules are marked as `isActive: true`
- Review payment status in database

# Stripe Setup Instructions

The payment button is currently showing configuration errors because Stripe keys need to be set up.

## 🔧 Quick Setup

### 1. Get Your Stripe Keys
1. Go to [stripe.com](https://stripe.com) and create an account
2. Navigate to **Developers > API Keys**
3. Copy your **Publishable Key** (starts with `pk_test_`)
4. Copy your **Secret Key** (starts with `sk_test_`)

### 2. Update Environment Variables
Use the DevServerControl tool to set these variables:

```bash
# Replace with your actual Stripe keys
STRIPE_SECRET_KEY=sk_test_your_actual_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_stripe_publishable_key
```

### 3. Test Payment Flow
After setting the keys:
1. Click the "💳 Pay $299.99" button
2. You'll be redirected to Stripe Checkout (test mode)
3. Use test card: `4242 4242 4242 4242`
4. Any future expiry date and CVC

## 🧪 Test Cards
Stripe provides these test cards:
- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Auth Required**: `4000 0025 0000 3155`

## ⚠️ Current Status
- **Database**: Using fallback data (Supabase not connected)
- **Stripe**: Demo keys - replace with real keys to test payments
- **Transfers**: Will work once Stripe Connect accounts are set up

## 🔗 Next Steps
1. **Set Stripe Keys** ✋ **(You are here)**
2. **Connect Database**: [Connect to Supabase](#open-mcp-popover)
3. **Set up Stripe Connect**: Configure connected accounts for transfers
4. **Production Ready**: Switch to live keys for production

## 💡 Demo Mode
Even without real Stripe keys, the app demonstrates:
- ✅ Payment breakdown calculation
- ✅ Multi-party transfer logic
- ✅ Graceful error handling
- ✅ Professional UI/UX

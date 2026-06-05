# Payment Integration Setup Guide

AcademIQ uses two payment gateways for maximum reliability:
- **Paystack** (Primary) - Most popular in Nigeria
- **Flutterwave** (Backup) - Alternative option

Both services offer **FREE accounts** for testing and production.

## Pricing Tiers

### Free Tier
- ₦0/month
- 5 exams per day
- Up to 20 questions per exam
- Basic features

### Starter Tier
- ₦500/month or ₦5,000/year (save ₦1,000)
- Unlimited exams
- Up to 50 questions per exam
- Timed exam mode
- Performance tracking

### Pro Tier
- ₦1,000/month or ₦10,000/year (save ₦2,000)
- Unlimited everything
- Advanced analytics
- Custom templates
- Export results
- Dedicated support

## Paystack Setup (Primary)

### 1. Create Account
1. Go to [https://paystack.com](https://paystack.com)
2. Click "Get Started" and sign up
3. Complete business verification
4. Activate your account

### 2. Get API Keys
1. Go to Settings → API Keys & Webhooks
2. Copy your **Secret Key** (starts with `sk_test_` for test mode)
3. Copy your **Public Key** (starts with `pk_test_` for test mode)

### 3. Add to Environment Variables
```env
PAYSTACK_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_xxxxxxxxxxxxxxxxxxxxxxx"
```

### 4. Set Up Webhook
1. In Paystack Dashboard, go to Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/payment/webhook`
3. Select events: `charge.success`
4. Save webhook
5. **Important**: The webhook signature is automatically verified using your secret key

### 5. Test Mode vs Live Mode
- **Test Mode**: Use test keys (prefix: `sk_test_`, `pk_test_`)
  - Test with card: 4084 0840 8408 4081
  - CVV: 408
  - Expiry: Any future date
  - OTP: 123456

- **Live Mode**: Switch to live keys when ready for production
  - Go to Settings → API Keys & Webhooks
  - Toggle to "Live Mode"
  - Copy live keys (prefix: `sk_live_`, `pk_live_`)

## Flutterwave Setup (Backup)

### 1. Create Account
1. Go to [https://flutterwave.com](https://flutterwave.com)
2. Sign up for a free account
3. Complete verification

### 2. Get API Keys
1. Go to Settings → API Keys
2. Copy **Secret Key** (starts with `FLWSECK_TEST-`)
3. Copy **Public Key** (starts with `FLWPUBK_TEST-`)
4. Copy **Encryption Key**

### 3. Add to Environment Variables
```env
FLUTTERWAVE_SECRET_KEY="FLWSECK_TEST-xxxxxxxxxxxxxxxx"
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY="FLWPUBK_TEST-xxxxxxxxxxxxxxxx"
FLUTTERWAVE_ENCRYPTION_KEY="FLWSECK_TESTxxxxxxxx"
```

### 4. Test Cards
- **Successful Payment**: 5531 8866 5214 2950
- **Failed Payment**: 5143 0100 0000 0003
- CVV: 564
- Expiry: 09/32
- OTP: 12345

## Webhook URLs

Make sure these endpoints are accessible from the payment gateways:

- **Paystack Webhook**: `POST /api/payment/webhook`
- **Payment Verification**: `GET /api/payment/verify?reference=xxx`

## How Payment Flow Works

### 1. User Selects Plan
- User goes to `/pricing`
- Chooses between Free, Starter, or Pro
- Toggles between Monthly/Annual billing
- Clicks "Choose Payment Method"

### 2. Payment Initialization
- User selects Paystack (recommended) or Flutterwave
- System creates payment with:
  - User email
  - Amount (in kobo for Paystack, naira for Flutterwave)
  - Reference (unique transaction ID)
  - Metadata (user ID, tier, billing period)

### 3. Payment Gateway
- User redirects to payment page
- Enters card details
- Completes payment

### 4. Payment Callback
- Gateway redirects back to `/payment/callback`
- System verifies payment with gateway API
- Creates/updates subscription in database
- Records payment history

### 5. Webhook (Background)
- Payment gateway sends webhook notification
- System verifies webhook signature
- Updates subscription status
- Records payment

## Testing Payment Flow

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Free Tier
1. Go to `http://localhost:3000/pricing`
2. Click "Get Started" on Free tier
3. Should redirect to signup

### 3. Test Paid Tier (Paystack)
1. Sign in to your account
2. Go to `/pricing`
3. Select Starter or Pro
4. Click "Choose Payment Method" → Paystack
5. Use test card: 4084 0840 8408 4081
6. Complete payment
7. Verify redirect to `/payment/callback`
8. Check subscription in `/profile`

### 4. Test Paid Tier (Flutterwave)
1. Follow same steps but select Flutterwave
2. Use test card: 5531 8866 5214 2950

## Webhook Testing (Local Development)

Since webhooks require a public URL, use a tool like **ngrok**:

### 1. Install ngrok
```bash
npm install -g ngrok
```

### 2. Start ngrok tunnel
```bash
ngrok http 3000
```

### 3. Update Webhook URLs
- Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
- Add webhook in Paystack/Flutterwave:
  - Paystack: `https://abc123.ngrok.io/api/payment/webhook`
  - Flutterwave: Configure in dashboard

### 4. Test Payment
- Make a test payment
- Watch ngrok terminal for webhook requests
- Verify webhook in Paystack/Flutterwave dashboard

## Production Checklist

Before going live:

- [ ] Switch to live API keys (both Paystack and Flutterwave)
- [ ] Update webhook URLs to production domain
- [ ] Test payment flow with real (small amount) transactions
- [ ] Enable webhook event logging
- [ ] Set up payment failure notifications
- [ ] Configure subscription renewal reminders
- [ ] Test subscription expiration flow
- [ ] Implement payment retry logic
- [ ] Add invoice generation
- [ ] Set up payment analytics

## Security Best Practices

1. **Never expose secret keys** in client-side code
2. **Always verify webhook signatures** before processing
3. **Verify payment status** with gateway API, don't trust client
4. **Use HTTPS** in production
5. **Store payment references** for support/refund requests
6. **Log all payment events** for audit trail
7. **Implement rate limiting** on payment endpoints
8. **Handle payment failures** gracefully

## Troubleshooting

### Payment Initialization Fails
- Check API keys are correct
- Verify keys match environment (test/live)
- Check internet connection
- Review API key permissions

### Webhook Not Received
- Verify webhook URL is publicly accessible
- Check webhook signature verification
- Review payment gateway logs
- Test with ngrok for local development

### Payment Verified but Subscription Not Created
- Check database connection
- Review webhook handler logs
- Verify payment metadata
- Check subscription creation logic

### User Shows Wrong Subscription Tier
- Check payment status in gateway dashboard
- Verify webhook was processed
- Review subscription query logic
- Check for multiple active subscriptions

## Support

- **Paystack**: [https://paystack.com/support](https://paystack.com/support)
- **Flutterwave**: [https://flutterwave.com/support](https://flutterwave.com/support)
- **AcademIQ**: Create an issue on GitHub

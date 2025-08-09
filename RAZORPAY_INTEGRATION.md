# Razorpay Payment Integration - Complete Implementation Guide

## ✅ Completed Backend Implementation

### 1. **Razorpay Utilities** (`server/utils/razorpay.js`)
- ✅ `createOrder()` - Create Razorpay orders
- ✅ `verifyPaymentSignature()` - Verify payment signatures
- ✅ `verifyWebhookSignature()` - Verify webhook signatures
- ✅ `fetchPaymentDetails()` - Fetch payment info from Razorpay
- ✅ `fetchOrderDetails()` - Fetch order info from Razorpay
- ✅ `refundPayment()` - Process refunds
- ✅ `calculateCommission()` - Calculate platform commission

### 2. **Razorpay Payment Controller** (`server/controllers/razorpayPaymentController.js`)

#### Rent Payments:
- ✅ `initiateRentPayment()` - POST /api/razorpay/initiate-rent-payment
  - Creates Razorpay order for rent payment
  - Calculates commission from settings
  - Returns orderId and Razorpay key for frontend
  
- ✅ `verifyRentPayment()` - POST /api/razorpay/verify-rent-payment
  - Verifies payment signature
  - Marks payment as Paid
  - Sends notifications to owner and tenant

#### Worker Payments:
- ✅ `initiateWorkerPayment()` - POST /api/razorpay/initiate-worker-payment
  - Creates Razorpay order for worker payment
  - Calculates commission based on working days
  - Verifies tenant-worker relationship
  
- ✅ `verifyWorkerPayment()` - POST /api/razorpay/verify-worker-payment
  - Verifies payment signature
  - Marks worker payment as Paid
  - Sends notifications to worker and tenant

#### Payment History & Tracking:
- ✅ `getTenantPaymentHistory()` - GET /api/razorpay/tenant-payment-history
- ✅ `getTenantWorkerPaymentHistory()` - GET /api/razorpay/tenant-worker-payment-history
- ✅ `getOwnerPaymentHistory()` - GET /api/razorpay/owner-payment-history
- ✅ `getWorkerEarningsHistory()` - GET /api/razorpay/worker-earnings-history
- ✅ `getAllPayments()` - GET /api/razorpay/all-payments (Admin/SuperAdmin)
  - Returns all payments with commission summary
  - Supports filtering by status and type

### 3. **Razorpay Webhook Controller** (`server/controllers/razorpayWebhookController.js`)
- ✅ `handleWebhook()` - POST /api/razorpay/webhook
- ✅ Webhook event handlers:
  - `payment.authorized` - Mark payment as authorized
  - `payment.captured` - Mark payment as captured (success)
  - `payment.failed` - Handle failed payments
  - `refund.created` - Track refunds
  - `refund.processed` - Update refund status
- ✅ Sends notifications to all parties involved

### 4. **Routes** (`server/routes/razorpay.js`)
- ✅ All Razorpay endpoints registered with proper documentation
- ✅ Swagger/OpenAPI documentation included
- ✅ Auth middleware applied where needed
- ✅ Webhook route accepts unauthenticated POST requests

### 5. **App Configuration** (`server/app.js`)
- ✅ Razorpay routes registered: `app.use("/api/razorpay", razorpayRoutes)`

### 6. **Database Models Already Support:**
- ✅ `Payment.js` - Has Razorpay fields (orderId, razorpayPaymentId, razorpaySignature, commission fields)
- ✅ `WorkerPayment.js` - Has Razorpay fields and working days tracking
- ✅ Both models track commission percentage at time of payment

## 🔧 Configuration Required

### Environment Variables (.env)
```
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

### Razorpay Dashboard Setup
1. Go to https://razorpay.com/
2. Get your API keys from Settings > API Keys
3. Create a webhook for:
   - Endpoint: `https://your-domain.com/api/razorpay/webhook`
   - Events: payment.authorized, payment.captured, payment.failed, refund.created, refund.processed

## 📱 Frontend Integration Guide

### For Tenant Rent Payment:

1. **Initiate Payment:**
```javascript
const response = await fetch('/api/razorpay/initiate-rent-payment', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    propertyId: propertyId,
    amount: amount,          // in rupees
    dueDate: dueDate        // optional
  })
});
const data = await response.json();
const { orderId, razorpayKeyId } = data.payment;
```

2. **Show Razorpay Payment Form:**
```javascript
const options = {
  key: razorpayKeyId,
  amount: amount * 100,      // convert to paise
  currency: 'INR',
  order_id: orderId,
  handler: async (response) => {
    // Call verify endpoint
    const verifyResponse = await fetch('/api/razorpay/verify-rent-payment', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentId: response.razorpay_payment_id,
        orderId: response.razorpay_order_id,
        signature: response.razorpay_signature
      })
    });
    // Handle success/failure
  }
};
const rzp = new Razorpay(options);
rzp.open();
```

### For Tenant Worker Payment:

1. **Initiate Payment:**
```javascript
const response = await fetch('/api/razorpay/initiate-worker-payment', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workerId: workerId,
    amount: amount,           // total amount for all days
    workingDays: workingDays, // number of days worked
    dailyRate: dailyRate      // rate per day
  })
});
```

2. **Show Razorpay Payment Form (similar to rent payment)**

### Include Razorpay Script in HTML:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

## 💳 Payment Flow Summary

### Rent Payment Flow:
```
Tenant Initiates → Razorpay Order Created → Payment Form Shown → 
Payment Successful → Signature Verified → Payment Marked as Paid → 
Owner & Tenant Notified → Admin Sees Payment with Commission
```

### Worker Payment Flow:
```
Tenant Initiates → Verify Work History → Razorpay Order Created → 
Payment Form Shown → Payment Successful → Signature Verified → 
Payment Marked as Paid → Worker & Tenant Notified → 
Admin Sees Payment with Commission
```

## 💰 Commission Handling

- **Commission Source:** Super Admin Settings (`Setting.commission`)
- **Default:** 20%
- **Stores in each payment:** 
  - `commission` - Amount of commission
  - `commissionPercent` - Percentage at time of payment
- **Admin View:** `/api/razorpay/all-payments` shows total commission collected

### Commission Calculation Example:
```
Rent Payment: ₹10,000 with 20% commission
- Owner receives: ₹8,000 to their account
- Platform gets: ₹2,000 as commission
- Both amounts tracked in Payment record
```

## 📊 Admin Payment Tracking

### All Payments Endpoint:
- **Route:** `GET /api/razorpay/all-payments`
- **Filter by:** status (Pending/Paid/Failed/Refunded), type (rent/worker)
- **Returns:**
  - All rent and worker payments
  - Revenue summary (by source)
  - Commission summary
  - Total collected

### Sample Response:
```json
{
  "success": true,
  "payments": [...],
  "summary": {
    "rentRevenue": 500000,
    "rentCommission": 100000,
    "workerRevenue": 200000,
    "workerCommission": 40000,
    "totalRevenue": 700000,
    "totalCommission": 140000
  }
}
```

## 🔒 Security Measures

1. **Signature Verification:** All payment signatures verified using Razorpay key
2. **Webhook Verification:** Webhook signatures verified to ensure authentic Razorpay events
3. **User Authorization:** All payment endpoints require authentication
4. **Amount Validation:** All amounts validated and sanitized
5. **Admin Only Views:** Payment summary endpoints require Admin/SuperAdmin role

## ✨ Features Implemented

✅ Rent payment from tenant to owner  
✅ Worker payment based on working days  
✅ Automatic commission calculation from settings  
✅ Payment signature verification  
✅ Webhook event handling  
✅ Notification system integration  
✅ Payment history for all parties  
✅ Admin payment tracking with commission summary  
✅ Refund support  
✅ Payment status tracking (Pending/Paid/Failed/Refunded)  
✅ Error handling and logging  

## 🚀 Testing Endpoints

Use Razorpay Test Mode with:
- **Test Card:** 4111111111111111
- **Expiry:** 12/25 (any future date)
- **CVV:** 123 (any 3 digits)

## 📝 Next Steps

1. Update frontend to use `/api/razorpay/initiate-*-payment` endpoints
2. Integrate Razorpay checkout form in payment components
3. Update payment history views to show Razorpay transaction details
4. Set up Razorpay webhook in dashboard configuration
5. Test with Razorpay test credentials
6. Update admin dashboard to display commission summary
7. Configure email notifications for payment events

## 🔗 API References

- All endpoints: `/api/razorpay/*`
- Swagger docs: Available at `/api-docs` (if swagger enabled)
- Method: REST with JSON payloads
- Auth: Bearer token in Authorization header

---

**Status:** ✅ Backend fully implemented and ready for frontend integration

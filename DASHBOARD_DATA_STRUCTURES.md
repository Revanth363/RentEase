# Dashboard Data Structures Analysis

## Overview
This document maps the data structures expected by each dashboard component from their respective backend endpoints.

---

## 1. OwnerDashboard.jsx

**Endpoint:** `GET /owner/dashboard`  
**Service Call:** `ownerService.getOwnerDashboard()`  
**Location:** [client/src/pages/OwnerDashboard.jsx](client/src/pages/OwnerDashboard.jsx)

### Expected Data Structure from Backend

```javascript
{
  success: boolean,
  meta: {
    optimized: boolean,
    queryTime: string,
    queriesReduced: string
  },
  user: {
    _id: ObjectId,
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    location: string,
    accountNo: string,
    upiid: string,
    numProperties: number,
    notifications: {
      email: boolean,
      sms: boolean,
      payment: boolean,
      complaint: boolean,
      maintenance: boolean
    }
  },
  properties: Array<{
    _id: ObjectId,
    name: string,
    address: string,
    isRented: boolean,
    tenantId: ObjectId,
    price: number,
    rentalStartDate: Date,
    images: Array<string>,
    // ... other property fields
  }>,
  tenants: Array<{
    _id: ObjectId,
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    occupation: string,
    leaseDuration: string,
    property: string,
    propid: ObjectId,
    rentalStartDate: Date
  }>,
  payments: Array<{
    _id: ObjectId,
    tenantId: ObjectId,
    propertyId: ObjectId,
    amount: number,
    status: string,
    paymentDate: Date,
    userName: string,
    property: string
  }>,
  paymentSummary: {
    monthlyRevenue: number,
    upcomingPayments: number,
    totalRevenue: number,
    commission: number,
    netIncome: number
  },
  maintenanceRequests: Array<{
    _id: ObjectId,
    tenantId: ObjectId,
    propertyId: ObjectId,
    status: string,
    dateReported: Date,
    tenantName: string,
    propertyName: string
  }>,
  complaints: Array<{
    _id: ObjectId,
    property: string,
    subject: string,
    reportedBy: string,
    dateSubmitted: Date,
    status: string,
    phone: string
  }>,
  reports: {
    monthlyRevenue: number,
    occupancyRate: number,
    maintenanceCosts: number,
    revenueTrend: { class: string, text: string },
    occupancyTrend: { class: string, text: string },
    maintenanceTrend: { class: string, text: string },
    revenueChart: Array<{ height: number, value: number, month: string }>
  },
  agreements: Array<any>,
  notifications: Array<{
    _id: ObjectId,
    type: string,
    message: string,
    status: string,
    createdDate: Date,
    isNew: boolean,
    // ... other notification fields
  }>
}
```

### How Data is Accessed in Frontend
- `dashboard.user._id` - for verification status fetch
- `dashboard.notifications.filter(n => n.isNew === true)` - for marking notifications as read
- `dashboard.properties` - displayed in properties section
- `dashboard.tenants` - displayed in tenants section
- `dashboard.payments` - displayed in payments section
- `dashboard.maintenanceRequests` - displayed in maintenance section
- `dashboard.complaints` - displayed with status and contact info
- `dashboard.notifications` - for rent/unrent requests
- `dashboard.reports` - for reports & analytics display
- `dashboard.user` - for settings form prefill

### Backend Controller
**File:** [server/controllers/ownerController.js](server/controllers/ownerController.js) (Line 23)  
**Function:** `exports.getOwnerDashboard`

---

## 2. TenantDashboard.jsx

**Endpoint:** `GET /tenant/dashboard-data`  
**Service Call:** `tenantService.getDashboard()`  
**Location:** [client/src/pages/TenantDashboard.jsx](client/src/pages/TenantDashboard.jsx)

### Expected Data Structure from Backend

```javascript
{
  success: boolean,
  user: {
    _id: ObjectId,
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    location: string
  },
  currentProperty: {
    _id: ObjectId,
    name: string,
    address: string,
    location: string,
    price: number,
    images: Array<string>,
    ownerId: ObjectId,
    // ... other property fields
  } | null,
  propertyOwner: {
    _id: ObjectId,
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    // ... other owner fields
  } | null,
  payments: Array<{
    _id: ObjectId,
    amount: number,
    status: string,
    paymentDate: Date,
    paymentMethod: string,
    // ... other payment fields
  }>,
  nextPayment: {
    _id: ObjectId | null,
    amount: number,
    dueDate: Date,
    status: string
  } | null,
  activeMaintenanceRequests: Array<{
    _id: ObjectId,
    status: string,
    dateReported: Date,
    issueType: string,
    description: string,
    location: string,
    // ... other fields
  }>,
  completedMaintenanceRequests: Array<{
    _id: ObjectId,
    status: string,
    dateReported: Date,
    issueType: string,
    // ... other fields
  }>,
  complaints: Array<{
    _id: ObjectId,
    category: string,
    subject: string,
    description: string,
    status: string,
    dateSubmitted: Date
  }>,
  workers: Array<{
    _id: ObjectId,
    firstName: string,
    lastName: string,
    serviceType: string,
    price: number,
    rateUnit: string,
    phone: string,
    // ... other worker fields
  }>,
  rentalHistory: Array<{
    propertyName: string,
    propertyImages: Array<string>,
    rating: number | null,
    review: string | null,
    // ... other history fields
  }>,
  ratings: Array<{
    _id: ObjectId,
    rating: number,
    review: string,
    propertyId: ObjectId,
    // ... other rating fields
  }>,
  notifications: Array<{
    _id: ObjectId,
    type: string,
    message: string,
    workerName: string | null,
    propertyName: string | null,
    createdDate: Date,
    status: string,
    read: boolean
  }>,
  workerPayments: Array<{
    _id: ObjectId,
    paymentDate: Date,
    workerName: string,
    serviceType: string,
    amount: number,
    paymentMethod: string,
    status: string,
    receiptUrl: string,
    transactionId: string
  }>,
  meta: {
    optimized: boolean,
    caching: string,
    source: string,
    responseTime: string,
    cacheKey: string,
    ttl: number,
    queriesReduced: string,
    cacheStats: object
  }
}
```

### How Data is Accessed in Frontend
- `dashboard.success` - checked before rendering
- `dashboard.user._id` - for verification status fetch
- `dashboard.currentProperty` - displayed in current property section
- `dashboard.propertyOwner` - owner contact info
- `dashboard.activeMaintenanceRequests` - maintenance list
- `dashboard.completedMaintenanceRequests` - completed maintenance
- `dashboard.workers` - domestic workers list
- `dashboard.notifications.filter(...)` - filtered for reading
- `dashboard.rentalHistory` - rental history display
- `dashboard.payments` - payment history
- `dashboard.nextPayment` - next payment display
- `dashboard.complaints` - complaints list
- `dashboard.ratings` - ratings display
- `dashboard.workerPayments` - worker payment history

### Backend Controller
**File:** [server/controllers/tenantController.js](server/controllers/tenantController.js) (Line 227)  
**Function:** `exports.getDashboardData`

---

## 3. WorkerDashboard.jsx

**Endpoint:** `GET /workers/dashboard`  
**Service Call:** `workerService.getDashboardData()`  
**Location:** [client/src/pages/WorkerDashboard.jsx](client/src/pages/WorkerDashboard.jsx)

### Expected Data Structure from Backend

```javascript
{
  success: boolean,
  user: {
    _id: ObjectId,
    firstName: string,
    lastName: string,
    serviceType: string,
    price: number,
    rateUnit: string,
    experience: number,
    serviceStatus: string,
    image: string,
    description: string,
    ratingId: ObjectId | null,
    email: string,
    phone: string,
    location: string
  },
  services: Array<{
    _id: ObjectId,
    name: string,
    price: number,
    rateUnit: string,
    experience: number,
    serviceStatus: string,
    image: string,
    description: string
  }>,
  bookings: Array<{
    _id: ObjectId,
    serviceName: string,
    tenantId: {
      firstName: string,
      lastName: string,
      phone: string
    },
    propertyId: {
      address: string
    },
    date: string,
    time: string,
    status: string
  }>,
  clients: Array<{
    _id: ObjectId,
    firstName: string,
    lastName: string,
    phone: string,
    email: string,
    services: Array<string>,
    bookingDate: string,
    address: string,
    location: string
  }>,
  earnings: {
    monthly: number,
    pending: number
  },
  transactions: Array<{
    _id: ObjectId,
    title: string,
    serviceName: string,
    clientName: string,
    date: string,
    amount: number,
    status: string
  }>,
  reviews: {
    averageRating: number,
    count: number,
    items: Array<{
      _id: ObjectId,
      user: string,
      rating: number,
      date: string,
      comment: string,
      serviceName: string
    }>
  },
  notifications: Array<{
    _id: ObjectId,
    type: string,
    message: string,
    tenantName: string | null,
    createdDate: Date,
    read: boolean
  }>,
  meta: {
    optimized: boolean,
    caching: string,
    source: string,
    responseTime: string,
    cacheKey: string,
    ttl: number,
    queriesReduced: string,
    cacheStats: object
  }
}
```

### How Data is Accessed in Frontend
```javascript
// From loadDashboard function (lines 65-88):
setUser(data.user || {});
setServices(data.services || []);
setBookings(data.bookings || []);
setClients(data.clients || []);
setEarnings(data.earnings || { monthly: 0, pending: 0 });
setTransactions(data.transactions || []);
setReviews(data.reviews || { averageRating: 0, count: 0, items: [] });
setNotifications(data.notifications || []);
```

- `data.user._id` - for verification status fetch
- `data.user.firstName`, `data.user.lastName`, etc. - profile display and form prefill
- `data.services` - services display
- `data.bookings` - bookings list
- `data.clients` - clients list
- `data.earnings` - earnings display
- `data.transactions` - transaction history
- `data.reviews.averageRating`, `data.reviews.count`, `data.reviews.items` - reviews display
- `data.notifications` - notifications list

### Backend Controller
**File:** [server/controllers/workerController.js](server/controllers/workerController.js) (Line 1432)  
**Function:** `exports.getDashboardDataAPI`

---

## Summary of Key Differences

| Aspect | Owner | Tenant | Worker |
|--------|-------|--------|--------|
| **Endpoint** | `/owner/dashboard` | `/tenant/dashboard-data` | `/workers/dashboard` |
| **Main Focus** | Properties, Tenants, Revenue | Current Property, Rent, Maintenance | Services, Bookings, Earnings |
| **Key Collections** | properties, tenants, payments, complaints | currentProperty, workers, maintenance, rentalHistory | services, bookings, clients, transactions |
| **Caching** | No (Phase 2 optimized) | Yes (Phase 3 with 5min TTL) | Yes (Phase 3 with 5min TTL) |
| **Optimization** | 1 aggregation pipeline | 1-2 aggregations + cache | 1 aggregation + 3 parallel + cache |

---

## Backend Routes

```javascript
// Router setup
GET /owner/dashboard → ownerController.getOwnerDashboard
GET /tenant/dashboard-data → tenantController.getDashboardData
GET /workers/dashboard → workerController.getDashboardDataAPI
```

# RentEase 🏠

> **Enterprise-grade, multi-role property rental management & verified domestic workforce marketplace built with the MERN stack.**

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%20|%20v20-339933?logo=node.js)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Express Version](https://img.shields.io/badge/Express-5.x-000000?logo=express)](https://expressjs.com/)
[![JWT](https://img.shields.io/badge/JWT-Stateless%20Auth-black?logo=jsonwebtokens)](https://jwt.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-Cache%20&%20RateLimit-DC382D?logo=redis)](https://redis.io/)
[![Apache Solr](https://img.shields.io/badge/Apache%20Solr-Search%20Engine-F35C00?logo=apache)](https://solr.apache.org/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment%20Gateway-02042B?logo=razorpay)](https://razorpay.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)
[![Swagger](https://img.shields.io/badge/API%20Docs-Swagger%20OAS3-85EA2D?logo=swagger)](http://localhost:5000/api-docs)

---

## 📌 Architectural Overview

RentEase is a full-stack, distributed web application engineered to solve rental transparency, lease lifecycle management, digital rent collection, and domestic workforce dispatching in urban environments. It implements a **3-sided marketplace** connecting **Tenants**, **Property Owners**, and **Domestic Service Workers**, supervised by **Admin** and **SuperAdmin** oversight tiers.

### System Architecture
```
                         +-----------------------+
                         |     Frontend Client   |
                         |  React 19 + Vite 7    |
                         |  React Context + CSS  |
                         +-----------+-----------+
                                     |
                                     |  REST API / HTTPS / JWT (HttpOnly)
                                     v
                         +-----------------------+
                         |   API Gateway Layer   |
                         |    Express 5 Server   |
                         |  Security & Middleware|
                         +---+-------+-------+---+
                             |       |       |
         +-------------------+       |       +-------------------+
         |                           |                           |
         v                           v                           v
+-----------------+         +-----------------+         +-----------------+
|   Persistence   |         | In-Memory Cache |         | Search & External|
|   MongoDB Atlas |         |    Redis 7.x    |         | Apache Solr 8983|
| Mongoose Models |         | (Local/Upstash) |         | Razorpay Gateway|
| Compound Index  |         | Query Cache &   |         | Cloudinary Media|
| Multi-Role DB   |         | Rate Limit Store|         | Google OAuth 2.0|
+-----------------+         +-----------------+         +-----------------+
```

---

## 🚀 Key Engineering & Backend Implementations

* **Dual-Engine Search Infrastructure**:
  * **Apache Solr (`solr-client`)**: Distributed full-text search indexing on core `rentease` for properties, worker services, and locations.
  * **Resilient Fallback**: Graceful degradation to MongoDB regex and compound index scans if Solr is offline.
* **Hybrid Multi-Tier Caching (`utils/cacheWrapper.js`)**:
  * **Redis 7 / Upstash REST Client**: Intelligent caching for homepage sliders, location filters, and property types with dynamic TTLs (1800s to 3600s).
  * Auto-disables and falls back to live database queries when Redis is unavailable without throwing runtime errors.
* **Stateless JWT Authentication & Session Architecture (`utils/jwt.js`, `middleware/auth.js`)**:
  * **Session-Free Authorization**: Completely replaced server-side `express-session` memory overhead with cryptographically signed JSON Web Tokens (`jsonwebtoken`).
  * **Multi-Channel Delivery & Fallback**: Dual-extraction mechanism supporting secure `httpOnly` cookie delivery (`accessToken`) with automatic fallback to `Authorization: Bearer <token>` headers for cross-origin and mobile scenarios.
  * **Role-Segregated Token Claims**: Embedded payload `{ id, userType, email }` enabling zero-database-lookup role authorization across `protect`, `adminProtect`, and `superadminProtect` guards.
  * **Safe Cookie Policy**: Strict mitigation against XSS/CSRF using `httpOnly: true`, `sameSite: "lax"`, and production conditional `secure: true`.
* **Granular Role-Based Access Control (RBAC)**:
  * Strict separation across 5 operational roles: `superadmin`, `admin`, `owner`, `tenant`, and `worker`.
  * Google OAuth 2.0 integration via Passport.js with auto-provisioning and immediate JWT cookie issuance.
* **Fintech & Payment State Machine**:
  * **Razorpay Gateway Integration**: End-to-end rent payments, advance booking deposits, and daily-rate domestic worker wage payouts.
  * Webhook validation & HMAC-SHA256 digital signature verification (`crypto`).
  * Automated background job cleaning up pending/cancelled payment orders every 24 hours.
* **Full-Lifecycle Domestic Work Tracking**:
  * Secure daily work verification via time-bound 6-digit OTPs (`WorkTracking` model).
  * Automated wage and platform commission calculations based on verified work days.
* **Document Verification & eKYC System**:
  * Cloudinary-backed document pipeline accepting government IDs (Aadhaar, PAN, Driving License), property deeds, and skill certificates.
  * Admin review queue with status management (`pending`, `approved`, `rejected`) and rejection reason feedback.
* **Security Audit Trail & Documentation**:
  * Automated structured event logging across 32 system actions (`AuditLog` schema).
  * Interactive OpenAPI 3.0 documentation generated dynamically via **Swagger UI** on `/api-docs`.

---

## 🛠 Tech Stack

### **Frontend**
* **Framework:** React 19, Vite 7
* **State Management:** React Context API & Custom Hooks
* **Routing:** React Router DOM v7
* **Mapping & GIS:** Leaflet, React-Leaflet, `@vis.gl/react-google-maps`
* **Data Visualization:** Chart.js, Recharts
* **Icons & Notifications:** Lucide React, FontAwesome, SweetAlert2

### **Backend**
* **Runtime:** Node.js (v18 / v20 LTS)
* **Framework:** Express.js 5.x
* **Database & ODM:** MongoDB Atlas, Mongoose 8.x
* **In-Memory Cache:** Redis 7.x (ioredis / redis client + Upstash fallback)
* **Search Engine:** Apache Solr (Port 8983)
* **Payments:** Razorpay Node SDK
* **Media Storage:** Cloudinary (`multer-storage-cloudinary`)
* **Security & Auth:** Passport.js, JWT (`jsonwebtoken`), Helmet, Cookie-Parser, Express-Rate-Limit
* **Testing:** Jest, Supertest

---

## 📂 Repository Topology

```text
ffsd_repo_react/
├── client/                               # Frontend SPA (React 19 + Vite)
│   ├── src/
│   │   ├── assets/                       # Custom CSS design systems & stylesheets
│   │   ├── components/                   # Reusable UI modules (Modals, Nav, Cards)
│   │   ├── context/                      # React Context state providers (Auth, Loading)
│   │   ├── pages/                        # Domain-specific route views
│   │   │   ├── admin/                    # Admin management dashboards
│   │   │   ├── owner/                    # Property listings & tenant management
│   │   │   ├── tenant/                   # Discovery, payments, worker bookings
│   │   │   └── worker/                   # Service requests, work logs, earnings
│   │   └── services/                     # Axios instance & HTTP client configuration
│   └── vite.config.js                    # Vite dev server & proxy settings
│
├── server/                               # Backend REST API (Express 5 + Mongoose 8)
│   ├── config/                           # Database, Redis, Cloudinary & Solr configs
│   │   ├── cloudinary.js                 # Cloudinary SDK credentials
│   │   ├── indexes.js                    # Compound DB index configurations
│   │   ├── redis.js                      # Dual local/Upstash Redis client manager
│   │   └── solr.js                       # Apache Solr client & pool manager
│   ├── controllers/                      # Domain logic & controller handlers
│   │   ├── admin*.js                     # Admin module controllers
│   │   ├── ownerController.js            # Property & tenant lease actions
│   │   ├── propertyController.js         # Public & verified property feeds
│   │   ├── razorpayPaymentController.js  # Order generation & signature verifications
│   │   ├── razorpayWebhookController.js  # Razorpay webhook listener
│   │   ├── superadmin*.js                # System settings & financial auditing
│   │   ├── tenantController.js           # Tenant agreements, rent pay, complaints
│   │   ├── verificationController.js     # eKYC upload & review handlers
│   │   └── workerController.js           # Worker dispatch & daily OTP verification
│   ├── middleware/                       # Request pipeline interceptors
│   │   ├── auditLogger.js                # Auto-audit trail logging
│   │   ├── auth.js                       # JWT & RBAC guards (protect, adminProtect)
│   │   ├── errorLogger.js                # Error serialization
│   │   ├── logger.js                     # Request logging
│   │   └── uploadCloudinary.js           # Cloudinary file upload parser
│   ├── models/                           # 24 Mongoose schemas with compound indexes
│   ├── routes/                           # Dedicated REST route routers
│   ├── utils/                            # Cryptography, JWT, cacheWrapper, solrSearch
│   ├── __tests__/                        # Automated Jest & Supertest test suites
│   ├── app.js                            # Express bootstrap & middleware pipeline
│   ├── passport.js                       # Google OAuth 2.0 strategy configuration
│   └── swagger.js                        # OpenAPI 3.0 specification definition
│
├── docker-compose.yml                    # Multi-container production deployment
├── docker-compose.dev.yml                # Multi-container dev stack (Mongo + Redis + API)
├── Dockerfile.backend                    # Multi-stage production container for API
└── Dockerfile.frontend                   # Multi-stage production container for Client
```

---

## 🗄 Database Models & Compound Indexing Strategy

The persistence layer defines 24 granular Mongoose models equipped with compound indexes (`config/indexes.js`):

| Model | Primary Purpose | Indexed Fields |
| :--- | :--- | :--- |
| **`Property`** | Rental listings, dimensions, amenities, proof | `{ ownerId: 1, status: 1 }`, `{ isRented: 1 }`, `{ location: 1 }` |
| **`Tenant`** | Tenant profile, active lease links, notification settings | `{ email: 1 }`, `{ status: 1 }`, `{ location: 1 }` |
| **`Owner`** | Landlord profile, bank account/UPI info, properties | `{ email: 1 }`, `{ status: 1 }` |
| **`Worker`** | Domestic worker skills, daily rates, availability | `{ email: 1 }`, `{ location: 1, serviceType: 1 }`, `{ status: 1 }` |
| **`Booking`** | Property rental applications and approved tenancies | `{ tenantId: 1, status: 1 }`, `{ propertyId: 1 }`, `{ ownerId: 1 }` |
| **`WorkerBooking`** | Scheduled domestic help bookings | `{ workerId: 1, status: 1 }`, `{ tenantId: 1 }` |
| **`Payment`** | Monthly rent payments & Razorpay transaction records | `{ tenantId: 1, status: 1 }`, `{ propertyId: 1 }`, `{ ownerId: 1 }` |
| **`WorkerPayment`** | Domestic worker salary disbursements & commissions | `{ workerId: 1 }`, `{ tenantId: 1 }`, `{ orderId: 1 }` |
| **`WorkTracking`** | Daily OTP-based worker attendance and wage tracking | `{ workerId: 1, tenantId: 1, workDate: 1 }` |
| **`Verification`** | eKYC verification submissions and reviewer feedback | `{ user: 1, status: 1 }`, `{ userModel: 1 }` |
| **`MaintenanceRequest`** | Tenant repair tickets, worker dispatch, resolution | `{ propertyId: 1, tenantId: 1 }`, `{ assignedWorker: 1 }` |
| **`Rating`** | 1–5 star reviews for properties, workers, and owners | `{ workerId: 1 }`, `{ propertyId: 1 }`, `{ ownerId: 1 }` |
| **`Complaint`** | Tenant dispute filing & status tracking | `{ tenantId: 1 }`, `{ propertyId: 1 }`, `{ status: 1 }` |
| **`AuditLog`** | Security audit history across 32 system actions | `{ action: 1 }`, `{ 'performedBy.userId': 1 }`, `{ createdAt: -1 }` |

---

## 🔌 API Endpoints Reference

All routes are documented interactively via OpenAPI 3.0 at **`/api-docs`**.

### 1. Authentication & Session
* `POST /login` - Authenticate Tenant, Owner, Worker, Admin, or SuperAdmin (sets HTTP-only JWT cookie)
* `POST /register` - Register new Tenant, Owner, or Worker
* `GET /api/me` - Retrieve current session user payload
* `GET /api/logout` - Clear session JWT cookie
* `GET /auth/google` - Trigger Google OAuth 2.0 flow
* `GET /auth/google/callback` - Google OAuth callback handler
* `POST /api/forgot-password` - Generate password reset OTP
* `POST /api/reset-password` - Verify OTP and update password

### 2. Properties (`/api/property`)
* `GET /api/properties` - Retrieve verified, featured properties
* `GET /api/slider-properties` - Cached feed for homepage carousel (30-min TTL)
* `GET /api/locations` - Cached unique verified location tags (60-min TTL)
* `GET /api/property-types` - Cached unique property configuration types (60-min TTL)
* `GET /api/property?id=:id` - Fetch comprehensive property details

### 3. Payments & Fintech (`/api/razorpay`)
* `POST /api/razorpay/initiate-rent-payment` - Generate Razorpay Order for monthly rent
* `POST /api/razorpay/verify-payment` - Cryptographic signature check & mark payment as `Paid`
* `POST /api/razorpay/initiate-worker-payment` - Generate Razorpay Order for domestic worker wage
* `POST /api/razorpay/verify-worker-payment` - Verify and credit worker compensation
* `POST /api/razorpay/webhook` - Asynchronous Razorpay webhook processing

### 4. Domestic Workers (`/api/workers`)
* `GET /api/workers` - Browse available verified helpers by location and skill
* `POST /api/workers/book` - Request domestic helper schedule
* `POST /api/workers/generate-otp` - Issue daily attendance OTP to tenant
* `POST /api/workers/verify-otp` - Worker submits OTP to record completed work day

### 5. Verification & eKYC (`/api/verification`)
* `GET /api/verification/status` - Check personal submission state
* `POST /api/verification/upload` - Stream identity & property documents to Cloudinary

### 6. Administration & Governance
* `GET /api/admin/*` - Protected admin endpoints for user moderation, property validation, ticket escalation
* `GET /api/superadmin/*` - Protected platform owner routes: financial ledger, commission controls, system maintenance switch

---

## ⚡ Quickstart & Local Setup

### Prerequisites
* **Node.js**: `v18.x` or `v20.x`
* **MongoDB**: Atlas cluster connection string or local instance
* **Redis**: Redis 7+ instance or Upstash account *(optional, falls back gracefully)*

---

### Option 1: Docker Compose

```bash
git clone https://github.com/Dheeraj-shahul/ffsd_repo_react.git
cd ffsd_repo_react

# Configure Docker environment
cp .env.docker.example .env.docker

# Launch MongoDB, Redis, API backend, and React client
docker compose up --build
```
* **Client App:** `http://localhost:5173` (or `http://localhost:3000`)
* **Backend API:** `http://localhost:5000`
* **Swagger OpenAPI Docs:** `http://localhost:5000/api-docs`

---

### Option 2: Native Local Setup

#### 1. Backend Setup
Create `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/rentease
JWT_SECRET=your_super_secret_jwt_key
SESSION_SECRET=your_session_secret_key

# Redis (Optional - falls back to live DB if absent)
REDIS_URL=redis://localhost:6379

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_secret_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

CLIENT_URL=http://localhost:5173
```

Install dependencies and start the backend:
```bash
cd server
npm install
npm run dev
```

#### 2. Frontend Setup
Create `client/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

Install dependencies and start Vite:
```bash
cd ../client
npm install
npm run dev
```

---

## 🧪 Testing

The backend includes a **Jest** + **Supertest** test harness covering controllers, validation pipelines, and security tokens:

```bash
cd server

# Run complete test suite
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage analysis
npm run test:report

# CI automated execution
npm run test:ci
```

---

## 🔒 Security Specifications

* **Helmet Security Suite**: Strict Content Security Policy (CSP), frameguard (clickjacking denial), XSS protection filters, and MIME-sniffing prevention.
* **Stateless JWT Authorization with Defensive Cookie Strategy**:
  * Authenticated state is governed by HMAC-SHA256 signed JSON Web Tokens (`utils/jwt.js`).
  * Tokens are transmitted in `accessToken` HTTP-only cookies (`httpOnly: true`, `sameSite: "lax"`, and production `secure: true`), eliminating vulnerabilities to client-side script token theft (XSS).
  * Dual-mode authentication middleware (`middleware/auth.js`) transparently handles both browser cookie sessions and API `Authorization: Bearer <token>` requests.
* **Zero-Trust Input Validation**: Payloads bound to strict 15MB limits with deep Mongoose schema validation.
* **OTP Anti-Brute-Force**: IP and route rate-limiting via `express-rate-limit` allowing a maximum of 5 OTP attempts per 15-minute window.
* **Payment Tamper Resistance**: All transaction verifications require cryptographic HMAC-SHA256 digest validation before persisting state transitions.

---

## 📄 License

Distributed under the **ISC License**.

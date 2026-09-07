# CivicFlow — City Complaint & Service Request Platform Backend

CivicFlow is a modern, enterprise-grade municipal complaint management and public service request backend API. Built with Node.js, Express, TypeScript, PostgreSQL, and Prisma ORM, it enables citizens to lodge municipal complaints, track resolution lifecycles under strict Service Level Agreements (SLAs), and request/pay for municipal services with secure Stripe checkout and cryptographically verified webhooks.

---

## 1. Project Overview

CivicFlow bridges the communication gap between citizens and municipal administrations through a structured, multi-tier workflow:

```
Citizen Lodges Complaint ──► Department Review ──► Staff Assignment ──► Investigation & Work ──► Resolution ──► Citizen Closure & Feedback
```

### Key Highlights
- **Dual-Track Platform**: Manages public infrastructure complaints (potholes, water leaks, waste management) alongside paid municipal services (tree pruning, bulk waste pickup, permits).
- **Strict Role-Based Access Control (RBAC)**: Enforces boundaries across three distinct roles: `CITIZEN`, `STAFF`, and `ADMIN`.
- **SLA Tracking**: Automatically calculates resolution deadlines based on category-level SLA configurations and flags breaches.
- **Real Payment Processing**: Integrates Stripe Checkout with raw-body cryptographic signature verification on webhooks to eliminate manual or fabricated payment transitions.
- **Auditability**: Records status transition history and system-wide audit logs for complete accountability.

---

## 2. Core Features

- **Authentication & Authorization**
  - Citizen self-registration (strictly defaulted to `CITIZEN` role).
  - Secure email/password authentication using `bcryptjs` password hashing and signed JWT tokens.
  - Profile retrieval via `/api/v1/auth/me`.
  - Session termination via `/api/v1/auth/logout`.
  - Google OAuth 2.0 social authentication.
  - Role-based route authorization middleware (`CITIZEN`, `STAFF`, `ADMIN`).

- **Department & Category Management**
  - Full CRUD for municipal departments (e.g., Public Works, Sanitation, Water Supply).
  - Department-linked categories with customizable SLA turnaround hours (e.g., Pothole Repair: 48h SLA).
  - Department activation/deactivation controls.

- **Staff Management**
  - Admin-governed staff creation and assignment to specific municipal departments.
  - Staff workload tracking and active status management.

- **Complaint Lifecycle & Workflow**
  - Citizen complaint submission with title, description, location coordinates/address, category, and department.
  - Auto-calculated resolution due dates (`dueAt`) derived from category SLA hours.
  - Priority levels (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
  - Department-scoped staff assignment by Admin.
  - Status progression: `SUBMITTED` ➔ `UNDER_REVIEW` ➔ `ASSIGNED` ➔ `IN_PROGRESS` ➔ `RESOLVED` ➔ `CLOSED`.
  - Edge transitions: `REJECTED`, `CANCELLED`, `REOPENED`.
  - Complete status transition history logging with timestamps, actor IDs, and resolution notes.
  - Citizen feedback and 1–5 star rating submission upon complaint resolution.

- **Municipal Services & Paid Requests**
  - Catalog of official municipal services with fixed pricing.
  - Citizen service request submission with location, quantity, and auto-calculated total cost.
  - Request lifecycle: `PENDING_PAYMENT` ➔ `PAID` ➔ `PROCESSING` ➔ `COMPLETED` ➔ `CANCELLED`.

- **Stripe Payment & Webhook Integration**
  - Dynamic Stripe Checkout Session creation linked to service requests.
  - Cryptographically verified Stripe webhook handler (`/api/v1/payments/stripe/webhook`) using Express raw body capture.
  - Atomic database transactions updating payment records to `PAID` and triggering service fulfillment.

- **Notifications & Audit Logs**
  - Real-time notification creation for complaint updates, assignments, SLA breaches, and payment receipts.
  - Unread/read status management and batch dismissal.
  - Centralized audit trail capturing entity modifications, actor user IDs, actions, and metadata.

- **Analytics & Reporting**
  - Summary metrics: total complaints, resolution rates, pending queues.
  - Status and priority distribution breakdowns.
  - Department performance and SLA compliance metrics.
  - Revenue analytics for paid municipal services.

- **Developer Experience & Documentation**
  - Interactive Swagger OpenAPI 3.0 documentation.
  - Strict Zod validation schemas for all inputs.
  - Centralized error handling with sensitive pattern redaction.

---

## 3. Complaint Workflow

```mermaid
flowchart TD
    A([Citizen: Submit Complaint]) --> B[Auto-assign Due Date & Set Status: SUBMITTED]
    B --> C{Admin: Review Complaint}
    C -->|Valid| D[Status: UNDER_REVIEW]
    C -->|Invalid / Out of Scope| R[Status: REJECTED]
    D --> E[Admin: Assign Staff within Department]
    E --> F[Status: ASSIGNED]
    F --> G[Staff: Accept & Begin Work]
    G --> H[Status: IN_PROGRESS]
    H --> I[Staff: Resolve & Add Notes]
    I --> J[Status: RESOLVED]
    J --> K{Citizen Verification}
    K -->|Satisfied| L[Citizen: Close Complaint]
    L --> M[Status: CLOSED]
    M --> N[Citizen: Submit 1-5 Star Rating & Feedback]
    K -->|Unsatisfied| O[Citizen: Reopen with Note]
    O --> P[Status: REOPENED]
    P --> E
```

---

## 4. Payment Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Citizen
    participant Client as Frontend / Client
    participant API as CivicFlow API
    participant DB as PostgreSQL Database
    participant Stripe as Stripe Gateway

    Citizen->>Client: Select Municipal Service & Submit Request
    Client->>API: POST /api/v1/service-requests
    API->>DB: Create ServiceRequest (Status: PENDING_PAYMENT)
    API-->>Client: Return ServiceRequest Details

    Citizen->>Client: Click Pay Now
    Client->>API: POST /api/v1/service-requests/:id/payment
    API->>Stripe: Create Stripe Checkout Session (metadata: serviceRequestId, citizenId)
    Stripe-->>API: Return Checkout URL & Session ID
    API->>DB: Create/Update Payment Record (Status: PENDING)
    API-->>Client: Return Checkout URL
    Client->>Stripe: Citizen Completes Payment on Stripe Checkout

    Stripe->>API: POST /api/v1/payments/stripe/webhook (checkout.session.completed)
    Note over API: Verify raw webhook signature with Stripe Secret
    API->>DB: Atomic Transaction: Payment -> PAID, ServiceRequest -> PAID
    API->>DB: Create Notification & Audit Log
    API-->>Stripe: 200 OK (Acknowledged)
```

> [!IMPORTANT]
> Payment status cannot be altered directly via user-facing REST endpoints. All payment state transitions are strictly verified and driven by signed Stripe Webhook events.

---

## 5. Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js / Bun** | Server runtime environment |
| **Express.js** | Web application framework |
| **TypeScript** | Type-safe programming language |
| **PostgreSQL** | Relational SQL database |
| **Prisma ORM (v6)** | Next-generation database ORM & migrations |
| **Zod** | Runtime schema validation |
| **JWT (`jsonwebtoken`)** | Stateless token-based authentication |
| **`bcryptjs`** | Secure password hashing |
| **Stripe SDK** | Online payment checkout & webhook processing |
| **Helmet** | HTTP security header configuration & CSP |
| **CORS** | Cross-Origin Resource Sharing control |
| **TSUP** | Fast TypeScript bundling for production |
| **Vercel** | Serverless cloud deployment support |

---

## 6. Role & Permission Summary (RBAC)

| Resource / Action | `CITIZEN` | `STAFF` | `ADMIN` |
|---|:---:|:---:|:---:|
| **Register / Login / Profile (`/auth/me`)** | ✅ | ✅ | ✅ |
| **View Active Departments & Categories** | ✅ | ✅ | ✅ |
| **Create & Manage Departments / Categories** | ❌ | ❌ | ✅ |
| **Manage Staff Members (Create, Update, Department Assign)** | ❌ | ❌ | ✅ |
| **Submit Complaints** | ✅ | ❌ | ❌ |
| **View Own Complaints** | ✅ | ❌ | ❌ |
| **View Assigned Complaints (Department Scoped)** | ❌ | ✅ | ❌ |
| **View All Complaints Across City** | ❌ | ❌ | ✅ |
| **Assign / Reassign Staff to Complaints** | ❌ | ❌ | ✅ |
| **Update Complaint Status (In Progress, Resolved)** | ❌ | ✅ (Assigned) | ✅ |
| **Close / Reopen Own Complaint** | ✅ | ❌ | ✅ |
| **Submit Feedback & Star Rating** | ✅ (Own) | ❌ | ❌ |
| **Request Paid Municipal Services** | ✅ | ❌ | ❌ |
| **Initiate Stripe Checkout** | ✅ (Own) | ❌ | ❌ |
| **Manage Municipal Service Catalog (Price, Active)** | ❌ | ❌ | ✅ |
| **View Notifications** | ✅ (Own) | ✅ (Own) | ✅ (Own) |
| **View System Audit Logs & Analytics Dashboards** | ❌ | ❌ | ✅ |

---

## 7. API Documentation

- **Live Base URL**: `https://<your-deployment-domain>/api/v1` *(or `http://localhost:5000/api/v1` locally)*
- **Interactive Swagger UI**: `https://<your-deployment-domain>/api-docs` *(or `http://localhost:5000/api-docs`)*
- **OpenAPI 3.0 Specification (JSON)**: `https://<your-deployment-domain>/api-docs.json`
- **Postman Collection**: `civicflow_postman_collection.json` (Located in the repository root)

---

## 8. API Response Format

All responses follow a standardized, predictable JSON envelope.

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    "id": "c1f7a2d8-4b9e-4e6f-8c3a-1d5e7f9a0b2c",
    "title": "Damaged streetlight on Elm Street",
    "status": "SUBMITTED"
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Invalid credentials provided",
  "data": null
}
```

### Route Not Found (404)
```json
{
  "success": false,
  "message": "Route not found",
  "data": null
}
```

---

## 9. Authentication

Authentication is handled via stateless JSON Web Tokens (JWT).

1. **Registration** (`POST /api/v1/auth/register`):
   - Creates a new account defaulted strictly to the `CITIZEN` role.
2. **Login** (`POST /api/v1/auth/login`):
   - Accepts email and password, returning user details and a signed JWT bearer token.
3. **Protected Requests**:
   - Supply the token in the `Authorization` request header:
     ```http
     Authorization: Bearer <your-jwt-token>
     ```
4. **Current Profile** (`GET /api/v1/auth/me`):
   - Returns the authenticated user's profile and assigned role.
5. **Logout** (`POST /api/v1/auth/logout`):
   - Explicitly logs out the user session.
6. **Google OAuth 2.0** (`GET /api/v1/auth/google` & `GET /api/v1/auth/google/callback`):
   - Facilitates single-click social login via Google.

---

## 10. Environment Variables

Create a `.env` file in the root directory using the following template:

```env
# Application Port
PORT=5000

# PostgreSQL Connection String (Direct or Pooled)
DATABASE_URL="postgresql://username:password@localhost:5432/civicflow_db?schema=public"

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_me
JWT_EXPIRESIN=1d

# Stripe Payment Gateway
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback

# Allowed Client Origin for CORS
CLIENT_URL=http://localhost:3000
```

> [!WARNING]
> Never commit `.env` or expose real production secrets, private keys, or webhook signing tokens in source control.

---

## 11. Local Development Setup

### Prerequisites
- Node.js `>= 18` or [Bun](https://bun.sh) `>= 1.1`
- PostgreSQL `>= 14`

### Installation & Run Steps

1. **Clone the repository and install dependencies**:
   ```bash
   # Using Bun (recommended)
   bun install

   # Or using npm
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your local PostgreSQL credentials and test keys
   ```

3. **Generate Prisma Client & Apply Migrations**:
   ```bash
   # Generate Prisma Client
   bunx prisma generate

   # Run database migrations
   bunx prisma migrate dev
   ```

4. **Start Development Server**:
   ```bash
   bun run dev
   # Server runs with live reload on http://localhost:5000
   ```

5. **Build for Production**:
   ```bash
   bun run build
   ```

6. **Start Production Server**:
   ```bash
   bun run start
   ```

---

## 12. Database Architecture

The data layer uses **PostgreSQL** structured through **Prisma ORM**:

- **`User`**: Core identity model supporting password authentication and Google OAuth (`googleId`), role enforcement (`CITIZEN`, `STAFF`, `ADMIN`), and department linkage for staff.
- **`Department`**: Administrative divisions managing specific city functions.
- **`Category`**: Granular complaint types linked to departments with configurable SLA resolution targets (`slaHours`).
- **`Complaint`**: Central entity linking citizen, category, department, assigned staff, status, priority, and SLA due date (`dueAt`).
- **`ComplaintStatusHistory`**: Append-only log tracking every status transition, actor ID, and operational note.
- **`Feedback`**: Citizen satisfaction ratings (1–5) and reviews linked 1:1 with complaints.
- **`MunicipalService`**: Official public services available for citizen purchase.
- **`ServiceRequest`**: Citizen service requests tracking fulfillment status and amount.
- **`Payment`**: Financial records tracking Stripe transaction IDs, currency, and payment status (`PENDING`, `PAID`, `FAILED`).
- **`Notification`**: Targeted user alerts with read/unread tracking.
- **`AuditLog`**: System-wide administrative action logs storing entity identifiers, action types, and JSON metadata.

---

## 13. Security Measures

- **Password Protection**: Passwords hashed using `bcryptjs` with salted hashing before persistence.
- **JWT Cryptographic Verification**: Signature verification with expiration validation on all private routes.
- **Role-Based Access Control**: Strict multi-role middleware preventing unauthorized horizontal or vertical privilege escalation.
- **Input Sanitization & Validation**: 100% of request payloads validated via strict Zod schemas.
- **HTTP Header Hardening**: Helmet integration with scoped Content Security Policy (CSP) headers.
- **Production CORS**: Configured to restrict cross-origin requests to configured frontend clients (`CLIENT_URL`).
- **Cryptographic Webhook Validation**: Stripe webhooks validated using raw request buffers against Stripe webhook signing secrets.
- **Information Leakage Prevention**: Centralized error handling scrubs sensitive database patterns, connection strings, and stack traces.

---

## 14. Deployment Setup (Vercel Serverless Ready)

CivicFlow is fully pre-configured for Vercel Serverless deployment:

- **Serverless Entry Point**: Located at [`api/index.ts`](file:///c:/Users/sumai/projects/CityCare/api/index.ts), exporting the configured Express application.
- **Routing Configuration**: [`vercel.json`](file:///c:/Users/sumai/projects/CityCare/vercel.json) rewrites all inbound requests to `/api`.
- **Stateless Asset Delivery**: Swagger UI runs via reliable CDN assets, eliminating serverless filesystem path mismatches.
- **Database Connection Pooling**: Ready for Supabase, Neon, or AWS RDS PostgreSQL connection poolers (`pgbouncer`).

---

## 15. Testing & Verification

The API can be verified via:

1. **Interactive Swagger UI**: Navigate to `/api-docs` to test all endpoints interactively with Bearer token authentication.
2. **Postman Collection**: Import `civicflow_postman_collection.json` to execute pre-configured requests covering:
   - Registration, Login, Logout, and Token Verification.
   - Admin setup (Departments, Categories, Staff creation).
   - Citizen complaint filing, assignment, progression, resolution, and rating.
   - Paid service catalog creation, service request filing, and Stripe checkout initiation.
   - Status history verification and Audit log querying.
   - Validation failures (400), Unauthorized access (401), Forbidden permissions (403), and Route not found (404).

---

## 16. Demo Credentials & Sample Payloads

### Sample Credentials
```text
ADMIN USER:
Email:    admin@civicflow.com
Password: <configured-admin-password>

STAFF USER:
Email:    staff@civicflow.com
Password: <configured-staff-password>

CITIZEN USER:
Email:    citizen@example.com
Password: <configured-citizen-password>
```

### Sample Register Payload
```json
{
  "name": "Jane Citizen",
  "email": "jane.citizen@example.com",
  "password": "Password123!"
}
```

### Sample Complaint Submission Payload
```json
{
  "title": "Large pothole obstructing lane",
  "description": "Deep pothole near the intersection of 5th Ave and Main St causing traffic slowdown.",
  "location": "5th Ave & Main St, Downtown",
  "categoryId": "<valid-category-uuid>",
  "priority": "HIGH"
}
```

---

## 17. Project Structure

```text
CityCare/
├── api/
│   └── index.ts                  # Vercel serverless function entrypoint
├── prisma/
│   ├── migrations/               # PostgreSQL schema migration history
│   └── schema.prisma             # Complete Prisma schema definition
├── src/
│   ├── server.ts                 # Local development HTTP server bootstrap
│   ├── app.ts                    # Express application setup & middleware assembly
│   └── app/
│       ├── config/
│       │   └── index.ts          # Centralized environment configuration
│       ├── docs/
│       │   └── swagger.ts        # OpenAPI 3.0 document & Swagger UI configuration
│       ├── middlewares/
│       │   ├── auth.middleware.ts# JWT authentication & RBAC authorization
│       │   └── globalErrorHandler.ts # Error normalization & sanitization
│       ├── modules/
│       │   ├── analytics/        # Complaint & revenue analytics dashboards
│       │   ├── auditLog/         # System audit trail logs
│       │   ├── auth/             # Registration, login, logout, OAuth
│       │   ├── category/         # Department categories & SLA hours
│       │   ├── complaint/        # Complaint lifecycle & assignment
│       │   ├── department/       # City departments
│       │   ├── feedback/         # Citizen reviews & 1-5 star ratings
│       │   ├── notification/     # In-app user notifications
│       │   ├── payment/          # Stripe checkout & webhook processing
│       │   ├── service/          # Municipal service catalog
│       │   ├── serviceRequest/   # Paid citizen service requests
│       │   └── staff/            # Staff user administration
│       └── routes/
│           └── index.ts          # Centralized API v1 route aggregator
├── civicflow_postman_collection.json # Comprehensive Postman test collection
├── package.json                  # Node.js dependencies & execution scripts
├── tsconfig.json                 # TypeScript compiler configuration
├── tsup.config.ts                # Production build & bundling configuration
└── vercel.json                   # Vercel serverless routing configuration
```

---

## 18. Assignment Highlights

1. **Robust RBAC Model**: Distinct separation of privileges across Citizen, Staff, and Admin roles.
2. **Deterministic Complaint Lifecycle**: Strict status progression with mandatory auditing on every transition.
3. **Automated SLA Calculation**: Turnaround deadlines dynamically determined from category SLA configurations.
4. **Legitimate Payment Architecture**: End-to-end Stripe Checkout integration with signed webhook verification.
5. **Zero-Leakage Security**: Scoped Helmet CSP, CORS origin protection, and sanitized error responses.
6. **Complete API Documentation**: 100% route coverage across both Swagger UI and Postman.
7. **Serverless Production Readiness**: Fully tested and deployable to Vercel without filesystem or asset degradation.

---

## 19. Final Notes

CivicFlow is engineered following clean architectural principles, modular separation of concerns, and robust defensive programming practices. For technical queries, refer to the interactive Swagger documentation at `/api-docs` or test the complete collection via `civicflow_postman_collection.json`.


# City Care — Frontend Application

Next.js frontend for the City Care municipal complaint and service management platform.

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure the backend API URL:

```bash
cp .env.example .env.local
```

#### Required Environment Variable

| Variable | Description | Example (Local) |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Base endpoint URL for the backend API v1 routes. | `http://localhost:5000/api/v1` |

> **Note:** Do not hardcode production URLs in the codebase. Supply the appropriate `NEXT_PUBLIC_BACKEND_URL` for each deployment environment.

### 3. Local Development

Start the local development server with Turbopack:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## Production Build & Deployment

### Build the Application

```bash
npm run build
```

### Run Production Server

```bash
npm run start
```

### Run Linter

```bash
npm run lint
```

---

## Deployment & CORS Boundaries

- **Independent Deployment**: The Next.js client is designed to be built and deployed independently (e.g., on Vercel or any Node.js hosting platform).
- **Backend CORS Matching**: The backend Express server enforces CORS based on its `CLIENT_URL` environment variable (`cors({ origin: config.client_url, credentials: true })`). When deploying the frontend to production, ensure the backend's `CLIENT_URL` is set to the exact origin of the deployed frontend (e.g. `https://your-frontend-domain.com`).
- **Separate Backend Provisioning**: Database (PostgreSQL via Prisma), authentication secrets (`JWT_SECRET`), Stripe keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`), and Google OAuth credentials must be provisioned and configured separately on the backend server.


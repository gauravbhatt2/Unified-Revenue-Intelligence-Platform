# Revenue Data Backbone

Revenue Data Backbone is an enterprise-grade, multi-tenant platform that ingests interaction data (email, call, meeting), resolves contacts and accounts deterministically, stores relationship edges in a highly scalable PostgreSQL graph model, and exports compliant datasets to external Data Clouds.

Core flow:

`Ingest -> Normalize -> Resolve -> Map -> Store -> Export / Data Cloud Push`

## Repository Structure

- `revenue-backbone`: NestJS + Prisma + PostgreSQL backend (Modular Monolith)
- `revenue-frontend`: Next.js frontend (App Router + Tailwind + React Query)
- `problem_statement.md`: Problem framing
- `revenue_backbone_prd.md`: Product Requirements Document
- `revenue_backbone_brd.md`: Business Requirements Document

## Enterprise Features Implemented

- **Automated Data Capture Engine**: Deterministic identity resolution (exact email, no AI/fuzzy matching) with duplicate detection.
- **Revenue Graph**: Relational model via `interaction_participants` edge table for O(1) traversals.
- **AI Context Layer**: Structured JSON APIs providing pre-assembled account context for downstream AI.
- **Data Cloud**: Outbound webhook-based push sync with automated retry and exponential backoff.
- **Native Connectors**: HubSpot connector for contacts, companies, and webhook ingestion, plus Cron scheduling.
- **Compliance Enforcement**: Configurable modes per tenant (`EXCLUDE_INTERACTION`, `REDACT_PARTICIPANT`).
- **Export Governance**: Audit logging with immutable records for CSV, JSON, and Webhook exports.
- **Strict Tenant Isolation**: 
  - Application-level request boundaries.
  - DB-level PostgreSQL Row Level Security (RLS) policies.

## Environment Variables

### Backend (`revenue-backbone/.env`)

```env
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/revenue_backbone?schema=public"
PORT=3000
NODE_ENV=development
HUBSPOT_ACCESS_TOKEN=""
```

### Frontend (`revenue-frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Setup & Run

### 1) Backend

```bash
cd revenue-backbone
npm install
npm run prisma:generate
npm run prisma:migrate
# Optional: npm run prisma:seed
npm run start:dev
```

Backend runs on `http://localhost:3000`

### 2) Frontend

```bash
cd revenue-frontend
npm install
npm run dev -- --port 3001
```

Frontend runs on `http://localhost:3001`

## API Summary

### Tenant
- `POST /tenants`, `GET /tenants`, `GET /tenants/:id`

### Ingestion
- `POST /ingest`

### Accounts & Graph
- `GET /accounts`, `GET /accounts/:id`, `GET /accounts/:id/interactions`

### AI Context Layer
- `GET /ai-context/account/:accountId`
- `GET /ai-context/contact/:contactId`

### Compliance
- `PATCH /contacts/:id/opt-out`, `PATCH /contacts/:id/opt-in`
- `GET /contacts/compliance/settings`, `PATCH /contacts/compliance/settings`

### Export & Data Cloud
- `GET /export/account/:id?format=json|csv`
- `GET /export/deal/:id?format=json|csv`
- `GET /export/logs`
- `POST /data-cloud/push/account/:accountId`
- `POST /data-cloud/push/tenant`
- `GET /data-cloud/history`

### Connectors (HubSpot)
- `POST /connectors/hubspot/sync` (Contacts)
- `POST /connectors/hubspot/sync-companies`
- `POST /connectors/hubspot/webhook`

### Admin
- `GET /admin/raw-interactions?status=failed`
- `POST /admin/raw-interactions/:id/retry`

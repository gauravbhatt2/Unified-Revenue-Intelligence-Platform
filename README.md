# Revenue Data Backbone

Revenue Data Backbone is a multi-tenant POC that ingests interaction data (email/call/meeting), resolves contacts and accounts deterministically, stores relationship edges in PostgreSQL, and exports compliant datasets.

Core flow:

`Ingest -> Normalize -> Resolve -> Map -> Store -> Export`

## Repository Structure

- `revenue-backbone`: NestJS + Prisma + PostgreSQL backend
- `revenue-frontend`: Next.js frontend
- `problem_statement.md`: problem framing
- `revenue_backbone_prd.md`: product requirements
- `revenue_backbone_brd.md`: business requirements

## Implemented Highlights

- Deterministic identity resolution (exact email, no AI/fuzzy matching)
- Revenue graph model via `interaction_participants` edge table
- HubSpot connector endpoints (sync + webhook ingestion)
- Compliance modes per tenant:
  - `EXCLUDE_INTERACTION`
  - `REDACT_PARTICIPANT`
- Compliance metadata on contacts (`is_opted_out`, `opted_out_at`, `opt_out_reason`)
- Export audit logging with immutable records
- Tenant isolation at two layers:
  - request-level tenant/user headers
  - DB-level PostgreSQL RLS policies
- Frontend graph UI + timeline + export logs + admin retry view

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

## Setup

### 1) Backend install + DB migration

```bash
cd revenue-backbone
npm install
npm run prisma:generate
npm run prisma:migrate
```

Optional seed:

```bash
npm run prisma:seed
```

### 2) Frontend install

```bash
cd revenue-frontend
npm install
```

## Run

### Backend

```bash
cd revenue-backbone
npm run start:dev
```

Backend: `http://localhost:3000`

### Frontend

```bash
cd revenue-frontend
npm run dev -- --port 3001
```

Frontend: `http://localhost:3001`

## Auth Headers for Protected APIs

All protected backend routes require:

- `x-tenant-id: <tenant-id>`
- `x-user-id: <user-id>`

`/tenants` bootstrap endpoints are public.

## API Summary

### Tenant

- `POST /tenants`
- `GET /tenants`
- `GET /tenants/:id`

### Ingestion

- `POST /ingest`

Payload example:

```json
{
  "type": "email",
  "timestamp": "2026-04-29T08:30:00.000Z",
  "participants": [
    { "email": "alice@example.com", "firstName": "Alice", "role": "sender" },
    { "email": "bob@example.com", "role": "recipient" }
  ],
  "summary": "Quarterly update",
  "subject": "Q2 planning",
  "direction": "outbound",
  "sourceId": "crm-evt-123",
  "source": "api"
}
```

### Accounts

- `GET /accounts`
- `GET /accounts/:id`
- `GET /accounts/:id/interactions`

### Compliance

- `PATCH /contacts/:id/opt-out`
- `PATCH /contacts/:id/opt-in`
- `GET /contacts/compliance/settings`
- `PATCH /contacts/compliance/settings`

### Export

- `GET /export/account/:id?format=json`
- `GET /export/account/:id?format=csv`
- `GET /export/deal/:id?format=json`
- `GET /export/deal/:id?format=csv`
- `GET /export/logs`

### HubSpot

- `POST /connectors/hubspot/sync`
- `POST /connectors/hubspot/webhook`

### Admin

- `GET /admin/raw-interactions?status=failed`
- `POST /admin/raw-interactions/:id/retry`

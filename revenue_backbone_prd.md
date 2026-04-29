# Product Requirements Document (PRD)

## Revenue Data Backbone (Production Release)

---

## 1. Overview

The Revenue Data Backbone is a multi-tenant system that connects interaction data from multiple sources to structured business entities (accounts, contacts, deals), enabling a unified and queryable view of revenue activity.

The system stores relationships in a relational “Revenue Graph” and enables controlled data export with compliance enforcement.

---

## 2. Goals

* Ingest interaction data from at least one source (HubSpot or mock)
* Normalize raw data into a common structure
* Map interactions to contacts and accounts
* Store relationships in a relational model
* Enable export of structured data
* Enforce compliance (opt-out, tenant isolation)

---

## 3. Non-Goals

The following are explicitly out of scope:

* AI-based identity resolution
* Contact deduplication or merge workflows
* Graph databases (use PostgreSQL only)
* Real-time streaming systems
* Advanced analytics dashboards
* OAuth-based integrations (use mock or static credentials)

---

## 4. Core Entities

* Tenant — organization using the platform
* Account — company entity
* Contact — individual (identified by email)
* Deal — optional commercial opportunity
* Interaction — event (email, call, meeting)
* InteractionParticipant — mapping table between interaction and contact

IMPORTANT:
This is the core relationship table of the system.
It acts as the "edge" in the revenue graph.

All interaction-to-entity relationships must flow through this table.

Each interaction can have multiple participants, and each participant is resolved via email → contact mapping.

---

## 5. System Flow

### Step 1 — Ingestion

* Receive interaction event (API or mock)
* Store in `raw_interactions`

### Step 2 — Normalization

* Convert raw event into structured interaction format

### Step 3 — Identity Resolution (CORE)

* Match contact using **exact email**
* If not found → create new contact
* Link contact to account via email domain

### Step 4 — Relationship Mapping

* Link interaction → contact
* Link contact → account
* Optionally link interaction → deal

### Step 5 — Storage

* Store in relational tables (PostgreSQL)
* Maintain relationships via foreign keys

### Step 6 — Export

* Fetch data based on scope (account / deal)
* Apply compliance rules
* Return CSV / JSON

---

## 6. Core Features

### 6.1 Interaction Ingestion

* API endpoint to ingest interaction data
* Store raw data before processing
* Assign tenant_id at ingestion

---

### 6.2 Normalization

* Convert raw events into standard format:

  * type (email, call, meeting)
  * timestamp
  * participants (emails)
  * summary

---

### 6.3 Identity Resolution (Critical)

* Match contact by email (case-insensitive)
* If no match → create new contact
* No fuzzy matching
* No AI usage

---

### 6.4 Revenue Graph

* Store relationships:

  * interaction ↔ contact
  * contact → account
  * interaction → deal (optional)
* Enable queries:

  * interactions by account
  * interactions by deal

---

### 6.5 Export

* Export data by:

  * account
  * deal
* Formats:

  * CSV
  * JSON

---

### 6.6 Compliance

#### Opt-Out Rule

* Each contact has:

  * is_opted_out (boolean)

#### Enforcement

* During export:

  * If contact is opted out → exclude interaction

---

### 6.7 Tenant Isolation

* Every table contains `tenant_id`
* All queries are tenant-scoped
* No cross-tenant access allowed

---

## 7. Functional Requirements

### Ingestion

* Must accept interaction data
* Must store raw data
* Must assign tenant_id

---

### Mapping

* Must resolve contact via email
* Must create contact if not found
* Must link to account

---

### Query

* Must fetch interactions by account
* Must return correct relationships

---

### Export

* Must support CSV and JSON
* Must apply compliance rules

---

### Compliance

* Must block opted-out contacts from export

---

### Tenant

* Must enforce tenant isolation across all operations

---

## 8. Non-Functional Requirements

* Modular monolith architecture (NestJS)
* Relational database (PostgreSQL + Prisma)
* Scalable design but simple implementation
* Basic error handling
* Deterministic behavior

---

## 9. Success Criteria

* Interaction successfully ingested and stored
* Interaction correctly linked to contact and account
* Export returns correct structured data
* Opt-out enforcement works correctly
* Tenant isolation is maintained

---

## 10. Implementation Constraints

* Identity resolution = exact email match only
* No AI in core flow
* No complex workflows
* Keep system simple and modular

---

## 11. Current Implementation Status (Apr 2026 - Production)

### Implemented (Enterprise Grade)

* Ingestion pipeline (`ingest -> normalize -> resolve -> map -> store`) with raw payload persistence
* Duplicate detection by `(tenant_id, type, source_id)`
* Deterministic contact/account resolution by normalized email/domain
* Revenue graph storage via `interaction_participants` edge table
* AI Context Layer providing pre-assembled JSON context for downstream AI
* Data Cloud Outbound Push with automated retry and exponential backoff
* Account/deal export in JSON and CSV
* Compliance enforcement with tenant-configurable export mode (`EXCLUDE_INTERACTION`, `REDACT_PARTICIPANT`)
* Compliance metadata persistence (`is_opted_out`, `opted_out_at`, `opt_out_reason`)
* Export audit logging (`requested_by`, scope/filters, `record_count`, `excluded_count`, `redacted_count`, timestamp)
* Export log immutability enforced at DB layer (no update/delete)
* Tenant isolation hardening:
  * request-level tenant binding via `x-tenant-id` + `x-user-id`
  * PostgreSQL Row Level Security (RLS) on tenant-scoped tables
* HubSpot connector endpoints:
  * pull/sync endpoint for contacts and companies
  * webhook ingestion endpoint
  * cron-based scheduled sync
* Admin operations:
  * failed raw interaction list
  * retry endpoint
* Frontend:
  * account timeline
  * real revenue graph UI (account-contact-interaction)
  * AI context layer inspector
  * Data Cloud push action
  * compliance settings panel
  * export logs panel
  * admin retry screen

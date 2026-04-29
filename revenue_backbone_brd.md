**BUSINESS REQUIREMENTS DOCUMENT**

**Revenue Data Backbone**

_A Unified Revenue Intelligence Platform_

**Version**

1.0 — POC

**Status**

Draft — For Review

**Date**

April 2026

**Classification**

Internal Confidential

**SECTION 1**

# **Executive Summary**

Revenue operations at most organizations are fundamentally broken — not because the tools are bad, but because those tools do not speak to each other. Sales teams log calls in one system. Customer interactions live in email. Deal progress is tracked in a CRM. Meetings happen on a conferencing platform. No single place captures the full picture of what is happening across an account.

The Revenue Data Backbone is a centralized platform designed to solve this. It ingests interaction data from multiple sources, maps those interactions to the correct business entities — accounts, contacts, and deals — and stores the resulting relationships in a structured, queryable format. The outcome is a unified revenue graph: a connected view of every touchpoint across every account, accessible for analysis, reporting, and export.

This document defines the business requirements for the initial production-grade proof of concept. The system is designed to be practical and implementable within a short timeframe, without sacrificing the design principles required for enterprise adoption: multi-tenant data isolation, compliance enforcement, and data export controls.

**Strategic Objective**

*   Eliminate revenue data fragmentation by providing one authoritative system of record for all account and contact interactions
*   Enable data-driven revenue decisions by making interaction history queryable and exportable in a structured format
*   Establish enterprise-grade trust from day one through tenant isolation, opt-out enforcement, and full export audit trails
*   Build a foundation that grows — the POC scope is narrow by design, but the architecture supports future expansion without structural rework

**SECTION 2**

# **Problem Statement**

## **2.1 The Fragmentation Problem**

Enterprise revenue teams operate across five or more disconnected tools simultaneously. A typical company might use HubSpot for CRM, Gmail or Outlook for email, Zoom or Teams for meetings, a dialer for calls, and a project management tool for post-sale activities. Each of these systems stores data in its own format, using its own identifiers, with no awareness of the others.

The consequences are concrete and costly. A sales manager trying to understand what has happened with a key account in the past month must manually check each system, cross-reference names and email addresses, and mentally assemble a timeline. There is no automated answer to a question as simple as: when was the last meaningful interaction with the Acme Corp account, who was involved, and which deal does it relate to?

## **2.2 Why This Matters to Business**

| **Business Pain** | **Impact** |
|---|---|
| No unified account view | Revenue teams cannot see a complete interaction timeline per account. Decisions are made on incomplete information, increasing churn risk and missed upsell opportunities. |
| Duplicate and conflicting data | The same contact appears under different names, emails, or identifiers across systems. Without resolution, reporting is inaccurate and interventions are misdirected. |
| Compliance exposure | Contacts who have opted out of communication may still appear in data exports if opt-out status is not enforced at the data layer. This creates regulatory risk. |
| No export governance | Sales and operations teams export data ad hoc with no centralized record of what was exported, when, and by whom. This is a liability in regulated industries. |
| Tenant data leakage risk | In multi-tenant platforms, weak data isolation means one tenant's data could inadvertently be exposed in another tenant's queries or exports. This is a trust-breaking failure. |
## **2.3 Why Compliance and Isolation Are Non-Negotiable**

Two requirements elevate this system above a standard data aggregation tool: compliance enforcement and tenant isolation. These are not features to add later — they are architectural commitments that must be present from the first version.

Opt-out compliance means that when a contact requests to be excluded from communications or data processing, that decision must be respected everywhere the contact's data appears — including exports. A compliance check that only lives in one part of the application is not reliable. It must be enforced at the data layer, automatically, every time data is retrieved or exported.

Tenant isolation means that in a multi-tenant deployment, no query, export, or API response should ever return data belonging to a different tenant — even accidentally. This cannot be a convention enforced only by developer discipline. It must be guaranteed by the system's infrastructure.

**SECTION 3**

# **Business Objectives**

The following objectives define what the system must accomplish from a business perspective. Each objective is measurable and scoped to the POC.

| **Ref** | **Objective** | **Description** |
|---|---|---|
| BO-01 | Unified Interaction View | Provide a single queryable record of all account and contact interactions, regardless of their originating system. |
| BO-02 | Accurate Entity Mapping | Ensure that every ingested interaction is correctly linked to the right account, contact, and deal using deterministic matching rules. |
| BO-03 | Structured Data Export | Allow authorized users to export interaction and entity data in a structured format, with full control over scope and filters. |
| BO-04 | Compliance Enforcement | Automatically enforce contact opt-out rules on all data retrievals and exports, with no manual intervention required. |
| BO-05 | Tenant Data Isolation | Guarantee that data belonging to one tenant is never accessible, visible, or exportable to any other tenant. |
| BO-06 | Audit Transparency | Maintain a complete, tamper-resistant log of all export operations, including who requested the data, what was included, and when. |
**SECTION 4**

# **Stakeholders**

## **4.1 Primary Stakeholders**

| **Stakeholder** | **Role & Responsibility** |
|---|---|
| Revenue Operations Lead | Primary owner. Defines data requirements, validates entity mapping accuracy, approves export configurations. |
| Sales Leadership | Consumes the unified account view. Requires accurate interaction timelines for deal reviews and account planning. |
| Legal & Compliance Officer | Accountable for opt-out enforcement and data residency rules. Must approve compliance module behavior before go-live. |
| Engineering Lead | Responsible for system implementation. Translates requirements into technical design and infrastructure decisions. |
| Product Manager | Owns the roadmap. Prioritizes requirements, manages scope creep, and maintains alignment between stakeholders. |
## **4.2 Secondary Stakeholders**

| **Stakeholder** | **Involvement** |
|---|---|
| IT / Security Team | Reviews data storage and access control design. Must validate that tenant isolation meets organizational security standards. |
| Data Analysts | Downstream consumers of exported data. Provide requirements for export format and field availability. |
| Customer Success Team | Uses account interaction history to understand customer health and engagement trends. |
**SECTION 5**

# **Target Users**

The system serves two distinct user groups with different needs and access levels.

## **5.1 Revenue Operations Users**

These are the primary end users of the platform. They interact with the system through a web dashboard to view account interaction histories, verify entity mapping quality, configure compliance rules for their tenant, and trigger data exports. They need a clear, organized view of account activity — not raw data or technical interfaces.

**What Revenue Operations Users Need**

*   A timeline view of all interactions per account or deal, showing when contact occurred and through which channel
*   The ability to see which contacts are opted out and why, and to manually update opt-out status
*   The ability to export interaction data scoped to an account, deal, or time range in CSV or JSON format
*   A log of all previous exports with details on scope, format, and who requested them

## **5.2 Platform Administrators**

These are technical or operations users who manage the platform configuration for one or more tenants. They configure source integrations (which CRM, which email account), manage tenant settings, and monitor the health of the ingestion pipeline (which events processed successfully, which failed, which are pending resolution).

**What Platform Administrators Need**

*   A view of ingestion pipeline status: how many events are queued, processed, or failed
*   The ability to review interactions that could not be automatically mapped to a contact, and manually confirm or reject proposed matches
*   Tenant configuration management: active sources, export format preferences, compliance policy settings
*   Access to resolution quality indicators: what percentage of interactions were matched automatically versus flagged for review

**SECTION 6**

# **Key Business Requirements**

Requirements are categorized as MUST HAVE (scope of the POC) or SHOULD HAVE (near-term follow-on). No COULD HAVE or NICE-TO-HAVE items are listed — this keeps the scope honest and implementable.

## **6.1 Data Ingestion**

| **Ref** | **Priority** | **Requirement** |
|---|---|---|
| BR-ING-01 | MUST | The system must accept interaction events from at least one CRM source (HubSpot) via webhook or scheduled pull at the start of the POC. |
| BR-ING-02 | MUST | Every ingested event must be stored in its original, unmodified form before any processing occurs. Raw events must never be deleted or altered after ingestion. |
| BR-ING-03 | MUST | The system must detect and discard duplicate events from the same source, using a combination of source system ID and event type. Duplicate detection must be automatic and not require manual intervention. |
| BR-ING-04 | MUST | Ingestion must be tenant-aware from the point of receipt. Every event must be stamped with a tenant identifier at the moment of ingestion, before any processing. |
| BR-ING-05 | SHOULD | The system should support ingestion from email (Gmail or Outlook) as a second source in the near term. |
| BR-ING-06 | SHOULD | A mechanism should exist for an administrator to manually re-trigger processing of a failed or skipped event without requiring an engineering deployment. |
## **6.2 Entity Mapping**

| **Ref** | **Priority** | **Requirement** |
|---|---|---|
| BR-MAP-01 | MUST | Every interaction must be linked to at least one contact record after processing. An interaction with no resolvable contact must be flagged as unresolved and visible to administrators for manual review. |
| BR-MAP-02 | MUST | Contact matching must use deterministic rules based on email address, phone number, and external CRM identifiers. Probabilistic or AI-based matching is explicitly out of scope for this version. |
| BR-MAP-03 | MUST | When a contact is matched to an interaction, the system must record the raw identifier used for matching (e.g., the email address) alongside the matched contact record, for auditability. |
| BR-MAP-04 | MUST | An interaction must be automatically linked to the owning account of the matched contact. This linkage must not require manual input. |
| BR-MAP-05 | MUST | An interaction may optionally be linked to an open deal associated with the account and contact. This linkage should be made automatically where a clear association exists, and left null where it does not. |
| BR-MAP-06 | SHOULD | Administrators should be able to review unresolved interactions and manually assign them to a contact through the dashboard. |
## **6.3 Revenue Graph & Data Storage**

| **Ref** | **Priority** | **Requirement** |
|---|---|---|
| BR-GRP-01 | MUST | The system must store accounts, contacts, deals, and interactions as distinct, related entities. Relationships between them must be explicit and queryable. |
| BR-GRP-02 | MUST | A user must be able to retrieve all interactions associated with a specific account, presenting a complete timeline in reverse chronological order. |
| BR-GRP-03 | MUST | A user must be able to retrieve all contacts associated with a specific deal, along with the interaction history for each of those contacts. |
| BR-GRP-04 | MUST | All data in the revenue graph must be scoped to a tenant. Cross-tenant data access must be structurally impossible, not merely convention. |
## **6.4 Export**

| **Ref** | **Priority** | **Requirement** |
|---|---|---|
| BR-EXP-01 | MUST | Authorized users must be able to export interaction data scoped to an account, a deal, or a date range. Full tenant-wide export is a privileged operation requiring elevated access. |
| BR-EXP-02 | MUST | Exports must be available in at least two formats: JSON (machine-readable) and CSV (human-readable). |
| BR-EXP-03 | MUST | Every export operation must generate an immutable audit log entry capturing: the requesting user, export scope and filters, format, record count, timestamp, and the number of records excluded due to compliance rules. |
| BR-EXP-04 | MUST | Export audit logs must be accessible to administrators through the dashboard. They must not be editable or deletable by any user. |
| BR-EXP-05 | SHOULD | Large exports (above a configurable threshold) should be processed asynchronously, with the user notified when the file is ready for download. |
## **6.5 Compliance**

| **Ref** | **Priority** | **Requirement** |
|---|---|---|
| BR-COM-01 | MUST | Every contact must have an opt-out status. The system must store the opt-out flag, the date it was set, and the reason (e.g., user request, regulatory requirement, unsubscribe). |
| BR-COM-02 | MUST | Any export that includes interactions associated with an opted-out contact must either exclude those interaction records entirely or redact the contact's personal information from them. The compliance behavior must be configurable at the tenant level. |
| BR-COM-03 | MUST | Compliance checks must be applied automatically at export time, without requiring the requesting user to manually filter opted-out contacts. Compliance enforcement must not depend on user action. |
| BR-COM-04 | MUST | The export audit log must record how many records were excluded or redacted due to compliance rules on each export, providing a demonstrable compliance trail. |
| BR-COM-05 | SHOULD | Administrators should be able to view a list of all opted-out contacts in their tenant, including opt-out date and reason, and update opt-out status through the dashboard. |
## **6.6 Tenant Isolation**

| **Ref** | **Priority** | **Requirement** |
|---|---|---|
| BR-TNT-01 | MUST | Every data record must be associated with a tenant identifier from the point of creation. No record may exist in the system without a tenant association. |
| BR-TNT-02 | MUST | Tenant isolation must be enforced at the database level using Row Level Security policies, not solely through application-level query filters. |
| BR-TNT-03 | MUST | An authenticated session must carry a tenant context that is established at login and cannot be modified by the user during their session. |
| BR-TNT-04 | MUST | No API endpoint, export operation, or query may return data from more than one tenant in a single response. |
**SECTION 7**

# **Success Criteria**

The following criteria define what a successful POC looks like. Each criterion is specific, testable, and tied to a business requirement. The POC is considered complete when all MUST criteria below are satisfied end-to-end in a working system.

## **7.1 End-to-End Functional Criteria**

| **Ref** | **Success Criterion** |
|---|---|
| SC-01 | A simulated or real interaction event (e.g., an email or CRM activity) can be ingested into the system and stored as a raw record without data loss. |
| SC-02 | The ingested event is normalized into a common format and processed through the mapping pipeline without manual intervention. |
| SC-03 | The interaction is linked to the correct contact based on email address or external CRM ID, and through that contact, linked to the owning account. |
| SC-04 | The interaction appears in the account's interaction timeline when queried through the dashboard or API, with correct type, timestamp, and participant information. |
| SC-05 | An authorized user can export the interaction data for a specific account in both CSV and JSON format. |
| SC-06 | An opted-out contact's interaction records are excluded from or redacted in the export without any manual filtering by the requesting user. |
| SC-07 | The export audit log captures a complete record of the operation, including the count of excluded records. |
| SC-08 | A query or export issued under Tenant A's credentials returns no data belonging to Tenant B, even when both tenants have interactions for similarly named accounts. |
## **7.2 Quality & Operational Criteria**

| **Ref** | **Success Criterion** |
|---|---|
| SC-09 | 90% or more of ingested events from a configured source are automatically resolved to a contact record without requiring manual review, in a test dataset with clean email data. |
| SC-10 | Duplicate events from the same source are rejected at ingestion without creating duplicate interaction records. |
| SC-11 | Failed processing events are visible to administrators in the dashboard, along with the error reason, and can be retried. |
| SC-12 | The system correctly handles the case where an ingested interaction contains a participant email address that does not match any known contact — creating an unresolved record rather than silently dropping the event. |
**SECTION 8**

# **Risks & Assumptions**

## **8.1 Risks**

| **Ref** | **Severity** | **Risk** | **Description** | **Mitigation** |
|---|---|---|---|---|
| R-01 | HIGH | Identity Resolution Accuracy | If contact matching is imprecise, interactions will be assigned to wrong contacts, corrupting the revenue graph silently. Incorrect data with high confidence is worse than no data. | Use strict, deterministic matching rules only. Flag ambiguous matches for human review. Do not auto-merge contacts without a high-confidence signal. |
| R-02 | HIGH | Compliance Bypass | If opt-out checks are applied only in one code path, a future feature addition may bypass them, exposing opted-out data in exports. | Enforce compliance at the data access layer, not just in the export endpoint. Compliance must be the system's responsibility, not the developer's. |
| R-03 | HIGH | Tenant Isolation Failure | A missing tenant filter in a single query could expose one tenant's data to another. This is a trust-breaking failure that cannot be recovered from commercially. | Enforce isolation through database-level Row Level Security. Application filters are secondary — the database must be the last line of defense. |
| R-04 | MED | Source API Changes | CRM and email providers change their API formats and webhook payloads without always providing advance notice. A breaking change in HubSpot's webhook format would stop ingestion. | Keep normalizers isolated per source. A format change in one source should require changes only to that source's normalizer, not the core pipeline. |
| R-05 | MED | Scope Creep | The POC scope is intentionally narrow. Stakeholder requests to add AI features, real-time sync, or advanced analytics during the build phase could compromise delivery. | All new requirements must go through a formal change request. Nothing outside the MUST requirements in Section 6 is in scope for the POC. |
| R-06 | LOW | Raw Data Volume | As ingestion scales, the raw interactions table will grow continuously. Without retention controls, storage costs increase indefinitely. | Define a retention policy for raw events at the outset (e.g., 90 days). Implement it in the POC even if enforcement is initially manual. |
## **8.2 Assumptions**

The following assumptions have been made in scoping this document. If any assumption proves false, the affected requirements must be re-evaluated.

| **Ref** | **Assumption** |
|---|---|
| A-01 | Source credentials (API keys, OAuth tokens) for at least one CRM system will be available for testing before development begins. The POC does not include building OAuth authorization flows. |
| A-02 | The initial deployment will serve a small number of tenants (fewer than 10) with moderate data volumes. The architecture is designed to scale, but performance optimization for large-scale multi-tenant loads is not a POC concern. |
| A-03 | Contact email addresses within a single tenant are unique — no two different people share the same email address in the system. Deduplication logic depends on this assumption. |
| A-04 | Opt-out requirements for the POC follow a simple binary model: a contact is either opted out or not. Regional compliance variations (GDPR purpose-specific consent, CCPA categories) are out of scope for the initial version. |
| A-05 | The system will be deployed in a single geographic region for the POC. Data residency requirements that mandate region-specific storage are not addressed in this version. |
| A-06 | User authentication and identity management will be handled by an existing auth provider (e.g., Supabase Auth). The system does not build its own authentication layer. |
**SECTION 9**

# **Explicitly Out of Scope**

The following items are commonly requested in revenue intelligence platforms but are explicitly excluded from the POC. Including them would compromise the timeline and introduce complexity that is not yet justified.

**Not in Scope for This Version**

*   AI or machine learning-based identity resolution, entity disambiguation, or interaction summarization
*   Real-time streaming ingestion or WebSocket-based live dashboards
*   OAuth authorization flows for connecting source systems — static credentials will be used for the POC
*   Advanced contact merge workflows with version history and undo capability
*   Multi-region deployment or data residency controls for specific geographies
*   Role-based access control beyond basic admin vs. standard user distinction
*   Automated alerting or notification workflows triggered by interaction patterns
*   Native integrations with more than one source system at POC launch
*   Time-series analytics, funnel analysis, or revenue forecasting
*   Custom compliance rule engines or purpose-specific consent management

**APPENDIX**

# **Glossary of Key Terms**

| **Term** | **Definition** |
|---|---|
| Account | A company or organization with which the tenant has a commercial relationship. The top-level entity in the revenue graph. |
| Contact | An individual person at an account who participates in interactions. The primary entity through which interactions are linked to accounts and deals. |
| Deal | A commercial opportunity between the tenant and an account. Has a lifecycle (stage) and monetary value. Interactions can be optionally linked to deals. |
| Interaction | A single event representing a touchpoint — an email, call, meeting, or CRM activity — involving one or more contacts. |
| Revenue Graph | The structured set of relationships between accounts, contacts, deals, and interactions. Not a graph database — a relational model designed to support graph-style traversal. |
| Identity Resolution | The process of matching participant identifiers (email addresses, phone numbers) from raw interaction data to canonical contact records in the system. |
| Tenant | An organization using the platform. All data is isolated per tenant. One tenant cannot access another tenant's data under any circumstances. |
| Opt-Out | A flag on a contact record indicating that the contact has requested to be excluded from data processing or communication. Enforced automatically at export time. |
| Raw Interaction | The unmodified event payload as received from a source system. Stored immutably before any normalization or processing occurs. |
| Tenant Isolation | The guarantee that data belonging to one tenant is never accessible to another. Enforced at the database level through Row Level Security policies. |
| Export Audit Log | An immutable record of every export operation performed in the system, including who exported data, what was included, what was excluded, and when. |
_Revenue Data Backbone — Business Requirements Document | Version 1.0 | April 2026 | Internal Confidential_

---

# **Implementation Addendum (POC Build Status — Apr 2026)**

This addendum captures the implemented scope for the current POC build and clarifies which BRD items are satisfied now vs. deferred beyond POC.

## **A. Delivered in Current POC**

*   HubSpot connector support delivered via:
    *   pull/sync endpoint
    *   webhook ingestion endpoint
*   Raw interaction persistence, duplicate detection, deterministic mapping flow implemented end-to-end
*   Revenue graph relationships implemented in relational model and exposed in UI
*   UI includes:
    *   account interaction timeline
    *   real graph visualization (account-contact-interaction)
    *   compliance mode settings
    *   export audit log view
    *   admin failed-ingestion retry page
*   Export supports CSV and JSON for account/deal scope
*   Compliance supports both exclusion and redaction model at tenant setting level
*   Compliance fields include opt-out date and reason
*   Export audit logs include requester, scope/filters, counts, timestamp, and are immutable at DB level
*   Tenant isolation implemented with:
    *   authenticated tenant context headers (`x-tenant-id`, `x-user-id`)
    *   PostgreSQL Row Level Security policies on tenant-scoped tables

## **B. Deferred Beyond Current POC**

*   Full identity/auth provider integration (OAuth/JWT/SSO with tenant context issued by IdP)
*   Multi-source native connectors beyond HubSpot-first implementation
*   Warehouse push/export destinations (e.g., Snowflake/BigQuery/S3 pipelines)
*   Advanced unresolved-interaction manual assignment workflow
*   Advanced deal lifecycle and mapping control workflows

## **C. BRD Interpretation Note**

Where BRD requirements describe production-grade capability, this POC implements the core requirement path and controls needed for functional validation. Deferred items above remain valid roadmap requirements and are not dropped; they are intentionally sequenced post-POC.


# Problem Statement — Revenue Data Backbone

## Overview

Revenue data is fragmented across multiple systems such as CRM (e.g., HubSpot), emails, calls, meetings, and other tools. As a result, organizations lack a unified and connected view of their core revenue entities — accounts, contacts, deals, and activities.

This fragmentation makes it difficult to:

* Understand complete interaction history for an account
* Accurately track deal progress
* Ensure data consistency across systems

At the same time, organizations must enforce strict controls on:

* Data exports
* Tenant isolation in multi-tenant systems
* Contact opt-out and privacy compliance

---

## Objective

Build a **Revenue Data Backbone system** that:

1. Ingests interaction data from external sources (CRM, email, calls, meetings)
2. Normalizes and structures this data
3. Maps interactions to business entities:

   * Contact
   * Account
   * Deal (optional)
4. Stores these relationships in a structured relational model (“Revenue Graph”)
5. Enables export of structured data
6. Enforces compliance rules:

   * Contact opt-out
   * Tenant isolation

---

## POC Goal

For the initial version, the system must demonstrate:

* One interaction can be ingested and stored
* That interaction is linked correctly to a contact and account
* The linked data can be exported
* Compliance (opt-out) is enforced during export
* Tenant-aware data separation is maintained

---

## Key Constraint

The system must be:

* Simple but production-minded
* Modular (not microservices)
* Deterministic (no AI in core mapping logic)
* Focused on correctness of data relationships

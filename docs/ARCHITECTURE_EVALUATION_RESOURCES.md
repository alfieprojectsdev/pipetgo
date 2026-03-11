# Architecture Evaluation Resources

This document curates the most critical resources within the repository for evaluating the PipetGo architecture. It is designed to help new architects and developers quickly understand the system's design, constraints, and current status.

## 1. High-Level Overview & Business Context
**Start here** to understand the "Why" and the "What" before diving into the "How".

*   **[CEO_ARCHITECTURE_SUMMARY.md](../docs/CEO_ARCHITECTURE_SUMMARY.md)**
    *   **significance:** High-level executive summary of the architecture.
    *   **Key Contents:** System context, "Not E-commerce" rationale, container architecture diagram, and key ADR summaries.
*   **[PROJECT_HIERARCHY.md](../docs/PROJECT_HIERARCHY.md)**
    *   **Significance:** Defines the project's phased approach (Stage 1 MVP vs. Stage 2 Polish).
    *   **Key Contents:** Roadmap stages, implementation phases, and current progress.
*   **[Business_Model_Strategy_report_20251015.md](../docs/Business_Model_Strategy_report_20251015.md)**
    *   **Significance:** Deep dive into the B2B marketplace model.
    *   **Key Contents:** Market analysis, value proposition, and revenue model.

## 2. Core Architecture Documentation
These files provided detailed technical specificiations for the system's primary components.

*   **[architecture/ARCHITECTURE_OVERVIEW.md](../docs/architecture/ARCHITECTURE_OVERVIEW.md)**
    *   **Significance:** The definitive technical guide to the system.
    *   **Key Contents:** detailed component views, technology justifications, deployment model, and mental models for developers.
*   **[architecture/DATABASE_ARCHITECTURE.md](../docs/architecture/DATABASE_ARCHITECTURE.md)**
    *   **Significance:** Complete reference for the data model.
    *   **Key Contents:** ER Diagram, deep dive into core models (User, Lab, Order), indexing strategy, and migration practices.
*   **[architecture/AUTHENTICATION_AND_AUTHORIZATION.md](../docs/architecture/AUTHENTICATION_AND_AUTHORIZATION.md)**
    *   **Significance:** Security architecture details.
    *   **Key Contents:** NextAuth configuration, role-based access control (RBAC), and session management.
*   **[architecture/PRICING_AND_QUOTATION_SYSTEM.md](../docs/architecture/PRICING_AND_QUOTATION_SYSTEM.md)**
    *   **Significance:** Explains the complex "Hybrid" pricing logic.
    *   **Key Contents:** State machines for order lifecycles, and logic for FIXED vs. QUOTE_REQUIRED modes.

## 3. Critical Architecture Decision Records (ADRs)
Understanding the "Why" behind specific technical choices.

*   **[ADR_DUAL_MODE_DATABASE.md](../docs/ADR_DUAL_MODE_DATABASE.md)**
    *   **Decision:** Supporting both pg-mem (mock) and Neon (live) databases for testing.
    *   **Relevance:** Critical for understanding the testing strategy and CI/CD pipeline.
*   **[ADR_QUOTATION_FIRST_SYSTEM_20251031.md](../docs/ADR_QUOTATION_FIRST_SYSTEM_20251031.md)**
    *   **Decision:** Adopting an Alibaba-style RFQ model over standard e-commerce.
    *   **Relevance:** Explains the fundamental divergence from typical shopping cart implementations.
*   **[ADR_AUTHENTICATION_ARCHITECTURE_20251117.md](../docs/ADR_AUTHENTICATION_ARCHITECTURE_20251117.md)**
    *   **Decision:** Use of JWT sessions in HTTP-only cookies.
    *   **Relevance:** detailed security trade-offs and implementation details.

## 4. Implementation Status & Audits
Resources for assessing the current state of the codebase and identifying technical debt.

*   **[CODE_REVIEW_FINDINGS.md](../docs/CODE_REVIEW_FINDINGS.md)**
    *   **Significance:** Recent (2026-02-01) analysis of code gaps and technical debt.
    *   **Key Contents:** Missing features (User Registration), security gaps, and dead code identification.
*   **[SECURITY_AUDIT_COMPREHENSIVE_20251119.md](../docs/SECURITY_AUDIT_COMPREHENSIVE_20251119.md)**
    *   **Significance:** Broad security review.
    *   **Key Contents:** Vulnerability assessment and recommendations.
*   **[DATABASE_PERFORMANCE_ANALYSIS_20251204.md](../docs/DATABASE_PERFORMANCE_ANALYSIS_20251204.md)**
    *   **Significance:** Performance review of the database layer.
    *   **Key Contents:** Query analysis and indexing recommendations.

## 5. Critical Utility Scripts
Scripts useful for dynamic analysis and verification.

*   **`scripts/diagnose-database.ts`**: Checks database connectivity and schema integrity.
*   **`scripts/verify-integrity.ts`**: Verifies system consistency.
*   **`scripts/test-production-logins.ts`**: Automated test for critical login flows (use with caution).
*   **`scripts/anonymize-production-labs.ts`**: Tooling for handling production data safely.

## 6. Key Code Locations
*   **`prisma/schema.prisma`**: The source of truth for the data model.
*   **`src/lib/auth.ts`**: Authentication configuration details.
*   **`src/lib/db.ts`**: Database connection management (Singleton pattern).
*   **`src/middleware.ts`** (if present) or **`next.config.js`**: implementation of edge-level concerns like security headers.

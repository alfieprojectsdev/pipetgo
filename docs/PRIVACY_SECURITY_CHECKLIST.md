# PipetGo Privacy & Security Checklist

**Date:** 2025-11-21
**Status:** Draft - For CEO Approval
**Compliance Target:** Philippine Data Privacy Act (RA 10173)

---

## Overview

This checklist ensures PipetGo meets privacy and security requirements for handling B2B data in the Philippines. CEO requested this document to address data privacy and security concerns.

---

## 1. Data Collection & Consent

### What Data We Collect

| Data Type | Purpose | Legal Basis | Retention |
|-----------|---------|-------------|-----------|
| **User Account** | Authentication, communication | Contract | Account lifetime + 2 years |
| Name, Email | Identify users, send notifications | Contract | |
| Role (Client/Lab/Admin) | Access control | Contract | |
| **Lab Profile** | Marketplace listing | Contract | Account lifetime + 5 years |
| Lab name, address | Display in catalog | Contract | |
| Certifications | Trust verification | Legitimate interest | |
| Contact details | Client communication | Contract | |
| **Orders/Quotes** | Transaction records | Contract | 7 years (tax compliance) |
| Order details | Fulfill service | Contract | |
| Pricing | Financial records | Legal obligation | |
| Communication | Dispute resolution | Legitimate interest | |
| **Analytics** | Platform improvement | Legitimate interest | Anonymized after 2 years |
| Page views | UX optimization | Legitimate interest | |
| Feature usage | Product development | Legitimate interest | |

### Checklist

- [ ] **Privacy Policy** posted on website
- [ ] **Terms of Service** include data handling
- [ ] **Consent checkbox** at registration
- [ ] **Cookie notice** (if using cookies beyond essential)
- [ ] **Data processing agreement** with labs (they handle client samples)

---

## 2. Data Subject Rights (Philippine DPA)

### Required Rights

| Right | Implementation | Status |
|-------|----------------|--------|
| **Right to Information** | Privacy policy explains what data is collected | 🔲 To implement |
| **Right to Access** | User can request copy of their data | 🔲 To implement |
| **Right to Rectification** | User can edit profile information | ✅ Implemented |
| **Right to Erasure** | User can request account deletion | 🔲 To implement |
| **Right to Object** | User can opt-out of marketing | 🔲 To implement |
| **Right to Data Portability** | User can export data in common format | 🔲 To implement |

### Checklist

- [ ] **Data Export Feature**: User can download their data (JSON/CSV)
- [ ] **Account Deletion**: User can request deletion (soft delete, retain for compliance)
- [ ] **Marketing Opt-out**: Unsubscribe link in all marketing emails
- [ ] **Data Access Request Form**: Contact method for DPA requests
- [ ] **Response Timeline**: 30 days to respond to data requests

---

## 3. Data Security Measures

### Technical Controls

| Control | Description | Status |
|---------|-------------|--------|
| **HTTPS** | All traffic encrypted (TLS 1.2+) | ✅ Vercel provides |
| **Password Hashing** | bcrypt (12+ rounds) | ✅ NextAuth |
| **Session Security** | HTTP-only, secure cookies | ✅ NextAuth |
| **SQL Injection** | Prisma ORM prevents | ✅ Implemented |
| **XSS Prevention** | React auto-escapes | ✅ Implemented |
| **CSRF Protection** | NextAuth provides | ✅ Implemented |
| **Rate Limiting** | Prevent brute force | 🔲 To implement |
| **Input Validation** | Zod schemas | ✅ Implemented |
| **Error Handling** | No sensitive data in errors | ✅ Implemented |

### Access Controls

| Control | Description | Status |
|---------|-------------|--------|
| **Role-Based Access** | Client/Lab/Admin separation | ✅ Implemented |
| **Resource Ownership** | Users only see their own data | ✅ Implemented |
| **Admin Audit Logs** | Track admin actions | 🔲 To implement |
| **Session Timeout** | Auto-logout after inactivity | 🔲 To implement |
| **2FA for Admins** | Extra security for admin accounts | 🔲 Optional |

### Checklist

- [x] HTTPS enforced on all pages
- [x] Passwords hashed with bcrypt
- [x] SQL injection prevented (Prisma ORM)
- [x] XSS prevented (React escaping)
- [x] Role-based access control implemented
- [x] Resource ownership verified in API routes
- [ ] Rate limiting on login/signup
- [ ] Session timeout (30 min inactivity)
- [ ] Audit logging for admin actions
- [ ] Security headers configured (HSTS, CSP)

---

## 4. Third-Party Services

### Current Third Parties

| Service | Data Shared | Purpose | DPA Compliance |
|---------|-------------|---------|----------------|
| **Vercel** | Application data | Hosting | GDPR compliant (adequate) |
| **Neon** | Database | PostgreSQL hosting | GDPR compliant (adequate) |
| **UploadThing** | File uploads | Store certificates | GDPR compliant (adequate) |
| **GoatCounter** | Anonymous page views | Analytics | Privacy-focused, no PII |

### Checklist

- [ ] **Data Processing Agreements** with all third parties
- [ ] **Data residency** documented (where is data stored?)
- [ ] **Sub-processor list** maintained
- [ ] **Security certifications** verified (SOC 2, ISO 27001)

---

## 5. Incident Response

### Breach Notification Requirements

**Philippine DPA requires:**
- Notify National Privacy Commission (NPC) within 72 hours
- Notify affected data subjects if high risk
- Document breach details and response

### Incident Response Plan

1. **Detection**: Monitor for unusual activity, user reports
2. **Containment**: Isolate affected systems
3. **Assessment**: Determine scope, data affected
4. **Notification**: NPC (72 hrs), users (if required)
5. **Remediation**: Fix vulnerability, restore service
6. **Documentation**: Incident report, lessons learned

### Checklist

- [ ] **Incident Response Plan** documented
- [ ] **Contact information** for NPC readily available
- [ ] **Breach notification template** prepared
- [ ] **Team responsibilities** assigned (who does what)
- [ ] **Communication plan** for notifying users

---

## 6. Data Retention & Deletion

### Retention Schedule

| Data Type | Active Retention | Archive | Deletion |
|-----------|-----------------|---------|----------|
| User accounts | While active | 2 years after closure | Anonymize |
| Orders/Quotes | While active | 7 years (tax) | Anonymize |
| Lab profiles | While active | 5 years after termination | Anonymize |
| Audit logs | 7 years | N/A | Delete after 7 years |
| Analytics | 2 years | N/A | Anonymize/aggregate |

### Checklist

- [ ] **Retention policy** documented
- [ ] **Deletion procedures** automated where possible
- [ ] **Archive process** for legal holds
- [ ] **Anonymization method** defined (remove PII, keep stats)

---

## 7. Employee/Admin Training

### Required Training Topics

- [ ] Data privacy basics (Philippine DPA)
- [ ] Recognizing phishing/social engineering
- [ ] Proper handling of user data requests
- [ ] Incident reporting procedures
- [ ] Secure password practices

### Checklist

- [ ] **Privacy training** for all team members
- [ ] **Admin-specific training** on audit responsibility
- [ ] **Annual refresher** scheduled
- [ ] **Training records** maintained

---

## 8. Documentation Requirements

### Required Documents

| Document | Status | Owner |
|----------|--------|-------|
| Privacy Policy | 🔲 Draft | Legal/CEO |
| Terms of Service | 🔲 Draft | Legal/CEO |
| Data Processing Agreement (Labs) | 🔲 Draft | Legal |
| Cookie Policy | 🔲 Draft (if needed) | Legal |
| Incident Response Plan | 🔲 Draft | Dev Team |
| Data Retention Policy | 🔲 Draft | CEO |

### Checklist

- [ ] **Privacy Policy** reviewed by legal
- [ ] **Terms of Service** include data handling
- [ ] **DPA with labs** (they process client sample data)
- [ ] **Internal policies** documented
- [ ] **Annual review** scheduled

---

## 9. CEO Action Items

### Immediate (Before Launch)

1. [ ] **Review this checklist** - approve or modify
2. [ ] **Privacy Policy draft** - legal review
3. [ ] **Terms of Service draft** - legal review
4. [ ] **Decide retention periods** - business/legal balance
5. [ ] **Assign Data Protection Officer** (if required by scale)

### Short-Term (First Month)

1. [ ] **Lab DPA template** - agreement with labs about data handling
2. [ ] **Incident response roles** - who handles breaches
3. [ ] **Training schedule** - privacy basics for team

### Optional Enhancements

1. [ ] **NPC registration** - register data processing systems
2. [ ] **External audit** - third-party security assessment
3. [ ] **Cyber insurance** - coverage for data breaches

---

## 10. Compliance Score

### Current Status (Self-Assessment)

| Category | Score | Notes |
|----------|-------|-------|
| Data Collection | 6/10 | Need privacy policy, consent UI |
| Data Subject Rights | 4/10 | Need export, deletion features |
| Security Controls | 8/10 | Strong technical, need rate limiting |
| Third Parties | 7/10 | All GDPR compliant, need formal DPAs |
| Incident Response | 3/10 | Need documented plan |
| Documentation | 4/10 | Need legal documents |
| **Overall** | **5.3/10** | Good foundation, legal docs needed |

### Target for Launch

- **Minimum:** 7/10 (legal docs, basic compliance)
- **Ideal:** 8.5/10 (all P0 items complete)

---

## Summary

### What's Already Good
- ✅ Strong technical security (HTTPS, hashing, ORM)
- ✅ Role-based access control
- ✅ Privacy-focused analytics (GoatCounter)
- ✅ GDPR-compliant hosting providers

### What's Needed Before Launch
- 🔲 Privacy Policy (legal document)
- 🔲 Terms of Service (legal document)
- 🔲 Rate limiting on auth endpoints
- 🔲 Security headers (HSTS, CSP)
- 🔲 Audit logging for admin actions

### What Can Wait Until After Launch
- 🔲 Data export feature
- 🔲 Account deletion feature
- 🔲 NPC registration (depends on scale)
- 🔲 External security audit

---

**Next Steps:**
1. CEO reviews and approves checklist
2. Legal drafts Privacy Policy and Terms of Service
3. Dev team implements rate limiting and audit logging
4. Schedule training for team members

---

**Questions for CEO:**
1. Do you have a lawyer who can draft Privacy Policy?
2. Should we register with NPC before launch?
3. What's the budget for external security audit?
4. Who will be the Data Protection Officer?

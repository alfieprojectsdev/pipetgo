# PipetGo Account Credentials - CONFIDENTIAL

**Generated:** 2025-12-01
**For:** Development & Production Access
**Security:** Keep in secure password manager - DO NOT commit to git

---

## 🔐 Security Notice

This document contains **ALL** account credentials for PipetGo across different environments and roles.

**CRITICAL:**
- Store in secure password manager (1Password, LastPass, Bitwarden)
- DELETE this file after copying credentials
- Never commit to git (already in .gitignore)
- Distribute via secure channels only (encrypted email, Signal, in-person)

---

## Production Accounts (www.pipetgo.com)

### Lab Administrator Accounts

Lab administrators require password authentication to provide quotes and manage orders.

#### Testing Lab 1
- **Email:** lab1@pgtestinglab.com
- **Password:** HSmgGnbBcZ!zRsGQsnDkNHnu
- **Role:** LAB_ADMIN
- **Status:** Active
- **Permissions:** Provide quotes, manage lab orders, upload results

#### Testing Lab 2
- **Email:** lab2@pgtestlab.com
- **Password:** f3iCMaNunBqNB6AzBf7bnFyR
- **Role:** LAB_ADMIN
- **Status:** Active
- **Permissions:** Provide quotes, manage lab orders, upload results

#### Testing Lab 3
- **Email:** lab3@pgtstlab.com
- **Password:** W4!cTAV@Gs2vNLE9@VEHCUDz
- **Role:** LAB_ADMIN
- **Status:** Active
- **Permissions:** Provide quotes, manage lab orders, upload results

#### Testing Lab 4
- **Email:** lab4@testlabpg.com
- **Password:** rY!hXsCWvUHbf8e65QwveYPG
- **Role:** LAB_ADMIN
- **Status:** Active
- **Permissions:** Provide quotes, manage lab orders, upload results

### Client Accounts

Clients use simplified authentication (currently email-only, password optional).

#### Demo Client 1
- **Email:** client@example.com
- **Password:** ClientDemo123!
- **Role:** CLIENT
- **Status:** Active
- **Permissions:** Submit RFQs, approve quotes, view own orders

#### Demo Client 2
- **Email:** maria.santos@businesscorp.ph
- **Password:** ClientDemo123!
- **Role:** CLIENT
- **Status:** Pending creation
- **Permissions:** Submit RFQs, approve quotes, view own orders

### Platform Admin Accounts

Platform administrators use email-only authentication for security simplicity.

#### Primary Admin
- **Email:** admin@pipetgo.com
- **Password:** AdminDemo123!
- **Role:** ADMIN
- **Status:** Active
- **Permissions:** Platform oversight, view all activity, user management

---

## Development Accounts (localhost:3000)

### Lab Administrator (Development)
- **Email:** lab@testinglab.com
- **Password:** TestPassword123!
- **Role:** LAB_ADMIN
- **Status:** Local only
- **Note:** Simple password for development convenience

### Client (Development)
- **Email:** client@example.com
- **Password:** *(No password required)*
- **Role:** CLIENT
- **Status:** Local only

### Admin (Development)
- **Email:** admin@pipetgo.com
- **Password:** *(No password required)*
- **Role:** ADMIN
- **Status:** Local only

---

## Authentication Flows by Role

### LAB_ADMIN (Password Required)

**Why password authentication:**
- Lab admins can provide quotes (financial data)
- Lab admins manage sensitive test results
- Lab admins represent businesses (higher security needed)

**Login process:**
1. Go to /auth/signin
2. Enter email (e.g., lab1@pgtestinglab.com)
3. Enter password from this document
4. Click "Sign In"
5. Session valid for 30 days

**Password requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Hashed with bcrypt (12 rounds) in database

### CLIENT (Simple Demo Password)

**Why simple password:**
- Easy for CEO to demo without developer assistance
- Lower barrier to testing the platform
- Can enforce strong passwords post-MVP

**Login process:**
1. Go to /auth/signin
2. Enter email
3. Enter password: **ClientDemo123!**
4. Click "Sign In"
5. Session valid for 30 days

**Password change:**
- Clients can change passwords via /auth/set-password
- For password reset, see "Password Recovery" section below

### ADMIN (Simple Demo Password)

**Why simple password:**
- Easy for internal team to access
- Simplified demo workflow
- Can enforce strong passwords post-MVP

**Login process:**
1. Go to /auth/signin
2. Enter email (must be @pipetgo.com)
3. Enter password: **AdminDemo123!**
4. Click "Sign In"
5. Session valid for 30 days

**Password change:**
- Admins can change passwords via /auth/set-password
- For password reset, see "Password Recovery" section below

---

## Database Schema Notes

**User model fields:**
```prisma
model User {
  id             String   @id @default(cuid())
  email          String   @unique
  name           String?
  role           UserRole @default(CLIENT)
  hashedPassword String?  // NULL for email-only auth
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

enum UserRole {
  CLIENT      // Submit RFQs, approve quotes
  LAB_ADMIN   // Provide quotes, manage orders
  ADMIN       // Platform oversight
}
```

**Authentication logic:**
- All users require password authentication (bcrypt verification)
- LAB_ADMIN uses complex random passwords (24 characters, high entropy)
- CLIENT and ADMIN use simple demo passwords (easy to remember for MVP)
- All passwords hashed with bcrypt (12 salt rounds)
- Password reset currently via SQL only (see "Password Recovery" section)

---

## Password Management

### Generating New Passwords

For new lab administrator accounts:

```bash
# Generate secure random passwords
npx tsx scripts/generate-passwords.ts

# Output includes:
# - Plaintext password (copy to this document)
# - Bcrypt hash (copy to database/seed script)
```

### Hashing Existing Passwords

If you have plaintext passwords that need to be hashed:

```bash
# Hash passwords from this document
npx tsx scripts/hash-existing-passwords.ts

# Output includes:
# - Bcrypt hashes
# - SQL UPDATE statements for production database
```

### Updating Production Database

**Method 1: SQL Console (Neon)**

```sql
-- Run in Neon SQL console
UPDATE "User"
SET "hashedPassword" = '<bcrypt_hash_here>',
    "updatedAt" = NOW()
WHERE email = 'lab1@pgtestinglab.com';
```

**Method 2: Migration Script**

```bash
# Use the prepared SQL script
# Copy script content: scripts/update-production-passwords.sql
# Paste into Neon SQL console
# Execute step by step
```

---

## Security Best Practices

### For CEO/Management

1. **Store credentials securely:**
   - Use enterprise password manager (1Password Teams, LastPass Enterprise)
   - Enable 2FA on password manager
   - Restrict access to need-to-know basis

2. **Distribute securely:**
   - Never send passwords via unencrypted email
   - Use Signal/WhatsApp for initial distribution
   - Instruct recipients to change password immediately (when feature available)

3. **Rotate passwords:**
   - Lab admin passwords: Every 90 days
   - After employee departure: Immediately
   - After suspected compromise: Immediately

### For Developers

1. **Never commit:**
   - This file is in .gitignore
   - Verify with: `git status` (should not show this file)
   - If accidentally committed, rotate ALL passwords

2. **Environment separation:**
   - Development uses different passwords (TestPassword123!)
   - Production uses secure random passwords
   - Never use production credentials in development

3. **Database access:**
   - Production database: CEO and lead developer only
   - Development database: All developers
   - Separate Neon projects for dev/staging/prod

---

## Password Recovery

### If Lab Admin Forgets Password

**Current process (SQL-based reset):**

```sql
-- 1. Generate new password with scripts/generate-passwords.ts
-- 2. Hash the password:
npx tsx scripts/hash-existing-passwords.ts "NewSecurePassword123!"

-- 3. Update database with the hash:
UPDATE "User"
SET "hashedPassword" = '<new_bcrypt_hash>',
    "updatedAt" = NOW()
WHERE email = 'lab1@pgtestinglab.com';

-- 4. Send new password to lab admin via secure channel (Signal, WhatsApp)
```

**Note:** Self-service password reset UI planned for post-MVP.

### If Client Forgets Password

**Current process (SQL-based reset):**

```sql
-- Reset to default demo password:
npx tsx scripts/generate-demo-passwords.ts

-- Copy the CLIENT hash and run:
UPDATE "User"
SET "hashedPassword" = '<client_demo_hash>',
    "updatedAt" = NOW()
WHERE email = 'client@example.com';

-- Password will be: ClientDemo123!
```

**Note:** Clients can also be given custom passwords using the LAB_ADMIN process above.

### If Admin Forgets Password

**Current process (SQL-based reset):**

```sql
-- Reset to default demo password:
npx tsx scripts/generate-demo-passwords.ts

-- Copy the ADMIN hash and run:
UPDATE "User"
SET "hashedPassword" = '<admin_demo_hash>',
    "updatedAt" = NOW()
WHERE email = 'admin@pipetgo.com';

-- Password will be: AdminDemo123!
```

---

## Compliance & Audit

### Password Storage

- **Algorithm:** bcrypt
- **Salt rounds:** 12 (cost factor)
- **Hash length:** 60 characters
- **Storage:** PostgreSQL TEXT field
- **Plain text:** Never stored, only hashes

### Access Logs

Monitor authentication attempts:
```sql
-- Query NextAuth sessions
SELECT
  "userId",
  "expires",
  "sessionToken"
FROM "Session"
WHERE "userId" IN (
  SELECT id FROM "User" WHERE role = 'LAB_ADMIN'
)
ORDER BY "expires" DESC;
```

### Security Audit Trail

Future enhancement: Log authentication events
- Failed login attempts
- Password changes
- Account lockouts after 5 failed attempts
- Geographic anomalies (different country)

---

## Regeneration Instructions

If credentials are compromised, regenerate immediately:

```bash
# 1. Generate new passwords
npx tsx scripts/generate-passwords.ts

# 2. Update this document with new plaintext passwords

# 3. Hash the new passwords
npx tsx scripts/hash-existing-passwords.ts

# 4. Update production database
# Copy SQL from script output to Neon console

# 5. Notify affected lab admins
# Send new passwords via secure channel

# 6. Verify new passwords work
# Test login at https://www.pipetgo.com/auth/signin
```

---

## Support & Troubleshooting

### Login Issues

**"Invalid email or password"**
- Verify email spelling (case-sensitive domain)
- Check if using correct password from this document
- Verify hashedPassword field in database is not NULL

**"500 Internal Server Error"**
- Check Vercel deployment logs
- Verify NEXTAUTH_SECRET environment variable set
- Check database connection string (DATABASE_URL)

**"Session expired"**
- Sessions last 30 days
- Sign in again to create new session

### Database Queries

**Check user exists:**
```sql
SELECT email, role, "hashedPassword" IS NOT NULL as has_password
FROM "User"
WHERE email = 'lab1@pgtestinglab.com';
```

**List all lab admins:**
```sql
SELECT email, name, "createdAt"
FROM "User"
WHERE role = 'LAB_ADMIN'
ORDER BY "createdAt" DESC;
```

---

## Document Version History

- **2025-12-04:** Verified credentials work with fully anonymized database (no changes needed)
- **2025-12-01:** Complete rewrite with all roles and comprehensive documentation
- **2025-11-29:** Initial version (lab admins only)

---

**⚠️ REMINDER:** This file contains sensitive credentials. Handle with extreme care.

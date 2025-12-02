-- Production Database Password Update Script
-- Generated: 2025-12-01
-- Purpose: Add hashed passwords to existing LAB_ADMIN accounts
--
-- ⚠️  CRITICAL INSTRUCTIONS:
-- 1. Run this in Neon production database console ONLY
-- 2. Verify users exist BEFORE running updates
-- 3. Test login with ONE account before proceeding with others
-- 4. Keep LAB_ACCOUNT_CREDENTIALS.md secure (never commit to git)
--
-- =============================================================================

-- STEP 1: Verify users exist in production database
-- Expected: 4 rows returned with LAB_ADMIN role and has_password = false
SELECT
  email,
  role,
  "hashedPassword" IS NOT NULL as has_password,
  "createdAt"
FROM "User"
WHERE email IN (
  'lab1@pgtestinglab.com',
  'lab2@pgtestlab.com',
  'lab3@pgtstlab.com',
  'lab4@testlabpg.com'
)
ORDER BY email;

-- If users DO NOT exist, create them first:
-- INSERT INTO "User" (id, email, name, role, "createdAt", "updatedAt")
-- VALUES
--   (gen_random_uuid(), 'lab1@pgtestinglab.com', 'Testing Lab 1 Admin', 'LAB_ADMIN', NOW(), NOW()),
--   (gen_random_uuid(), 'lab2@pgtestlab.com', 'Testing Lab 2 Admin', 'LAB_ADMIN', NOW(), NOW()),
--   (gen_random_uuid(), 'lab3@pgtstlab.com', 'Testing Lab 3 Admin', 'LAB_ADMIN', NOW(), NOW()),
--   (gen_random_uuid(), 'lab4@testlabpg.com', 'Testing Lab 4 Admin', 'LAB_ADMIN', NOW(), NOW());

-- =============================================================================

-- STEP 2: Update users with hashed passwords
-- Passwords are hashed with bcrypt (12 rounds) from LAB_ACCOUNT_CREDENTIALS.md

BEGIN;

UPDATE "User"
SET
  "hashedPassword" = '$2b$12$h/kWZYI1SIPahWOiWtprveXbw/Tzpgyr0wOaPik/kZvAb49UFl/YK',
  "updatedAt" = NOW()
WHERE email = 'lab1@pgtestinglab.com';

UPDATE "User"
SET
  "hashedPassword" = '$2b$12$/45QGazcH0DIKJfpi72GoeE/.I.Nk90sV/BSh2qJTR2n48h51R.sK',
  "updatedAt" = NOW()
WHERE email = 'lab2@pgtestlab.com';

UPDATE "User"
SET
  "hashedPassword" = '$2b$12$Mwev5yrkJvg7ffg3uGrpG.B2wsX7qFT/Akzl.IIgzkR6tXSAfOOqe',
  "updatedAt" = NOW()
WHERE email = 'lab3@pgtstlab.com';

UPDATE "User"
SET
  "hashedPassword" = '$2b$12$lRbw1CRpZaCTwU.V3yeMI.7pl5EVjOvgAHXCBMy94BKbmbl9hKNIC',
  "updatedAt" = NOW()
WHERE email = 'lab4@testlabpg.com';

COMMIT;

-- =============================================================================

-- STEP 3: Verify updates were successful
-- Expected: 4 rows with has_password = true
SELECT
  email,
  role,
  "hashedPassword" IS NOT NULL as has_password,
  "updatedAt"
FROM "User"
WHERE email IN (
  'lab1@pgtestinglab.com',
  'lab2@pgtestlab.com',
  'lab3@pgtstlab.com',
  'lab4@testlabpg.com'
)
ORDER BY email;

-- =============================================================================

-- STEP 4: Test login
-- 1. Go to https://www.pipetgo.com/auth/signin
-- 2. Use email: lab1@pgtestinglab.com
-- 3. Use password from LAB_ACCOUNT_CREDENTIALS.md
-- 4. Verify successful login
-- 5. If successful, credentials are now working!

-- =============================================================================

-- ROLLBACK (if needed):
-- If something goes wrong, run this to remove passwords:
--
-- BEGIN;
-- UPDATE "User" SET "hashedPassword" = NULL WHERE email IN (
--   'lab1@pgtestinglab.com',
--   'lab2@pgtestlab.com',
--   'lab3@pgtstlab.com',
--   'lab4@testlabpg.com'
-- );
-- COMMIT;

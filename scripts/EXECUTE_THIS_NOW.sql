-- ============================================================================
-- FINAL FIX: Just run this ONE script
-- ============================================================================
-- Since users already exist (you got "duplicate key" error),
-- we only need to ADD PASSWORDS to existing users.
--
-- This is IDEMPOTENT - safe to run multiple times
-- ============================================================================

-- Add password for lab1@pgtestinglab.com
UPDATE users
SET
  "hashedPassword" = '$2b$12$h/kWZYI1SIPahWOiWtprveXbw/Tzpgyr0wOaPik/kZvAb49UFl/YK',
  "updatedAt" = NOW()
WHERE email = 'lab1@pgtestinglab.com';

-- Add password for lab2@pgtestlab.com
UPDATE users
SET
  "hashedPassword" = '$2b$12$/45QGazcH0DIKJfpi72GoeE/.I.Nk90sV/BSh2qJTR2n48h51R.sK',
  "updatedAt" = NOW()
WHERE email = 'lab2@pgtestlab.com';

-- Add password for lab3@pgtstlab.com
UPDATE users
SET
  "hashedPassword" = '$2b$12$Mwev5yrkJvg7ffg3uGrpG.B2wsX7qFT/Akzl.IIgzkR6tXSAfOOqe',
  "updatedAt" = NOW()
WHERE email = 'lab3@pgtstlab.com';

-- Add password for lab4@testlabpg.com
UPDATE users
SET
  "hashedPassword" = '$2b$12$lRbw1CRpZaCTwU.V3yeMI.7pl5EVjOvgAHXCBMy94BKbmbl9hKNIC',
  "updatedAt" = NOW()
WHERE email = 'lab4@testlabpg.com';

-- ============================================================================
-- Expected output: Four "UPDATE 1" messages (one per user)
-- If you see "UPDATE 0" for any user, that email doesn't exist
-- ============================================================================

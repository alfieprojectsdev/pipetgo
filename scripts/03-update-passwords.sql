-- STEP 2B/3: Update users with hashed passwords
-- Run this after confirming users exist (from step 1 or 2A)

-- This is IDEMPOTENT - safe to run multiple times
-- If password already set, it will just update to the same value

UPDATE users
SET
  "hashedPassword" = '$2b$12$h/kWZYI1SIPahWOiWtprveXbw/Tzpgyr0wOaPik/kZvAb49UFl/YK',
  "updatedAt" = NOW()
WHERE email = 'lab1@pgtestinglab.com';

UPDATE users
SET
  "hashedPassword" = '$2b$12$/45QGazcH0DIKJfpi72GoeE/.I.Nk90sV/BSh2qJTR2n48h51R.sK',
  "updatedAt" = NOW()
WHERE email = 'lab2@pgtestlab.com';

UPDATE users
SET
  "hashedPassword" = '$2b$12$Mwev5yrkJvg7ffg3uGrpG.B2wsX7qFT/Akzl.IIgzkR6tXSAfOOqe',
  "updatedAt" = NOW()
WHERE email = 'lab3@pgtstlab.com';

UPDATE users
SET
  "hashedPassword" = '$2b$12$lRbw1CRpZaCTwU.V3yeMI.7pl5EVjOvgAHXCBMy94BKbmbl9hKNIC',
  "updatedAt" = NOW()
WHERE email = 'lab4@testlabpg.com';

-- NOTE: No BEGIN/COMMIT needed
-- Neon auto-commits each statement
-- This makes it safer - partial success is OK

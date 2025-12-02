-- STEP 1: Check if users exist
-- Run this FIRST to see what we're working with

SELECT
  email,
  role,
  "hashedPassword" IS NOT NULL as has_password,
  "createdAt"
FROM users
WHERE email IN (
  'lab1@pgtestinglab.com',
  'lab2@pgtestlab.com',
  'lab3@pgtstlab.com',
  'lab4@testlabpg.com'
)
ORDER BY email;

-- Expected outcomes:
-- A) 4 rows returned → Users exist, proceed to 02-update-passwords.sql
-- B) 0 rows returned → Users DON'T exist, proceed to 02-create-users.sql
-- C) 1-3 rows returned → Some exist, decide which to create/update

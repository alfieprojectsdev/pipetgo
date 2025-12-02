-- Check current database state after password updates

-- 1. Verify all 4 users exist with passwords
SELECT
  email,
  role,
  "hashedPassword" IS NOT NULL as has_password,
  LEFT("hashedPassword", 15) as hash_start,
  "updatedAt"
FROM users
WHERE email IN (
  'lab1@pgtestinglab.com',
  'lab2@pgtestlab.com',
  'lab3@pgtstlab.com',
  'lab4@testlabpg.com'
)
ORDER BY email;

-- Expected: 4 rows, all with has_password = true, hash_start = '$2b$12$...'

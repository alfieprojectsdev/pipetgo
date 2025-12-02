-- STEP 4: Verify passwords were added successfully

SELECT
  email,
  role,
  "hashedPassword" IS NOT NULL as has_password,
  LEFT("hashedPassword", 10) as hash_preview,
  "updatedAt"
FROM users
WHERE email IN (
  'lab1@pgtestinglab.com',
  'lab2@pgtestlab.com',
  'lab3@pgtstlab.com',
  'lab4@testlabpg.com'
)
ORDER BY email;

-- Expected result:
-- 4 rows with:
--   has_password = true
--   hash_preview = $2b$12$...
--   updatedAt = recent timestamp

-- If has_password = false for any row, re-run 03-update-passwords.sql

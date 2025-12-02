-- STEP 2A: Create users (ONLY if they don't exist)
-- Run this ONLY if 01-check-users-exist.sql returned 0 rows

-- This creates the 4 lab admin users without passwords
-- We'll add passwords in the next step

INSERT INTO users (id, email, name, role, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'lab1@pgtestinglab.com', 'Testing Lab 1 Admin', 'LAB_ADMIN', NOW(), NOW()),
  (gen_random_uuid(), 'lab2@pgtestlab.com', 'Testing Lab 2 Admin', 'LAB_ADMIN', NOW(), NOW()),
  (gen_random_uuid(), 'lab3@pgtstlab.com', 'Testing Lab 3 Admin', 'LAB_ADMIN', NOW(), NOW()),
  (gen_random_uuid(), 'lab4@testlabpg.com', 'Testing Lab 4 Admin', 'LAB_ADMIN', NOW(), NOW());

-- After running, verify with:
-- SELECT email, role FROM users WHERE role = 'LAB_ADMIN' ORDER BY email;

============================================================
DEMO PASSWORD BCRYPT HASHES
============================================================

ADMIN Role:
  Password: AdminDemo123!
  Hash: $2b$12$Dlc83fzfhCw2epwaR6j9g.bJDW0atb5YUr0T.DM0FY30AqWC0o3Fy

CLIENT Role:
  Password: ClientDemo123!
  Hash: $2b$12$nev6TyKjOuMcP3FsYHyUmOuoNrCwD5BAVYfhdeGO7NXSV23SlX/ka

============================================================
SQL UPDATE STATEMENTS (for Neon Console)
============================================================

-- Update ADMIN account
UPDATE "User"
SET "hashedPassword" = '$2b$12$JO2SWzwVirYqGKWgr.F57uOMZB/IBqmWkBFUMhmbjATKoGPZdEQlq',
    "updatedAt" = NOW()
WHERE email = 'admin@pipetgo.com';

-- Update CLIENT account (demo client 1)
UPDATE "User"
SET "hashedPassword" = '$2b$12$ozSqAwn0M9G2jiYx2v6kReIGG2J8S4xLU3C4LcmJNthjiabpgCvTS',
    "updatedAt" = NOW()
WHERE email = 'client@example.com';

-- Verify changes
SELECT email, role, "hashedPassword" IS NOT NULL as has_password
FROM "User"
WHERE email IN ('admin@pipetgo.com', 'client@example.com')
ORDER BY role;

============================================================

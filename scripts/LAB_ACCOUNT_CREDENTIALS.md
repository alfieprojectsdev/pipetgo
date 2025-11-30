# Lab Account Credentials - CONFIDENTIAL

**Generated:** 2025-11-29
**For:** CEO Distribution Only
**Security:** Keep in secure password manager - DO NOT commit to git

---

## Lab Administrator Accounts

### Testing Lab 1
- **Email:** lab1@pgtestinglab.com
- **Password:** HSmgGnbBcZ!zRsGQsnDkNHnu
- **Status:** Active

### Testing Lab 2
- **Email:** lab2@pgtestlab.com
- **Password:** f3iCMaNunBqNB6AzBf7bnFyR
- **Status:** Active

### Testing Lab 3
- **Email:** lab3@pgtstlab.com
- **Password:** W4!cTAV@Gs2vNLE9@VEHCUDz
- **Status:** Active

### Testing Lab 4
- **Email:** lab4@testlabpg.com
- **Password:** rY!hXsCWvUHbf8e65QwveYPG
- **Status:** Active

---

## Distribution Instructions

1. **IMMEDIATELY** copy these credentials to your secure password manager (e.g., 1Password, LastPass)
2. **DELETE** this file after copying (it should NOT be committed to git)
3. Distribute credentials to lab admins via secure channels only:
   - Encrypted email
   - Signal/WhatsApp
   - In-person handoff
4. Instruct each lab admin to:
   - Change password on first login (feature to be implemented)
   - Enable 2FA if available (future feature)
   - Never share credentials with others

---

## Security Notes

- These passwords were generated using cryptographically secure random bytes
- Each password is 24 characters with mixed case, numbers, and special characters
- Passwords are hashed with bcrypt (12 rounds) in the database
- Client and Platform Admin accounts use email-only authentication (no passwords)

---

## Regeneration

If credentials are compromised, regenerate by running:

```bash
npx tsx scripts/generate-passwords.ts
```

Then update the hashed passwords in `prisma/seed.ts` and re-seed the database.

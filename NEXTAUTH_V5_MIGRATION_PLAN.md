# NextAuth v5 (Auth.js) Migration Plan

**Status:** Login working with v4 (without rate limiting)
**Goal:** Migrate to NextAuth v5 with rate limiting restored
**Timeline:** This week
**Estimated Effort:** 3-4 hours

---

## Why Migrate to v5?

✅ Native Next.js App Router support
✅ Better TypeScript support
✅ Cleaner API design
✅ Active development and future-proof
✅ Can use custom handlers without compatibility issues
✅ Better error messages

---

## Migration Checklist

### Phase 1: Preparation (30 minutes)

- [ ] Read NextAuth v5 docs: https://authjs.dev/getting-started/migrating-to-v5
- [ ] Review breaking changes: https://authjs.dev/guides/upgrade-to-v5
- [ ] Back up current working code:
  ```bash
  git checkout -b backup-nextauth-v4
  git push -u origin backup-nextauth-v4
  git checkout main
  ```
- [ ] Create feature branch:
  ```bash
  git checkout -b feature/migrate-nextauth-v5
  ```

### Phase 2: Update Dependencies (10 minutes)

- [ ] Update package.json:
  ```bash
  npm install next-auth@beta @auth/prisma-adapter@latest
  ```
- [ ] Update Prisma schema if needed (v5 has some schema changes)
- [ ] Run database migration if schema changed:
  ```bash
  npm run db:push
  ```

### Phase 3: Update Auth Configuration (1 hour)

**File:** `src/lib/auth.ts`

**Current v4 structure:**
```typescript
import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
  // config here
}
```

**New v5 structure:**
```typescript
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      // credentials config
    })
  ],
  callbacks: {
    // callbacks
  }
})
```

**Key Changes:**
- ❌ Remove `NextAuthOptions` type
- ❌ Remove `getServerSession` (use `auth()` instead)
- ✅ Use new `NextAuth()` return object destructuring
- ✅ Update adapter import to `@auth/prisma-adapter`
- ✅ `CredentialsProvider` → `Credentials` (no Provider suffix)

**Migration Steps:**

1. Update imports:
   ```typescript
   import NextAuth from "next-auth"
   import Credentials from "next-auth/providers/credentials"
   import { PrismaAdapter } from "@auth/prisma-adapter"
   import { prisma } from "@/lib/db"
   ```

2. Convert authOptions to auth config:
   ```typescript
   export const { handlers, auth, signIn, signOut } = NextAuth({
     adapter: PrismaAdapter(prisma),
     session: { strategy: "jwt" }, // or "database"
     providers: [
       Credentials({
         name: "credentials",
         credentials: {
           email: { label: "Email", type: "email" },
           password: { label: "Password", type: "password" }
         },
         async authorize(credentials) {
           // Same logic as before
           return user // or null
         }
       })
     ],
     callbacks: {
       async jwt({ token, user }) {
         // Same as before
         return token
       },
       async session({ session, token }) {
         // Same as before
         return session
       }
     },
     pages: {
       signIn: '/auth/signin',
     }
   })
   ```

3. Export auth helpers for server components:
   ```typescript
   // Export for use in server components
   export { auth as getServerSession }
   ```

### Phase 4: Update API Route (15 minutes)

**File:** `src/app/api/auth/[...nextauth]/route.ts`

**Current v4:**
```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

**New v5:**
```typescript
import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers
```

**With Rate Limiting (works in v5!):**
```typescript
import { handlers } from "@/lib/auth"
import { NextRequest } from "next/server"
import {
  loginRateLimiter,
  getClientIp,
  checkRateLimit,
  createRateLimitResponse
} from "@/lib/rate-limit"

// GET handler doesn't need rate limiting
export const { GET } = handlers

// Custom POST handler with rate limiting
export async function POST(req: NextRequest) {
  // Rate limit check
  const url = new URL(req.url)
  const isSigninCallback = url.pathname.includes('/callback/credentials')

  if (isSigninCallback) {
    const ip = getClientIp(req)
    const rateLimit = await checkRateLimit(loginRateLimiter, ip)

    if (rateLimit && !rateLimit.success) {
      return createRateLimitResponse(rateLimit.retryAfter!)
    }
  }

  // Call NextAuth v5 handler
  return handlers.POST(req)
}
```

### Phase 5: Update Server Components (30 minutes)

**Find all usages:**
```bash
grep -r "getServerSession" src/ --include="*.ts" --include="*.tsx"
```

**Current v4:**
```typescript
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const session = await getServerSession(authOptions)
```

**New v5:**
```typescript
import { auth } from "@/lib/auth"

const session = await auth()
```

**Files to update:**
- `src/app/dashboard/*/page.tsx` (all dashboard pages)
- Any server actions that check auth
- Any API routes that check session

### Phase 6: Update Client Components (30 minutes)

**Client hooks mostly stay the same:**

```typescript
import { useSession } from "next-auth/react"

const { data: session, status } = useSession()
```

**But SessionProvider import changes:**

**Current v4:**
```typescript
import { SessionProvider } from "next-auth/react"
```

**New v5:**
```typescript
import { SessionProvider } from "next-auth/react"
// Same import, no changes needed
```

**Root layout stays the same:**
```typescript
<SessionProvider>{children}</SessionProvider>
```

### Phase 7: Update Sign In/Sign Out (15 minutes)

**Current v4:**
```typescript
import { signIn, signOut } from "next-auth/react"

// Client components
await signIn("credentials", { email, password })
await signOut()
```

**New v5 (same for client):**
```typescript
import { signIn, signOut } from "next-auth/react"

// No changes for client components
await signIn("credentials", { email, password })
await signOut()
```

**Server actions:**
```typescript
import { signIn, signOut } from "@/lib/auth"

// Can now use in server actions
await signIn("credentials", { email, password, redirect: false })
await signOut()
```

### Phase 8: Testing (1 hour)

- [ ] Test sign in with valid credentials
- [ ] Test sign in with invalid credentials
- [ ] Test session persistence
- [ ] Test sign out
- [ ] Test protected routes (redirects)
- [ ] Test API routes that check session
- [ ] Test rate limiting (6 failed attempts)
- [ ] Run all existing tests:
  ```bash
  npm run test:run
  ```
- [ ] Run type check:
  ```bash
  npm run type-check
  ```

### Phase 9: Deploy to Preview (15 minutes)

- [ ] Commit changes:
  ```bash
  git add -A
  git commit -m "feat: migrate to NextAuth v5 with rate limiting restored"
  ```
- [ ] Push to branch:
  ```bash
  git push -u origin feature/migrate-nextauth-v5
  ```
- [ ] Test on Vercel preview deployment
- [ ] Verify environment variables still work

### Phase 10: Deploy to Production (15 minutes)

- [ ] Create pull request
- [ ] Review changes one more time
- [ ] Merge to main
- [ ] Monitor production deployment
- [ ] Test production login
- [ ] Monitor error logs for 24 hours

---

## Breaking Changes to Watch For

### 1. Session Type Changes

**v4:**
```typescript
session.user.id  // Might not exist by default
```

**v5:**
```typescript
session.user.id  // Need to add via JWT callback
```

**Fix:** Update JWT callback to include user.id in token.

### 2. Redirect Behavior

v5 handles redirects slightly differently. Test all redirect flows.

### 3. Error Handling

Error messages are more detailed in v5. Update error handling if needed.

---

## Rollback Plan

If something goes wrong:

```bash
# Revert to v4
git checkout main
git reset --hard origin/main

# Or use backup branch
git checkout backup-nextauth-v4
git checkout -b main-restore
git push -f origin main-restore:main
```

---

## Testing Checklist

After migration, test these scenarios:

### Auth Flow
- [ ] Sign in with valid email/password
- [ ] Sign in with invalid email
- [ ] Sign in with invalid password
- [ ] Sign out
- [ ] Session persists across page reloads
- [ ] Session expires after timeout

### Role-Based Access
- [ ] CLIENT role can access client dashboard
- [ ] LAB_ADMIN role can access lab dashboard
- [ ] ADMIN role can access admin dashboard
- [ ] Users can't access dashboards for other roles

### API Protection
- [ ] Protected API routes return 401 without session
- [ ] Protected API routes work with valid session
- [ ] API routes check role permissions

### Rate Limiting (After Re-enabled)
- [ ] 5 failed logins allowed
- [ ] 6th failed login returns 429
- [ ] Rate limit resets after 15 minutes
- [ ] Successful login doesn't count toward limit

---

## Common Issues and Solutions

### Issue 1: "Cannot find module '@auth/prisma-adapter'"

**Solution:**
```bash
npm install @auth/prisma-adapter@latest
```

### Issue 2: TypeScript errors on session.user.id

**Solution:** Update JWT callback:
```typescript
jwt({ token, user }) {
  if (user) {
    token.id = user.id
    token.role = user.role
  }
  return token
}
```

### Issue 3: Rate limiting breaks after migration

**Solution:** Ensure custom POST handler properly calls `handlers.POST(req)`

---

## Resources

- NextAuth v5 Docs: https://authjs.dev
- Migration Guide: https://authjs.dev/getting-started/migrating-to-v5
- API Reference: https://authjs.dev/reference/core
- Example App: https://github.com/nextauthjs/next-auth-example

---

## Timeline

**Day 1 (2-3 hours):**
- Phases 1-7: Update code

**Day 2 (1 hour):**
- Phase 8: Testing

**Day 3 (30 minutes):**
- Phases 9-10: Deploy

**Total: 3.5-4.5 hours**

---

## Success Criteria

✅ All existing auth functionality works
✅ Rate limiting restored and working
✅ All tests pass
✅ No TypeScript errors
✅ Production deployment successful
✅ No error spikes in logs

---

**Next Step:** Start Phase 1 when ready to begin migration this week.

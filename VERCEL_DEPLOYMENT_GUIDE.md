# Vercel Deployment & DNS Setup Guide

## Domain: pipetgo.com

---

## Recommended Subdomain Structure

### Production Environment
- **Domain:** `pipetgo.com` (root domain)
- **Alternative:** `app.pipetgo.com` (if you want root for marketing site)
- **Purpose:** Live production application for end users

### Staging/Preview Environment
- **Domain:** `staging.pipetgo.com` or `preview.pipetgo.com`
- **Purpose:** Pre-production testing, client demos, QA

### Development Environment
- **Domain:** `dev.pipetgo.com`
- **Purpose:** Development testing, experimental features

### API Documentation (Optional)
- **Domain:** `docs.pipetgo.com`
- **Purpose:** API documentation, developer guides

### Admin Dashboard (Optional)
- **Domain:** `admin.pipetgo.com`
- **Purpose:** Separate admin interface (if needed)

---

## Recommended Setup

**Best Practice Structure:**
```
pipetgo.com              → Production app (Vercel main branch)
staging.pipetgo.com      → Staging app (Vercel preview deployments)
dev.pipetgo.com          → Development app (Vercel development branch)
docs.pipetgo.com         → Documentation (optional)
api.pipetgo.com          → API endpoints (if separating from main app)
```

**Alternative (if using root for marketing):**
```
pipetgo.com              → Marketing landing page
app.pipetgo.com          → Production app
staging.pipetgo.com      → Staging app
dev.pipetgo.com          → Development app
```

---

## Part 1: Deploy to Vercel

### Step 1: Connect GitHub Repository

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/new
   - Sign in with GitHub

2. **Import PipetGo Repository:**
   - Click "Import Git Repository"
   - Select: `alfieprojectsdev/pipetgo`
   - Click "Import"

3. **Configure Project:**
   ```
   Project Name: pipetgo
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install --legacy-peer-deps
   ```

4. **Add Environment Variables:**
   Click "Environment Variables" and add these:

   **Production Variables:**
   ```env
   DATABASE_URL=postgresql://neondb_owner:npg_whN0LTIer1OS@ep-withered-tree-a17pkftr-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

   NEXTAUTH_SECRET=0s9JQtXNbLOgUZu0EXtYvZMNpUoVdkVMeIF/BSX7QiE=

   NEXTAUTH_URL=https://pipetgo.com

   NODE_ENV=production

   SEMAPHORE_API_KEY=4ec1df4c3c63ec62f782d0b787a5f641
   ```

   **Important:** Set environment to "Production" for all variables above.

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - You'll get a deployment URL like: `pipetgo.vercel.app`

---

### Step 2: Set Up Multiple Environments (Optional)

**For Staging Environment:**

1. Go to Vercel Dashboard → Project Settings → Domains
2. Add environment variables for "Preview" environment:
   ```env
   NEXTAUTH_URL=https://staging.pipetgo.com
   DATABASE_URL=[use staging database if separate]
   ```

**For Development Environment:**

1. Create a separate Vercel project: `pipetgo-dev`
2. Connect to `dev` or `development` branch
3. Set environment variables:
   ```env
   NEXTAUTH_URL=https://dev.pipetgo.com
   DATABASE_URL=[use dev database]
   ```

---

## Part 2: Configure Custom Domain on Vercel

### Step 1: Add Domain to Vercel

1. **Go to Project Settings:**
   - Vercel Dashboard → Your Project → Settings → Domains

2. **Add Primary Domain:**
   - Enter: `pipetgo.com`
   - Click "Add"
   - Vercel will show DNS configuration needed

3. **Add Subdomains:**
   - Click "Add Domain"
   - Enter: `staging.pipetgo.com`
   - Click "Add"
   - Repeat for: `dev.pipetgo.com`

**Vercel will provide DNS records like:**
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: CNAME
Name: staging
Value: cname.vercel-dns.com

Type: CNAME
Name: dev
Value: cname.vercel-dns.com
```

---

## Part 3: Configure DNS on Porkbun

### Step 1: Access Porkbun DNS Management

1. **Login to Porkbun:**
   - Visit: https://porkbun.com/account/domainsSpeedy
   - Sign in with your account

2. **Navigate to DNS:**
   - Find: `pipetgo.com`
   - Click "DNS" or "Manage"

---

### Step 2: Add DNS Records

**Delete any existing A/CNAME records first (if present)**

#### Record 1: Root Domain (Production)
```
Type: A
Host: @ (or leave blank)
Answer: 76.76.21.21
TTL: 600
```

#### Record 2: WWW Subdomain
```
Type: CNAME
Host: www
Answer: cname.vercel-dns.com
TTL: 600
```

#### Record 3: Staging Subdomain
```
Type: CNAME
Host: staging
Answer: cname.vercel-dns.com
TTL: 600
```

#### Record 4: Development Subdomain
```
Type: CNAME
Host: dev
Answer: cname.vercel-dns.com
TTL: 600
```

#### Record 5: Optional - Docs Subdomain
```
Type: CNAME
Host: docs
Answer: cname.vercel-dns.com
TTL: 600
```

---

### Step 3: Verify DNS Configuration

**Wait 5-10 minutes for DNS propagation**, then verify:

```bash
# Check root domain
dig pipetgo.com

# Check staging subdomain
dig staging.pipetgo.com

# Check dev subdomain
dig dev.pipetgo.com

# Alternative using nslookup
nslookup pipetgo.com
nslookup staging.pipetgo.com
nslookup dev.pipetgo.com
```

**Expected output:**
- Root domain should resolve to `76.76.21.21`
- Subdomains should resolve to `cname.vercel-dns.com`

---

## Part 4: Configure SSL Certificates (Automatic)

Vercel automatically provisions SSL certificates via Let's Encrypt.

**Verification:**
1. Go to Vercel Dashboard → Domains
2. Wait for "SSL Certificate Provisioning" to complete (~5-10 minutes)
3. Status should show: ✅ Valid Certificate

**Force HTTPS (Recommended):**
1. Vercel Dashboard → Project Settings → General
2. Scroll to "Force HTTPS"
3. Toggle ON

---

## Part 5: Update Application URLs

### Update Environment Variables

After DNS is configured, update Vercel environment variables:

1. **Production:**
   ```env
   NEXTAUTH_URL=https://pipetgo.com
   ```

2. **Staging (if using):**
   ```env
   NEXTAUTH_URL=https://staging.pipetgo.com
   ```

3. **Development (if using):**
   ```env
   NEXTAUTH_URL=https://dev.pipetgo.com
   ```

4. **Redeploy:**
   - Vercel Dashboard → Deployments
   - Click "..." on latest deployment
   - Click "Redeploy"

---

## Part 6: Verification Checklist

### Production Deployment
- [ ] Visit `https://pipetgo.com` - loads without errors
- [ ] SSL certificate shows as valid (🔒 in browser)
- [ ] Sign in functionality works
- [ ] Database connection successful
- [ ] No console errors in browser DevTools

### Staging Deployment (if configured)
- [ ] Visit `https://staging.pipetgo.com`
- [ ] Separate from production (different database)
- [ ] SSL certificate valid

### Development Deployment (if configured)
- [ ] Visit `https://dev.pipetgo.com`
- [ ] Separate from production
- [ ] SSL certificate valid

### DNS Propagation
- [ ] `dig pipetgo.com` resolves to Vercel IP
- [ ] `dig staging.pipetgo.com` resolves to `cname.vercel-dns.com`
- [ ] `dig dev.pipetgo.com` resolves to `cname.vercel-dns.com`
- [ ] All subdomains accessible via HTTPS

---

## Troubleshooting

### Issue: "Domain not found" after 24 hours

**Solution:**
1. Check Porkbun nameservers are correct
2. Verify DNS records have no typos
3. Try flushing local DNS cache:
   ```bash
   sudo systemd-resolve --flush-caches  # Linux
   ```

### Issue: SSL Certificate not provisioning

**Solution:**
1. Wait 10-15 minutes for Let's Encrypt
2. Verify DNS records point to Vercel
3. Remove and re-add domain in Vercel

### Issue: NextAuth errors on production

**Solution:**
1. Verify `NEXTAUTH_URL` matches actual domain
2. Check `NEXTAUTH_SECRET` is set (not the dev secret)
3. Redeploy after changing environment variables

### Issue: Database connection errors

**Solution:**
1. Verify `DATABASE_URL` uses production credentials
2. Check Neon database is not paused (free tier auto-pauses)
3. Test connection from Vercel serverless function logs

---

## Branch-Based Deployments (Recommended)

### Automatic Deployments by Branch

**Main Branch → Production:**
```
Branch: main
Domain: pipetgo.com
Environment: Production
Database: Production NeonDB
```

**Staging Branch → Staging:**
```
Branch: staging
Domain: staging.pipetgo.com
Environment: Preview
Database: Staging NeonDB (optional)
```

**Dev Branch → Development:**
```
Branch: dev
Domain: dev.pipetgo.com
Environment: Development
Database: Development NeonDB
```

**Configuration:**
1. Vercel Dashboard → Project Settings → Git
2. Enable "Automatic Deployments from Git"
3. Configure branch mappings:
   - `main` → Production
   - `staging` → Preview (staging.pipetgo.com)
   - `dev` → Development (dev.pipetgo.com)

---

## Post-Deployment Monitoring

### Vercel Analytics
1. Enable in: Vercel Dashboard → Analytics
2. Track: Page views, performance, errors

### Error Tracking
Consider adding Sentry:
```env
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### Performance Monitoring
Vercel provides built-in metrics:
- Response times
- Cold starts
- Error rates

---

## Deployment Workflow

### Development → Staging → Production

```bash
# 1. Work on feature in dev branch
git checkout dev
git commit -m "feat: new feature"
git push origin dev
# Automatically deploys to dev.pipetgo.com

# 2. Merge to staging for testing
git checkout staging
git merge dev
git push origin staging
# Automatically deploys to staging.pipetgo.com

# 3. After QA approval, deploy to production
git checkout main
git merge staging
git push origin main
# Automatically deploys to pipetgo.com
```

---

## Quick Reference: DNS Records

| Type  | Host    | Answer/Value           | Purpose             |
|-------|---------|------------------------|---------------------|
| A     | @       | 76.76.21.21            | Root domain         |
| CNAME | www     | cname.vercel-dns.com   | www subdomain       |
| CNAME | staging | cname.vercel-dns.com   | Staging environment |
| CNAME | dev     | cname.vercel-dns.com   | Dev environment     |
| CNAME | docs    | cname.vercel-dns.com   | Documentation (opt) |

---

## Environment Variables Checklist

### Production (`pipetgo.com`)
- [x] `DATABASE_URL` - Production database
- [x] `NEXTAUTH_SECRET` - Production secret
- [x] `NEXTAUTH_URL` - https://pipetgo.com
- [x] `NODE_ENV` - production
- [ ] `SENDGRID_API_KEY` - (when ready)
- [ ] `SENTRY_DSN` - (when ready)

### Staging (`staging.pipetgo.com`)
- [ ] `DATABASE_URL` - Staging database (or use dev)
- [ ] `NEXTAUTH_SECRET` - Staging secret
- [ ] `NEXTAUTH_URL` - https://staging.pipetgo.com
- [ ] `NODE_ENV` - staging

### Development (`dev.pipetgo.com`)
- [ ] `DATABASE_URL` - Development database
- [ ] `NEXTAUTH_SECRET` - Development secret
- [ ] `NEXTAUTH_URL` - https://dev.pipetgo.com
- [ ] `NODE_ENV` - development

---

**Last Updated:** 2025-11-08
**Next Steps:**
1. Deploy to Vercel
2. Configure DNS on Porkbun
3. Wait for SSL provisioning
4. Test production deployment

**Related Docs:**
- `NEONDB_DEPLOYMENT_GUIDE.md` - Database deployment
- `docs/DEPLOYMENT_CHECKLIST.md` - Full deployment process

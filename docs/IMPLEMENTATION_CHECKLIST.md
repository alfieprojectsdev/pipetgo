# PipetGo MVP - Implementation Checklist

Use this checklist to track your implementation progress. Mark items as complete as you build them.

## ✅ Phase 1: Foundation (COMPLETED)

- [x] TypeScript types (`src/types/index.ts`)
- [x] Validation schemas (`src/lib/validations/`)
  - [x] `auth.ts` - Authentication schemas
  - [x] `order.ts` - Order creation/update schemas
  - [x] `service.ts` - Service filtering schemas
  - [x] `lab.ts` - Lab management schemas
- [x] Core utilities (`src/lib/`)
  - [x] `auth.ts` - NextAuth configuration
  - [x] `db.ts` - Prisma singleton
  - [x] `utils.ts` - Helper functions
  - [x] `hooks/useOrders.ts` - Order data hooks
- [x] Base UI components (`src/components/ui/`)
  - [x] `button.tsx` (existing)
  - [x] `card.tsx` (existing)
  - [x] `input.tsx`
  - [x] `label.tsx`
  - [x] `textarea.tsx`
  - [x] `select.tsx`
  - [x] `badge.tsx`
  - [x] `alert.tsx`

## 📝 Phase 2: Feature Components

### Order Components (`src/components/features/orders/`)

- [ ] `order-status-badge.tsx`
  - Displays order status with color-coding
  - Uses Badge component + getStatusColor utility
  - Props: `{ status: OrderStatus }`

- [ ] `order-card.tsx`
  - Summary card for order listings
  - Shows: service name, status, lab, dates, price
  - Props: `{ order: Order }`
  - Includes link to order details

- [ ] `order-list.tsx`
  - Grid/list of OrderCard components
  - Handles empty state
  - Props: `{ orders: Order[] }`

- [ ] `order-details.tsx`
  - Full order information display
  - Shows all fields + attachments
  - Props: `{ order: OrderWithRelations }`

- [ ] `order-status-updater.tsx` (Lab Admin only)
  - Dropdown to change order status
  - Validates status transitions
  - Props: `{ orderId: string, currentStatus: OrderStatus }`

### Service Components (`src/components/features/services/`)

- [ ] `service-card.tsx`
  - Service listing card for homepage
  - Shows: name, lab, category, price, turnaround
  - "Request Test" button
  - Props: `{ service: ServiceWithLab }`

- [ ] `service-list.tsx`
  - Grid of ServiceCard components
  - Handles loading/empty states
  - Props: `{ services: ServiceWithLab[] }`

- [ ] `service-filter.tsx`
  - Category filter dropdown
  - Price range inputs (optional for MVP)
  - Props: `{ onFilterChange: (filters) => void }`

### Dashboard Components (`src/components/features/dashboard/`)

- [ ] `stats-card.tsx`
  - Reusable metric card
  - Props: `{ title: string, value: number | string, icon?: ReactNode }`

- [ ] `recent-orders-widget.tsx`
  - Shows 5 most recent orders
  - Different view for client vs lab
  - Props: `{ orders: Order[] }`

- [ ] `dashboard-header.tsx`
  - Welcome message with user name
  - Role-specific greeting
  - Props: `{ user: User }`

### Authentication Components (`src/components/features/auth/`)

- [ ] `signin-form.tsx`
  - Email input (password for Stage 2)
  - Submit button with loading state
  - Error display
  - Link to signup

- [ ] `signup-form.tsx`
  - Name, email, role selection
  - Password for Stage 2
  - Terms checkbox (optional)
  - Link to signin

- [ ] `auth-guard.tsx`
  - HOC/wrapper for protected routes
  - Redirects if not authenticated
  - Role-based access control
  - Props: `{ children, allowedRoles?: UserRole[] }`

## 🔌 Phase 3: API Routes

### Orders API (`src/app/api/orders/`)

- [ ] `route.ts` - List and create orders
  - **GET** `/api/orders`
    - Returns orders filtered by user role
    - Client: their orders only
    - Lab Admin: their lab's orders
    - Admin: all orders
    - Query params: `?status=PENDING&page=1`

  - **POST** `/api/orders`
    - Creates new order
    - Validates with `createOrderSchema`
    - Sets initial status to PENDING
    - Returns created order with relations

- [ ] `[id]/route.ts` - Get and update single order
  - **GET** `/api/orders/:id`
    - Returns order with full relations
    - Checks user has permission to view

  - **PATCH** `/api/orders/:id`
    - Updates order status (Lab Admin only)
    - Validates status transitions
    - Sets timestamp fields (acknowledgedAt, completedAt)
    - Returns updated order

### Services API (`src/app/api/services/`)

- [ ] `route.ts` - List and create services
  - **GET** `/api/services`
    - Returns active services by default
    - Supports filtering by category, labId
    - Includes lab information
    - Public endpoint (no auth required)

  - **POST** `/api/services` (Lab Admin only)
    - Creates new service for their lab
    - Validates with `serviceSchema`
    - Returns created service

- [ ] `[id]/route.ts` - Get, update, delete service
  - **GET** `/api/services/:id`
    - Returns single service with lab info
    - Public endpoint

  - **PATCH** `/api/services/:id` (Lab Admin only)
    - Updates service details
    - Can toggle active status

  - **DELETE** `/api/services/:id` (Lab Admin only)
    - Soft delete (set active = false)

### Labs API (`src/app/api/labs/`)

- [ ] `route.ts` - List and create labs
  - **GET** `/api/labs`
    - Returns all labs (public)
    - Include services count

  - **POST** `/api/labs` (Lab Admin only)
    - Creates lab profile
    - Associates with logged-in user

- [ ] `[id]/route.ts` - Get and update lab
  - **GET** `/api/labs/:id`
    - Returns lab with services
    - Public endpoint

  - **PATCH** `/api/labs/:id` (Lab Admin only)
    - Updates lab profile
    - Owner only

### Users API (`src/app/api/users/`)

- [ ] `route.ts` - User registration
  - **POST** `/api/users`
    - Creates new user account
    - Validates with `signUpSchema`
    - Hashes password (Stage 2)
    - Returns user (without password)

- [ ] `[id]/route.ts` - Get and update user
  - **GET** `/api/users/:id` (Admin or self)
    - Returns user profile

  - **PATCH** `/api/users/:id` (Self only)
    - Updates user profile
    - Cannot change role

## 🎨 Phase 4: Page Implementation

### Authentication Pages (`src/app/auth/`)

- [ ] `signin/page.tsx`
  - Uses SignInForm component
  - Redirects to dashboard after login
  - Shows errors from URL params

- [ ] `signup/page.tsx`
  - Uses SignUpForm component
  - Role selection dropdown
  - Redirects to signin after signup

- [ ] `error/page.tsx`
  - NextAuth error display page
  - Shows user-friendly error messages

### Dashboard Pages (`src/app/dashboard/`)

- [ ] `client/page.tsx`
  - Stats cards (total, pending, completed, spent)
  - Recent orders list
  - "Browse Services" CTA if no orders
  - Server component fetching user's orders

- [ ] `lab/page.tsx`
  - Lab stats (orders, revenue, completion rate)
  - Tabs: Pending | In Progress | Completed
  - Order status update interface
  - Server component fetching lab's orders

- [ ] `admin/page.tsx`
  - Platform-wide stats
  - Recent orders across all labs
  - Lab performance metrics
  - User growth chart (optional)

- [ ] `layout.tsx`
  - Navigation bar with role-based links
  - User menu with signout
  - Breadcrumbs
  - Client component wrapping dashboard pages

### Order Flow Pages (`src/app/order/`)

- [ ] `[serviceId]/page.tsx`
  - Order submission form
  - React Hook Form + Zod validation
  - Shows selected service details
  - Multi-step form (optional for MVP):
    1. Sample description
    2. Contact information
    3. Review and submit

- [ ] `success/page.tsx` (optional)
  - Order confirmation page
  - Shows order ID and next steps
  - Link to dashboard

### Homepage (`src/app/`)

- [ ] `page.tsx`
  - Hero section with search
  - Service catalog with filtering
  - Featured labs (optional)
  - Server component fetching services

### Marketing Pages (`src/app/marketing/`)

- [ ] `about/page.tsx` (optional for MVP)
  - About PipetGo platform
  - How it works

- [ ] `contact/page.tsx` (optional for MVP)
  - Contact form
  - Support email

## 🗄️ Phase 5: Database

### Prisma Schema (Already complete)

- [x] `prisma/schema.prisma`
  - All models defined
  - Relationships configured
  - Enums defined

### Seed Script (`prisma/seed.ts`)

- [ ] Create demo users (3 roles)
- [ ] Create 2-3 sample labs
- [ ] Create 10+ lab services across categories
- [ ] Create 5+ sample orders in various states
- [ ] Create mock attachments

### Migrations

- [ ] Run initial migration: `npm run db:migrate`
- [ ] Test seed: `npm run db:seed`
- [ ] Verify in Prisma Studio: `npm run db:studio`

## ⚙️ Phase 6: Configuration

### Environment Variables

- [ ] `.env.example` - Template file
  ```env
  DATABASE_URL="postgresql://..."
  NEXTAUTH_URL="http://localhost:3000"
  NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
  ```

- [ ] `.env.local` - Your actual values (gitignored)

### Next.js Configuration

- [x] `next.config.js` - Already configured
- [x] `tailwind.config.ts` - Already configured
- [x] `tsconfig.json` - Already configured
- [x] `package.json` - Dependencies installed

### Git Setup

- [ ] `.gitignore` - Verify includes:
  - `.env.local`
  - `node_modules/`
  - `.next/`
  - `*.log`

## 🧪 Phase 7: Testing & Validation

### Manual Testing Flow

- [ ] **User Registration**
  - [ ] Sign up as CLIENT
  - [ ] Sign up as LAB_ADMIN
  - [ ] Verify email uniqueness

- [ ] **Authentication**
  - [ ] Sign in with valid email
  - [ ] Sign in with invalid email
  - [ ] Session persists across page refreshes
  - [ ] Sign out works

- [ ] **Service Catalog**
  - [ ] Homepage loads services
  - [ ] Filter by category works
  - [ ] Service cards display correctly
  - [ ] "Request Test" requires login

- [ ] **Order Submission**
  - [ ] Form validation works (required fields, email format, etc.)
  - [ ] Order creates successfully
  - [ ] Redirects to dashboard after submission

- [ ] **Client Dashboard**
  - [ ] Shows only client's orders
  - [ ] Stats calculate correctly
  - [ ] Order status displays correctly
  - [ ] No orders state shows CTA

- [ ] **Lab Dashboard**
  - [ ] Shows only lab's orders
  - [ ] Status update dropdown works
  - [ ] Status transitions validate
  - [ ] Timestamps update (acknowledgedAt, completedAt)

- [ ] **Admin Dashboard**
  - [ ] Shows all platform orders
  - [ ] Stats aggregate correctly
  - [ ] Can view all labs and users

### API Testing

- [ ] Test all endpoints with Postman/curl
- [ ] Verify authentication checks
- [ ] Test validation errors return 400
- [ ] Test unauthorized access returns 401
- [ ] Test not found returns 404

### Database Testing

- [ ] Orders link correctly to services and labs
- [ ] Cascade deletes work properly
- [ ] JSON fields serialize correctly
- [ ] Timestamps auto-update

## 📚 Phase 8: Documentation

- [x] `CLAUDE.md` - Project instructions (already exists)
- [x] `README.md` - Setup guide (already exists)
- [x] `SCAFFOLD_GUIDE.md` - Implementation guide (created)
- [ ] `API_DOCUMENTATION.md` - API endpoint reference
- [ ] Inline code comments with 🎓 LEARNING sections

## 🚀 Phase 9: Deployment Preparation

### Pre-deployment Checklist

- [ ] Remove console.logs from production code
- [ ] Set proper error boundaries
- [ ] Add loading spinners to all async operations
- [ ] Test on mobile devices (responsive design)
- [ ] Run `npm run build` successfully
- [ ] Test production build locally: `npm start`

### Environment Setup

- [ ] Set up Neon PostgreSQL database (or similar)
- [ ] Configure environment variables in hosting platform
- [ ] Set `NEXTAUTH_SECRET` to secure random string
- [ ] Set `NEXTAUTH_URL` to production domain

### Deployment (Vercel recommended)

- [ ] Connect Git repository
- [ ] Configure build settings
- [ ] Add environment variables
- [ ] Run initial migration on production database
- [ ] Deploy and test

## 🎯 MVP Success Criteria

**The MVP is complete when:**

1. ✅ A client can browse services without logging in
2. ✅ A client can sign up and log in
3. ✅ A client can submit a test order
4. ✅ A client can view their orders in their dashboard
5. ✅ A lab admin can view incoming orders
6. ✅ A lab admin can update order status through the workflow
7. ✅ A lab admin can mark orders as completed
8. ✅ Status changes are reflected in client dashboard
9. ✅ Platform admin can see all orders and stats
10. ✅ Mock file attachments are generated (real upload for Stage 2)

## 📈 Post-MVP Enhancements (Stage 2)

**Not required for MVP but plan ahead:**

- [ ] Real file upload (S3/Supabase Storage)
- [ ] Email notifications (SendGrid/Resend)
- [ ] Password authentication with bcrypt
- [ ] Payment processing (Stripe)
- [ ] Real-time updates (WebSockets)
- [ ] Search functionality
- [ ] Mobile app (React Native)
- [ ] Multi-language support

---

## 💡 Implementation Tips

### When You're Stuck

1. **Check existing files** - Many components follow similar patterns
2. **Read CLAUDE.md** - Contains architecture details
3. **Check SCAFFOLD_GUIDE.md** - Has complete code examples
4. **Use TypeScript** - Let types guide you
5. **Test incrementally** - Don't build everything before testing

### Development Workflow

1. **Start small** - Implement one feature at a time
2. **Test immediately** - Run `npm run dev` and check in browser
3. **Use Prisma Studio** - Inspect database as you go
4. **Check console** - Look for errors in browser and terminal
5. **Commit often** - Save your progress

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Module not found" | Check import path uses `@/` alias |
| Prisma type errors | Run `npx prisma generate` |
| Auth not working | Check NEXTAUTH_SECRET is set |
| Database errors | Verify DATABASE_URL and run migrations |
| Build failures | Fix TypeScript errors shown in output |

---

**Last Updated**: 2025-10-10
**Progress**: Foundation Complete ✅ | Features Pending 📝

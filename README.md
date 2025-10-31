# PipetGo MVP - Lab Services Marketplace

A Next.js-based B2B marketplace connecting clients with laboratory testing services. This Stage 1 MVP demonstrates the core user flow: **Client submits test request → Lab acknowledges & uploads results → Admin oversees transactions**.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + React 18 + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Neon serverless
- **ORM**: Prisma
- **Authentication**: NextAuth.js v4
- **UI Components**: Custom components with shadcn/ui styling

## Demo User Flow

1. **Client** browses available lab services on homepage
2. **Client** submits test request with sample details and shipping info
3. **Lab Admin** views incoming requests in dashboard
4. **Lab Admin** acknowledges order → starts testing → uploads results (mock PDF)
5. **Admin** monitors all platform activity and transactions
6. **Client** receives completed results notification

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (we'll use Neon serverless)

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd pipetgo-mvp

# Install dependencies
npm install
```

### 2. Database Setup

#### Option A: Neon Serverless (Recommended)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project and database
3. Copy your connection string

#### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create database: `createdb pipetgo`
3. Use connection string: `postgresql://user:password@localhost:5432/pipetgo`

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your values
DATABASE_URL="your-neon-connection-string-here"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"
```

To generate a secure NextAuth secret:
```bash
openssl rand -base64 32
```

### 4. Database Setup

```bash
# Push schema to database
npm run db:push

# Seed with demo data
npm run db:seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Accounts

The seed script creates three demo accounts for testing:

| Role | Email | Purpose |
|------|-------|---------|
| **Client** | `client@example.com` | Submit test requests, view results |
| **Lab Admin** | `lab@testinglab.com` | Manage orders, upload results |
| **Platform Admin** | `admin@pipetgo.com` | Monitor all activities |

**Note**: For MVP simplicity, authentication uses email only (no password validation).

## User Journey Testing

### 1. Test Client Flow
1. Go to homepage (not signed in)
2. Browse available lab services
3. Click "Request Test" → redirected to sign in
4. Use `client@example.com` to sign in
5. Fill out test request form
6. Submit and view in client dashboard

### 2. Test Lab Admin Flow
1. Sign in as `lab@testinglab.com`
2. View incoming orders in lab dashboard
3. Click "Acknowledge Order" → "Start Testing" → "Upload Results"
4. See order progress through status pipeline

### 3. Test Admin Overview
1. Sign in as `admin@pipetgo.com`
2. View platform overview with all orders
3. Monitor revenue, categories, and activity

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Role-based dashboards
│   └── order/            # Order submission
├── components/
│   ├── ui/               # Base UI components
│   └── auth-provider.tsx # Session provider
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   ├── db.ts             # Prisma client
│   └── utils.ts          # Utility functions
└── types/                # TypeScript definitions

prisma/
├── schema.prisma         # Database schema
└── seed.ts              # Demo data
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/services` | GET | Fetch lab services with filtering |
| `/api/orders` | GET, POST | Order management |
| `/api/orders/[id]` | PATCH | Update order status |
| `/api/auth/[...nextauth]` | * | Authentication |

## Database Schema

Key entities:
- **Users** (clients, lab admins, platform admin)
- **Labs** (laboratory profiles)
- **LabServices** (test offerings)
- **Orders** (client requests)
- **Attachments** (file uploads, results)

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Push schema changes
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database and reseed
npm run lint         # Run ESLint
```

## Stage 1 MVP Features ✅

- **User Authentication**: Role-based access (Client, Lab Admin, Platform Admin)
- **Service Catalog**: Browse and search lab testing services
- **Order Management**: Complete request → acknowledgment → completion flow
- **File Upload Simulation**: Mock result file attachments
- **Responsive Design**: Mobile-friendly interface
- **Admin Dashboard**: Platform oversight and monitoring
- **Status Tracking**: Real-time order status updates

## Stage 1 Limitations (By Design)

- **No Real Payments**: Orders track pricing but no actual payment processing
- **Mock File Upload**: Result files are simulated URLs (no real storage)
- **Simple Authentication**: Email-only login for demo purposes
- **No Real-time Updates**: Status changes require page refresh
- **No Email Notifications**: Status updates shown in dashboard only

## Development Notes

### Database Migrations

When you modify `prisma/schema.prisma`:

```bash
# Generate and apply migration
npm run db:migrate

# Or for development, push directly
npm run db:push
```

### Adding New Features

The codebase is structured for Stage 2 expansion:

- **Authentication**: Can easily swap NextAuth for production providers
- **File Storage**: Ready for S3/Supabase storage integration
- **Payments**: Order model includes pricing fields for Stripe integration
- **Real-time**: API routes ready for WebSocket/SSE addition

### Debugging

- View database: `npm run db:studio`
- Check API routes: Browser dev tools Network tab
- Server logs: Check terminal running `npm run dev`

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Manual Deployment

```bash
npm run build
npm start
```

## Senior Engineering Signals Demonstrated

1. **Architecture**: Clean separation between API, UI, and data layers
2. **Type Safety**: Full TypeScript with Prisma-generated types
3. **Database Design**: Properly normalized schema with audit considerations
4. **Authentication**: Production-ready auth patterns with NextAuth
5. **API Design**: RESTful endpoints with proper error handling
6. **State Management**: React patterns without unnecessary complexity
7. **Code Organization**: Logical file structure and component hierarchy

## Next Steps (Stage 2)

- Add real file upload with S3/Supabase Storage
- Implement email notifications
- Add payment processing with Stripe
- Real-time updates with WebSockets
- Enhanced error handling and logging
- Unit and integration tests

## Support

This MVP demonstrates core marketplace functionality for portfolio/demo purposes. The architecture supports production scaling but would require additional security, monitoring, and infrastructure considerations for live deployment.

## License

MIT License - see LICENSE file for details.
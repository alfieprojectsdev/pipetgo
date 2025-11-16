-- ============================================================================
-- PipetGo Production Deployment SQL
-- ============================================================================
-- This file contains all necessary SQL to deploy PipetGo to production
-- Run this on your NeonDB production database
--
-- Date: 2025-11-08
-- Database: PostgreSQL (Neon.tech)
-- ============================================================================

-- ============================================================================
-- STEP 1: Add Missing Schema Fields
-- ============================================================================
-- These fields exist in schema.prisma but not in the migration

-- Add estimatedTurnaroundDays field to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS "estimatedTurnaroundDays" INTEGER;

-- Add quoteApprovedAt field to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS "quoteApprovedAt" TIMESTAMP(3);

-- ============================================================================
-- STEP 2: Create Performance Indexes (REQUIRED)
-- ============================================================================
-- These indexes are required for production performance
-- See: docs/PERFORMANCE_BASELINE_PHASE5.md

-- Index for filtering orders by status (common query)
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

-- Composite index for client dashboard (show MY orders)
CREATE INDEX IF NOT EXISTS idx_orders_client_status ON orders ("clientId", status);

-- Composite index for lab dashboard (show orders for MY labs)
CREATE INDEX IF NOT EXISTS idx_orders_lab_status ON orders ("labId", status);

-- ============================================================================
-- STEP 3: Verify Deployment
-- ============================================================================
-- Run these queries to verify the deployment was successful

-- Verify new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('estimatedTurnaroundDays', 'quoteApprovedAt');

-- Verify indexes were created
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename = 'orders'
ORDER BY indexname;

-- ============================================================================
-- EXPECTED OUTPUT
-- ============================================================================
-- After running the verification queries, you should see:
--
-- Column verification:
--   estimatedTurnaroundDays | integer
--   quoteApprovedAt         | timestamp without time zone
--
-- Index verification:
--   idx_orders_client_status  | orders
--   idx_orders_lab_status     | orders
--   idx_orders_status         | orders
--   orders_clientId_fkey      | orders
--   orders_labId_fkey         | orders
--   orders_pkey               | orders
--   orders_serviceId_fkey     | orders
-- ============================================================================

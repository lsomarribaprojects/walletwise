-- ============================================================================
-- Post-Migration Verification Script
-- Description: Complete checklist of SQL queries to verify database setup
-- Author: Agente Administrador de Supabase
-- Date: 2026-01-02
--
-- Usage: Execute each section using MCP execute_sql() command
-- ============================================================================

-- ============================================================================
-- SECTION 1: TABLE VERIFICATION
-- ============================================================================

-- 1.1: List all user tables
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected: 8 tables
-- ✅ accounts
-- ✅ admin_config
-- ✅ budgets
-- ✅ categories
-- ✅ cfo_conversations
-- ✅ profiles
-- ✅ recurring_expenses
-- ✅ transactions

-- 1.2: Count rows in each table (should be 0 or low if new)
SELECT
  'profiles' as table_name,
  COUNT(*) as row_count
FROM profiles
UNION ALL
SELECT 'admin_config', COUNT(*) FROM admin_config
UNION ALL
SELECT 'accounts', COUNT(*) FROM accounts
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'recurring_expenses', COUNT(*) FROM recurring_expenses
UNION ALL
SELECT 'cfo_conversations', COUNT(*) FROM cfo_conversations
UNION ALL
SELECT 'budgets', COUNT(*) FROM budgets
ORDER BY table_name;

-- ============================================================================
-- SECTION 2: SCHEMA VERIFICATION
-- ============================================================================

-- 2.1: Verify profiles table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Expected columns:
-- ✅ id (uuid, NOT NULL)
-- ✅ email (text, NOT NULL)
-- ✅ full_name (text, nullable)
-- ✅ avatar_url (text, nullable)
-- ✅ timezone (text, default 'UTC')
-- ✅ currency_code (text, default 'USD')
-- ✅ created_at (timestamp with time zone, NOT NULL)
-- ✅ updated_at (timestamp with time zone, NOT NULL)

-- 2.2: Verify transactions table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'transactions'
ORDER BY ordinal_position;

-- 2.3: Verify all foreign key relationships
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Expected: ~12 foreign key constraints

-- 2.4: Verify check constraints
SELECT
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints AS tc
JOIN information_schema.check_constraints AS cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Expected constraints:
-- ✅ accounts.type CHECK
-- ✅ categories.type CHECK
-- ✅ transactions.type CHECK
-- ✅ transactions.positive_amount CHECK
-- ✅ recurring_expenses.frequency CHECK
-- ✅ recurring_expenses.positive_amount CHECK
-- ✅ budgets.period CHECK
-- ✅ budgets.positive_amount CHECK
-- ✅ budgets.valid_threshold CHECK
-- ✅ cfo_conversations.role CHECK

-- ============================================================================
-- SECTION 3: INDEX VERIFICATION
-- ============================================================================

-- 3.1: List all indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Expected: 23+ indexes (plus primary key indexes)

-- 3.2: Count indexes per table
SELECT
  tablename,
  COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Expected:
-- ✅ accounts: 3-4 indexes
-- ✅ admin_config: 2 indexes
-- ✅ budgets: 4 indexes
-- ✅ categories: 4 indexes
-- ✅ cfo_conversations: 4 indexes
-- ✅ profiles: 2 indexes
-- ✅ recurring_expenses: 4 indexes
-- ✅ transactions: 8 indexes

-- 3.3: Verify critical indexes exist
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_transactions_user_date',
    'idx_accounts_user_active',
    'idx_recurring_next_due',
    'idx_cfo_conversations_user_session'
  )
ORDER BY indexname;

-- All 4 should exist

-- ============================================================================
-- SECTION 4: RLS VERIFICATION
-- ============================================================================

-- 4.1: Verify RLS is enabled on all tables
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected: rowsecurity = true for all 8 tables

-- 4.2: Count RLS policies per table
SELECT
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Expected:
-- ✅ accounts: 4 policies
-- ✅ admin_config: 4 policies
-- ✅ budgets: 4 policies
-- ✅ categories: 4 policies
-- ✅ cfo_conversations: 3 policies
-- ✅ profiles: 3 policies
-- ✅ recurring_expenses: 4 policies
-- ✅ transactions: 4 policies
-- Total: 30 policies

-- 4.3: List all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4.4: Verify critical policies exist
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE '%_select_own'
ORDER BY tablename;

-- Should see 8 SELECT policies (one per table)

-- ============================================================================
-- SECTION 5: TRIGGER VERIFICATION
-- ============================================================================

-- 5.1: List all triggers
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name,
  CASE tgtype & 1
    WHEN 1 THEN 'ROW'
    ELSE 'STATEMENT'
  END as trigger_level,
  CASE tgtype & 66
    WHEN 2 THEN 'BEFORE'
    WHEN 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END as trigger_timing,
  tgenabled
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgname NOT LIKE 'RI_%'
  AND tgname NOT LIKE 'pg_%'
ORDER BY table_name, trigger_name;

-- Expected triggers:
-- ✅ on_auth_user_created (auth.users)
-- ✅ transaction_update_account_balance (transactions)
-- ✅ update_profiles_updated_at (profiles)
-- ✅ update_admin_config_updated_at (admin_config)
-- ✅ update_accounts_updated_at (accounts)
-- ✅ update_categories_updated_at (categories)
-- ✅ update_transactions_updated_at (transactions)
-- ✅ update_recurring_expenses_updated_at (recurring_expenses)
-- ✅ update_budgets_updated_at (budgets)

-- 5.2: Verify critical triggers are enabled
SELECT
  tgname,
  tgrelid::regclass as table_name,
  tgenabled
FROM pg_trigger
WHERE tgname IN (
  'transaction_update_account_balance',
  'on_auth_user_created'
)
ORDER BY tgname;

-- Both should show tgenabled = 'O' (enabled)

-- ============================================================================
-- SECTION 6: FUNCTION VERIFICATION
-- ============================================================================

-- 6.1: List all custom functions
SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name NOT LIKE 'pg_%'
ORDER BY routine_name;

-- Expected functions:
-- ✅ calculate_next_due_date
-- ✅ create_profile_for_user
-- ✅ get_account_balance
-- ✅ get_budget_progress
-- ✅ get_monthly_spending_by_category
-- ✅ get_user_total_balance
-- ✅ process_due_recurring_expenses
-- ✅ seed_default_categories
-- ✅ update_account_balance_on_transaction
-- ✅ update_updated_at_column

-- 6.2: Verify function signatures
SELECT
  routine_name,
  parameter_name,
  parameter_mode,
  data_type
FROM information_schema.parameters
WHERE specific_schema = 'public'
  AND routine_name IN (
    'get_account_balance',
    'get_user_total_balance',
    'seed_default_categories'
  )
ORDER BY routine_name, ordinal_position;

-- ============================================================================
-- SECTION 7: SECURITY VERIFICATION
-- ============================================================================

-- 7.1: Check for tables without RLS
SELECT
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false;

-- Expected: No rows (all tables should have RLS enabled)

-- 7.2: Check for tables with RLS but no policies
SELECT
  t.schemaname,
  t.tablename,
  COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p
  ON t.schemaname = p.schemaname
  AND t.tablename = p.tablename
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
GROUP BY t.schemaname, t.tablename
HAVING COUNT(p.policyname) = 0;

-- Expected: No rows (all tables with RLS should have policies)

-- 7.3: Check for unencrypted columns storing sensitive data
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    column_name LIKE '%password%'
    OR column_name LIKE '%secret%'
    OR column_name LIKE '%key%'
    OR column_name LIKE '%token%'
  )
ORDER BY table_name, column_name;

-- Review: Ensure sensitive data is properly handled

-- ============================================================================
-- SECTION 8: PERFORMANCE VERIFICATION
-- ============================================================================

-- 8.1: Check for missing indexes on foreign keys
SELECT
  tc.table_name,
  kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = tc.table_name
      AND indexdef LIKE '%' || kcu.column_name || '%'
  );

-- Expected: No rows (all FKs should have indexes)

-- 8.2: Identify large tables without indexes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  (SELECT COUNT(*)
   FROM pg_indexes
   WHERE schemaname = t.schemaname
     AND tablename = t.tablename) as index_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Review: Tables with many rows should have appropriate indexes

-- ============================================================================
-- SECTION 9: DATA INTEGRITY VERIFICATION
-- ============================================================================

-- 9.1: Check for orphaned records (transactions without accounts)
SELECT
  COUNT(*) as orphaned_transactions
FROM transactions
WHERE account_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM accounts WHERE id = transactions.account_id
  );

-- Expected: 0 (no orphaned records)

-- 9.2: Check for orphaned categories (parent_id references non-existent category)
SELECT
  COUNT(*) as orphaned_categories
FROM categories
WHERE parent_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM categories c2 WHERE c2.id = categories.parent_id
  );

-- Expected: 0

-- 9.3: Verify constraint violations (should return 0)
SELECT
  COUNT(*) as invalid_transactions
FROM transactions
WHERE amount <= 0;

-- Expected: 0 (all amounts should be positive)

-- 9.4: Verify budget thresholds are valid
SELECT
  COUNT(*) as invalid_budgets
FROM budgets
WHERE alert_threshold <= 0 OR alert_threshold > 100;

-- Expected: 0 (all thresholds should be 0-100)

-- ============================================================================
-- SECTION 10: FUNCTIONAL TESTING
-- ============================================================================

-- 10.1: Test get_account_balance function (requires existing account)
-- Replace ACCOUNT_ID with actual account ID
/*
SELECT get_account_balance('ACCOUNT_ID');
*/

-- 10.2: Test get_user_total_balance function (requires auth)
/*
SELECT get_user_total_balance(auth.uid());
*/

-- 10.3: Test seed_default_categories function (creates 15 categories)
-- WARNING: Only run once per user
/*
SELECT seed_default_categories(auth.uid());
*/

-- 10.4: Verify categories were created
/*
SELECT name, type, is_default
FROM categories
WHERE user_id = auth.uid()
  AND is_default = true
ORDER BY type, name;
*/

-- Expected: 15 rows (10 expense, 5 income)

-- 10.5: Test calculate_next_due_date function
SELECT
  'monthly' as frequency,
  calculate_next_due_date('2026-01-01'::date, 'monthly') as next_date
UNION ALL
SELECT 'quarterly', calculate_next_due_date('2026-01-01'::date, 'quarterly')
UNION ALL
SELECT 'annual', calculate_next_due_date('2026-01-01'::date, 'annual');

-- Expected:
-- monthly: 2026-02-01
-- quarterly: 2026-04-01
-- annual: 2027-01-01

-- ============================================================================
-- SECTION 11: TRIGGER TESTING
-- ============================================================================

-- 11.1: Test updated_at trigger
-- This requires creating/updating a record
/*
-- Create a test account
INSERT INTO accounts (user_id, name, type, balance)
VALUES (auth.uid(), 'Test Account', 'checking', 100.00)
RETURNING id, created_at, updated_at;

-- Save the ID, then wait 2 seconds and update
UPDATE accounts
SET name = 'Test Account Updated'
WHERE id = 'ACCOUNT_ID_FROM_ABOVE';

-- Verify updated_at changed
SELECT id, name, created_at, updated_at
FROM accounts
WHERE id = 'ACCOUNT_ID_FROM_ABOVE';

-- updated_at should be later than created_at
*/

-- 11.2: Test account balance trigger
-- This requires creating a transaction
/*
-- Check initial balance
SELECT id, name, balance
FROM accounts
WHERE user_id = auth.uid();

-- Create an expense transaction
INSERT INTO transactions (
  user_id,
  account_id,
  type,
  amount,
  description,
  transaction_date
)
VALUES (
  auth.uid(),
  'ACCOUNT_ID',
  'expense',
  25.00,
  'Test expense',
  NOW()
)
RETURNING id, amount, type;

-- Check balance was updated automatically
SELECT id, name, balance
FROM accounts
WHERE id = 'ACCOUNT_ID';

-- Balance should be decreased by 25.00
*/

-- ============================================================================
-- SECTION 12: RLS TESTING
-- ============================================================================

-- 12.1: Test that users can only see their own data
-- (Requires two different users)

-- As User A:
/*
SELECT COUNT(*) as my_transactions
FROM transactions
WHERE user_id = auth.uid();

-- Should only see User A's transactions
*/

-- 12.2: Test that users cannot access other users' data
-- (This should return 0 rows even if other users have data)
/*
SELECT COUNT(*) as other_users_transactions
FROM transactions
WHERE user_id != auth.uid();

-- Expected: 0 (RLS blocks access to other users' data)
*/

-- ============================================================================
-- SECTION 13: FINAL SUMMARY
-- ============================================================================

-- 13.1: Database health check summary
SELECT
  'Tables Created' as check_name,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as result,
  8 as expected,
  CASE WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') = 8
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status
UNION ALL
SELECT
  'RLS Enabled',
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true),
  8,
  CASE WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) = 8
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END
UNION ALL
SELECT
  'RLS Policies',
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'),
  30,
  CASE WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') >= 30
    THEN '✅ PASS'
    ELSE '⚠️  WARNING'
  END
UNION ALL
SELECT
  'Functions Created',
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public'),
  10,
  CASE WHEN (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public') >= 10
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END
UNION ALL
SELECT
  'Indexes Created',
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public'),
  23,
  CASE WHEN (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') >= 23
    THEN '✅ PASS'
    ELSE '⚠️  WARNING'
  END;

-- ============================================================================
-- END OF VERIFICATION SCRIPT
-- ============================================================================

-- All checks should show ✅ PASS
-- If any check shows ❌ FAIL, review the corresponding migration file
-- If any check shows ⚠️  WARNING, verify manually but may be acceptable

-- Next steps:
-- 1. If all checks pass: Database is ready for application integration
-- 2. If checks fail: Review migration files and reapply as needed
-- 3. Create test data using seed_default_categories() function
-- 4. Begin implementing application services

-- ============================================================================
-- Migration: Enable Row Level Security (RLS) Policies
-- Description: Configures security policies for all tables
-- Author: Agente Administrador de Supabase
-- Date: 2026-01-02
-- ============================================================================

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cfo_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 1. PROFILES POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile (usually done on signup)
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 2. ADMIN CONFIG POLICIES
-- ============================================================================

-- Users can view their own admin config
CREATE POLICY admin_config_select_own ON admin_config
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own admin config
CREATE POLICY admin_config_insert_own ON admin_config
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own admin config
CREATE POLICY admin_config_update_own ON admin_config
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own admin config
CREATE POLICY admin_config_delete_own ON admin_config
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- 3. ACCOUNTS POLICIES
-- ============================================================================

-- Users can view their own accounts
CREATE POLICY accounts_select_own ON accounts
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own accounts
CREATE POLICY accounts_insert_own ON accounts
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own accounts
CREATE POLICY accounts_update_own ON accounts
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own accounts
CREATE POLICY accounts_delete_own ON accounts
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- 4. CATEGORIES POLICIES
-- ============================================================================

-- Users can view their own categories
CREATE POLICY categories_select_own ON categories
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own categories
CREATE POLICY categories_insert_own ON categories
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own categories
CREATE POLICY categories_update_own ON categories
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own categories
CREATE POLICY categories_delete_own ON categories
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- 5. TRANSACTIONS POLICIES
-- ============================================================================

-- Users can view their own transactions
CREATE POLICY transactions_select_own ON transactions
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own transactions
CREATE POLICY transactions_insert_own ON transactions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own transactions
CREATE POLICY transactions_update_own ON transactions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own transactions
CREATE POLICY transactions_delete_own ON transactions
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- 6. RECURRING EXPENSES POLICIES
-- ============================================================================

-- Users can view their own recurring expenses
CREATE POLICY recurring_expenses_select_own ON recurring_expenses
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own recurring expenses
CREATE POLICY recurring_expenses_insert_own ON recurring_expenses
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own recurring expenses
CREATE POLICY recurring_expenses_update_own ON recurring_expenses
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own recurring expenses
CREATE POLICY recurring_expenses_delete_own ON recurring_expenses
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- 7. CFO CONVERSATIONS POLICIES
-- ============================================================================

-- Users can view their own conversations
CREATE POLICY cfo_conversations_select_own ON cfo_conversations
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own conversations
CREATE POLICY cfo_conversations_insert_own ON cfo_conversations
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own conversations (optional, for privacy)
CREATE POLICY cfo_conversations_delete_own ON cfo_conversations
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- 8. BUDGETS POLICIES
-- ============================================================================

-- Users can view their own budgets
CREATE POLICY budgets_select_own ON budgets
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own budgets
CREATE POLICY budgets_insert_own ON budgets
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own budgets
CREATE POLICY budgets_update_own ON budgets
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own budgets
CREATE POLICY budgets_delete_own ON budgets
  FOR DELETE
  USING (user_id = auth.uid());

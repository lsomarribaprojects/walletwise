-- ============================================================================
-- Migration: Initial Walletwise Database Schema
-- Description: Creates all core tables for financial management system
-- Author: Agente Administrador de Supabase
-- Date: 2026-01-02
-- ============================================================================

-- ============================================================================
-- 1. PROFILES TABLE
-- ============================================================================
-- Extends auth.users with user profile information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  currency_code TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ============================================================================
-- 2. ADMIN CONFIGURATION TABLE
-- ============================================================================
-- Stores admin settings and API keys
CREATE TABLE IF NOT EXISTS admin_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  config_key TEXT NOT NULL,
  config_value JSONB NOT NULL,
  is_encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, config_key)
);

-- Create index for config lookups
CREATE INDEX IF NOT EXISTS idx_admin_config_user_key ON admin_config(user_id, config_key);

-- ============================================================================
-- 3. ACCOUNTS TABLE
-- ============================================================================
-- Bank accounts and wallets
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit_card', 'cash', 'investment', 'other')),
  balance DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
  currency_code TEXT DEFAULT 'USD',
  icon TEXT,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for accounts
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_active ON accounts(user_id, is_active);

-- ============================================================================
-- 4. CATEGORIES TABLE
-- ============================================================================
-- Transaction categories (income and expense)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT,
  color TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, name, type)
);

-- Create indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- ============================================================================
-- 5. TRANSACTIONS TABLE
-- ============================================================================
-- Financial transactions (income and expenses)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(15, 2) NOT NULL,
  currency_code TEXT DEFAULT 'USD',
  description TEXT NOT NULL,
  notes TEXT,
  transaction_date TIMESTAMPTZ NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurring_expense_id UUID,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Create indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_recurring ON transactions(recurring_expense_id) WHERE recurring_expense_id IS NOT NULL;

-- ============================================================================
-- 6. RECURRING EXPENSES TABLE
-- ============================================================================
-- Recurring expenses (monthly, annual subscriptions, etc.)
CREATE TABLE IF NOT EXISTS recurring_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency_code TEXT DEFAULT 'USD',
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semiannual', 'annual')),
  start_date DATE NOT NULL,
  end_date DATE,
  next_due_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  auto_create BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Create indexes for recurring expenses
CREATE INDEX IF NOT EXISTS idx_recurring_user_id ON recurring_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_active ON recurring_expenses(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_next_due ON recurring_expenses(next_due_date) WHERE is_active = true;

-- ============================================================================
-- 7. CFO CONVERSATIONS TABLE
-- ============================================================================
-- Stores chat history with CFO AI agent
CREATE TABLE IF NOT EXISTS cfo_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for conversations
CREATE INDEX IF NOT EXISTS idx_cfo_conversations_user_id ON cfo_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_cfo_conversations_session ON cfo_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_cfo_conversations_user_session ON cfo_conversations(user_id, session_id, created_at DESC);

-- ============================================================================
-- 8. BUDGETS TABLE
-- ============================================================================
-- Budget planning and tracking
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency_code TEXT DEFAULT 'USD',
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
  start_date DATE NOT NULL,
  end_date DATE,
  alert_threshold DECIMAL(5, 2) DEFAULT 80.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT valid_threshold CHECK (alert_threshold > 0 AND alert_threshold <= 100)
);

-- Create indexes for budgets
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_active ON budgets(user_id, is_active);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_config_updated_at BEFORE UPDATE ON admin_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_expenses_updated_at BEFORE UPDATE ON recurring_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

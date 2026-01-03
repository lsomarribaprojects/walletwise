-- ============================================================================
-- Migration: Helper Functions and Automation
-- Description: Business logic functions and automated triggers
-- Author: Agente Administrador de Supabase
-- Date: 2026-01-02
-- ============================================================================

-- ============================================================================
-- 1. FUNCTION: Update Account Balance on Transaction
-- ============================================================================
-- Automatically updates account balance when a transaction is added/updated/deleted

CREATE OR REPLACE FUNCTION update_account_balance_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    IF NEW.account_id IS NOT NULL THEN
      IF NEW.type = 'income' THEN
        UPDATE accounts
        SET balance = balance + NEW.amount
        WHERE id = NEW.account_id;
      ELSIF NEW.type = 'expense' THEN
        UPDATE accounts
        SET balance = balance - NEW.amount
        WHERE id = NEW.account_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- Revert old transaction
    IF OLD.account_id IS NOT NULL THEN
      IF OLD.type = 'income' THEN
        UPDATE accounts
        SET balance = balance - OLD.amount
        WHERE id = OLD.account_id;
      ELSIF OLD.type = 'expense' THEN
        UPDATE accounts
        SET balance = balance + OLD.amount
        WHERE id = OLD.account_id;
      END IF;
    END IF;

    -- Apply new transaction
    IF NEW.account_id IS NOT NULL THEN
      IF NEW.type = 'income' THEN
        UPDATE accounts
        SET balance = balance + NEW.amount
        WHERE id = NEW.account_id;
      ELSIF NEW.type = 'expense' THEN
        UPDATE accounts
        SET balance = balance - NEW.amount
        WHERE id = NEW.account_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.account_id IS NOT NULL THEN
      IF OLD.type = 'income' THEN
        UPDATE accounts
        SET balance = balance - OLD.amount
        WHERE id = OLD.account_id;
      ELSIF OLD.type = 'expense' THEN
        UPDATE accounts
        SET balance = balance + OLD.amount
        WHERE id = OLD.account_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for account balance updates
CREATE TRIGGER transaction_update_account_balance
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance_on_transaction();

-- ============================================================================
-- 2. FUNCTION: Update Next Due Date for Recurring Expenses
-- ============================================================================
-- Updates next_due_date based on frequency

CREATE OR REPLACE FUNCTION calculate_next_due_date(
  current_date DATE,
  frequency TEXT
)
RETURNS DATE AS $$
BEGIN
  RETURN CASE frequency
    WHEN 'daily' THEN current_date + INTERVAL '1 day'
    WHEN 'weekly' THEN current_date + INTERVAL '1 week'
    WHEN 'biweekly' THEN current_date + INTERVAL '2 weeks'
    WHEN 'monthly' THEN current_date + INTERVAL '1 month'
    WHEN 'quarterly' THEN current_date + INTERVAL '3 months'
    WHEN 'semiannual' THEN current_date + INTERVAL '6 months'
    WHEN 'annual' THEN current_date + INTERVAL '1 year'
    ELSE current_date
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 3. FUNCTION: Create Profile on User Signup
-- ============================================================================
-- Automatically creates a profile when a new user signs up

CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    now(),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users (Supabase auth schema)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_user();

-- ============================================================================
-- 4. FUNCTION: Get Account Balance
-- ============================================================================
-- Returns current balance for an account

CREATE OR REPLACE FUNCTION get_account_balance(account_uuid UUID)
RETURNS DECIMAL(15, 2) AS $$
DECLARE
  current_balance DECIMAL(15, 2);
BEGIN
  SELECT balance INTO current_balance
  FROM accounts
  WHERE id = account_uuid;

  RETURN COALESCE(current_balance, 0.00);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- 5. FUNCTION: Get User Total Balance
-- ============================================================================
-- Returns sum of all active account balances for a user

CREATE OR REPLACE FUNCTION get_user_total_balance(user_uuid UUID)
RETURNS DECIMAL(15, 2) AS $$
DECLARE
  total_balance DECIMAL(15, 2);
BEGIN
  SELECT COALESCE(SUM(balance), 0.00) INTO total_balance
  FROM accounts
  WHERE user_id = user_uuid AND is_active = true;

  RETURN total_balance;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- 6. FUNCTION: Get Monthly Spending by Category
-- ============================================================================
-- Returns total spending for each category in a given month

CREATE OR REPLACE FUNCTION get_monthly_spending_by_category(
  user_uuid UUID,
  target_year INT,
  target_month INT
)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  total_amount DECIMAL(15, 2),
  transaction_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS category_id,
    c.name AS category_name,
    COALESCE(SUM(t.amount), 0.00) AS total_amount,
    COUNT(t.id) AS transaction_count
  FROM categories c
  LEFT JOIN transactions t ON t.category_id = c.id
    AND t.user_id = user_uuid
    AND t.type = 'expense'
    AND EXTRACT(YEAR FROM t.transaction_date) = target_year
    AND EXTRACT(MONTH FROM t.transaction_date) = target_month
  WHERE c.user_id = user_uuid AND c.type = 'expense'
  GROUP BY c.id, c.name
  ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- 7. FUNCTION: Get Budget Progress
-- ============================================================================
-- Returns budget vs actual spending for a given period

CREATE OR REPLACE FUNCTION get_budget_progress(budget_uuid UUID)
RETURNS TABLE (
  budget_id UUID,
  budget_name TEXT,
  budget_amount DECIMAL(15, 2),
  spent_amount DECIMAL(15, 2),
  remaining_amount DECIMAL(15, 2),
  percentage_used DECIMAL(5, 2),
  is_over_budget BOOLEAN
) AS $$
DECLARE
  v_budget_id UUID;
  v_user_id UUID;
  v_category_id UUID;
  v_budget_name TEXT;
  v_budget_amount DECIMAL(15, 2);
  v_start_date DATE;
  v_end_date DATE;
  v_spent DECIMAL(15, 2);
  v_remaining DECIMAL(15, 2);
  v_percentage DECIMAL(5, 2);
  v_is_over BOOLEAN;
BEGIN
  -- Get budget details
  SELECT b.id, b.user_id, b.category_id, b.name, b.amount, b.start_date,
         COALESCE(b.end_date, CURRENT_DATE)
  INTO v_budget_id, v_user_id, v_category_id, v_budget_name, v_budget_amount,
       v_start_date, v_end_date
  FROM budgets b
  WHERE b.id = budget_uuid;

  -- Calculate spent amount
  SELECT COALESCE(SUM(t.amount), 0.00) INTO v_spent
  FROM transactions t
  WHERE t.user_id = v_user_id
    AND t.category_id = v_category_id
    AND t.type = 'expense'
    AND t.transaction_date >= v_start_date
    AND t.transaction_date <= v_end_date;

  -- Calculate metrics
  v_remaining := v_budget_amount - v_spent;
  v_percentage := CASE
    WHEN v_budget_amount > 0 THEN (v_spent / v_budget_amount) * 100
    ELSE 0
  END;
  v_is_over := v_spent > v_budget_amount;

  -- Return results
  RETURN QUERY SELECT
    v_budget_id,
    v_budget_name,
    v_budget_amount,
    v_spent,
    v_remaining,
    v_percentage,
    v_is_over;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- 8. FUNCTION: Seed Default Categories
-- ============================================================================
-- Creates default categories for a new user

CREATE OR REPLACE FUNCTION seed_default_categories(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Default expense categories
  INSERT INTO categories (user_id, name, type, icon, color, is_default) VALUES
  (user_uuid, 'Food & Dining', 'expense', '🍔', '#FF6B6B', true),
  (user_uuid, 'Transportation', 'expense', '🚗', '#4ECDC4', true),
  (user_uuid, 'Shopping', 'expense', '🛍️', '#45B7D1', true),
  (user_uuid, 'Entertainment', 'expense', '🎬', '#96CEB4', true),
  (user_uuid, 'Bills & Utilities', 'expense', '💡', '#FFEAA7', true),
  (user_uuid, 'Healthcare', 'expense', '🏥', '#DFE6E9', true),
  (user_uuid, 'Education', 'expense', '📚', '#A29BFE', true),
  (user_uuid, 'Personal Care', 'expense', '💅', '#FD79A8', true),
  (user_uuid, 'Housing', 'expense', '🏠', '#636E72', true),
  (user_uuid, 'Other', 'expense', '📦', '#B2BEC3', true);

  -- Default income categories
  INSERT INTO categories (user_id, name, type, icon, color, is_default) VALUES
  (user_uuid, 'Salary', 'income', '💰', '#00B894', true),
  (user_uuid, 'Freelance', 'income', '💼', '#00CEC9', true),
  (user_uuid, 'Investment', 'income', '📈', '#0984E3', true),
  (user_uuid, 'Gift', 'income', '🎁', '#6C5CE7', true),
  (user_uuid, 'Other Income', 'income', '💵', '#FDCB6E', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. FUNCTION: Process Due Recurring Expenses
-- ============================================================================
-- Creates transactions for recurring expenses that are due
-- This function should be called by a scheduled job (cron/edge function)

CREATE OR REPLACE FUNCTION process_due_recurring_expenses()
RETURNS TABLE (
  created_count INT,
  processed_recurring_ids UUID[]
) AS $$
DECLARE
  v_recurring RECORD;
  v_created_count INT := 0;
  v_processed_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  -- Loop through all due recurring expenses
  FOR v_recurring IN
    SELECT * FROM recurring_expenses
    WHERE is_active = true
      AND auto_create = true
      AND next_due_date <= CURRENT_DATE
      AND (end_date IS NULL OR end_date >= CURRENT_DATE)
  LOOP
    -- Create transaction
    INSERT INTO transactions (
      user_id,
      account_id,
      category_id,
      type,
      amount,
      currency_code,
      description,
      transaction_date,
      is_recurring,
      recurring_expense_id
    ) VALUES (
      v_recurring.user_id,
      v_recurring.account_id,
      v_recurring.category_id,
      'expense',
      v_recurring.amount,
      v_recurring.currency_code,
      v_recurring.name,
      v_recurring.next_due_date,
      true,
      v_recurring.id
    );

    -- Update next due date
    UPDATE recurring_expenses
    SET next_due_date = calculate_next_due_date(next_due_date, frequency)
    WHERE id = v_recurring.id;

    v_created_count := v_created_count + 1;
    v_processed_ids := array_append(v_processed_ids, v_recurring.id);
  END LOOP;

  RETURN QUERY SELECT v_created_count, v_processed_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

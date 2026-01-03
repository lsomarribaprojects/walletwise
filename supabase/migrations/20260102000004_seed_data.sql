-- ============================================================================
-- Migration: Seed Data (Optional)
-- Description: Initial test data for development
-- Author: Agente Administrador de Supabase
-- Date: 2026-01-02
-- Note: This migration is OPTIONAL and should only be run in development
-- ============================================================================

-- This file can be used to seed initial data for testing
-- In production, users will create their own data through the app

-- Example: Default categories will be created automatically via trigger
-- when a user signs up and calls seed_default_categories(user_id)

-- If you want to manually test, you can uncomment and modify the following:

/*
-- Example test user (assumes user already exists in auth.users)
-- Replace 'YOUR_TEST_USER_ID' with actual UUID from auth.users

DO $$
DECLARE
  test_user_id UUID := 'YOUR_TEST_USER_ID'; -- Replace with actual user ID
BEGIN
  -- Seed default categories
  PERFORM seed_default_categories(test_user_id);

  -- Create sample accounts
  INSERT INTO accounts (user_id, name, type, balance, icon, color) VALUES
  (test_user_id, 'Main Checking', 'checking', 5000.00, '🏦', '#4ECDC4'),
  (test_user_id, 'Savings', 'savings', 10000.00, '💰', '#00B894'),
  (test_user_id, 'Credit Card', 'credit_card', -1500.00, '💳', '#FF6B6B'),
  (test_user_id, 'Cash Wallet', 'cash', 200.00, '💵', '#FDCB6E');

  -- Add more seed data as needed...
END $$;
*/

/**
 * Database Types for Walletwise
 * Auto-generated types matching Supabase schema
 *
 * @see docs/database-setup-guide.md for database schema documentation
 */

// ============================================================================
// ENUMS
// ============================================================================

export type AccountType =
  | 'checking'
  | 'savings'
  | 'credit_card'
  | 'cash'
  | 'investment'
  | 'other';

export type CategoryType = 'income' | 'expense';

export type TransactionType = 'income' | 'expense';

export type RecurringFrequency =
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual';

export type BudgetPeriod =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'annual';

export type ConversationRole = 'user' | 'assistant' | 'system';

export type AlertType = 'warning' | 'opportunity' | 'milestone' | 'recommendation';

export type AlertPriority = 'low' | 'medium' | 'high';

// ============================================================================
// DATABASE TABLES
// ============================================================================

export interface Profile {
  id: string; // UUID (references auth.users.id)
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  timezone: string; // Default: 'UTC'
  currency_code: string; // Default: 'USD'
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface AdminConfig {
  id: string; // UUID
  user_id: string; // UUID (references profiles.id)
  config_key: string;
  config_value: Record<string, unknown>; // JSONB
  is_encrypted: boolean;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface Account {
  id: string; // UUID
  user_id: string; // UUID (references profiles.id)
  name: string;
  type: AccountType;
  balance: number; // Decimal(15,2)
  currency_code: string; // Default: 'USD'
  icon: string | null;
  color: string | null;
  is_active: boolean; // Default: true
  notes: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface Category {
  id: string; // UUID
  user_id: string; // UUID (references profiles.id)
  name: string;
  type: CategoryType;
  icon: string | null;
  color: string | null;
  parent_id: string | null; // UUID (references categories.id)
  is_default: boolean; // Default: false
  is_active: boolean; // Default: true
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface Transaction {
  id: string; // UUID
  user_id: string; // UUID (references profiles.id)
  account_id: string | null; // UUID (references accounts.id)
  category_id: string | null; // UUID (references categories.id)
  type: TransactionType;
  amount: number; // Decimal(15,2) - Must be positive
  currency_code: string; // Default: 'USD'
  description: string;
  notes: string | null;
  transaction_date: string; // ISO timestamp
  is_recurring: boolean; // Default: false
  recurring_expense_id: string | null; // UUID
  tags: string[] | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface RecurringExpense {
  id: string; // UUID
  user_id: string; // UUID (references profiles.id)
  account_id: string | null; // UUID (references accounts.id)
  category_id: string | null; // UUID (references categories.id)
  name: string;
  amount: number; // Decimal(15,2) - Must be positive
  currency_code: string; // Default: 'USD'
  frequency: RecurringFrequency;
  start_date: string; // Date (YYYY-MM-DD)
  end_date: string | null; // Date (YYYY-MM-DD)
  next_due_date: string; // Date (YYYY-MM-DD)
  is_active: boolean; // Default: true
  auto_create: boolean; // Default: true
  notes: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface CfoConversation {
  id: string; // UUID
  user_id: string; // UUID (references profiles.id)
  session_id: string;
  role: ConversationRole;
  content: string;
  metadata: Record<string, unknown> | null; // JSONB
  created_at: string; // ISO timestamp
}

export interface Budget {
  id: string; // UUID
  user_id: string; // UUID (references profiles.id)
  category_id: string; // UUID (references categories.id)
  name: string;
  amount: number; // Decimal(15,2) - Must be positive
  currency_code: string; // Default: 'USD'
  period: BudgetPeriod;
  start_date: string; // Date (YYYY-MM-DD)
  end_date: string | null; // Date (YYYY-MM-DD)
  alert_threshold: number; // Decimal(5,2) - Default: 80.00 (percentage)
  is_active: boolean; // Default: true
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface UserAlert {
  id: string; // UUID
  user_id: string; // UUID (references profiles.id)
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  action_label: string | null;
  action_href: string | null;
  is_read: boolean; // Default: false
  is_dismissed: boolean; // Default: false
  expires_at: string | null; // ISO timestamp
  metadata: Record<string, unknown>; // JSONB
  created_at: string; // ISO timestamp
}

// ============================================================================
// INSERT TYPES (for creating new records)
// ============================================================================

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'> & {
  created_at?: string;
  updated_at?: string;
};

export type AdminConfigInsert = Omit<AdminConfig, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type AccountInsert = Omit<Account, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  balance?: number;
  currency_code?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CategoryInsert = Omit<Category, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  is_default?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type TransactionInsert = Omit<Transaction, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  currency_code?: string;
  is_recurring?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type RecurringExpenseInsert = Omit<RecurringExpense, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  currency_code?: string;
  is_active?: boolean;
  auto_create?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CfoConversationInsert = Omit<CfoConversation, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type BudgetInsert = Omit<Budget, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  currency_code?: string;
  alert_threshold?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type UserAlertInsert = Omit<UserAlert, 'id' | 'created_at'> & {
  id?: string;
  priority?: AlertPriority;
  is_read?: boolean;
  is_dismissed?: boolean;
  created_at?: string;
};

// ============================================================================
// UPDATE TYPES (for updating existing records)
// ============================================================================

export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;

export type AdminConfigUpdate = Partial<Omit<AdminConfig, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type AccountUpdate = Partial<Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type CategoryUpdate = Partial<Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type TransactionUpdate = Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type RecurringExpenseUpdate = Partial<Omit<RecurringExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type BudgetUpdate = Partial<Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type UserAlertUpdate = Partial<Omit<UserAlert, 'id' | 'user_id' | 'created_at'>>;

// ============================================================================
// JOINED/EXTENDED TYPES (for queries with relations)
// ============================================================================

export interface TransactionWithRelations extends Transaction {
  account?: Account | null;
  category?: Category | null;
}

export interface RecurringExpenseWithRelations extends RecurringExpense {
  account?: Account | null;
  category?: Category | null;
}

export interface BudgetWithRelations extends Budget {
  category: Category;
}

export interface CategoryWithParent extends Category {
  parent?: Category | null;
}

// ============================================================================
// FUNCTION RETURN TYPES
// ============================================================================

export interface MonthlySpendingByCategory {
  category_id: string;
  category_name: string;
  total_amount: number;
  transaction_count: number;
}

export interface BudgetProgress {
  budget_id: string;
  budget_name: string;
  budget_amount: number;
  spent_amount: number;
  remaining_amount: number;
  percentage_used: number;
  is_over_budget: boolean;
}

export interface ProcessRecurringResult {
  created_count: number;
  processed_recurring_ids: string[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  column: string;
  ascending?: boolean;
}

export interface DateRangeFilter {
  start_date: string;
  end_date: string;
}

export interface TransactionFilters {
  account_id?: string;
  category_id?: string;
  type?: TransactionType;
  date_range?: DateRangeFilter;
  min_amount?: number;
  max_amount?: number;
  tags?: string[];
  search?: string;
}

export interface AccountSummary {
  account_id: string;
  account_name: string;
  account_type: AccountType;
  balance: number;
  transaction_count: number;
  last_transaction_date: string | null;
}

export interface FinancialSummary {
  total_balance: number;
  total_income: number;
  total_expenses: number;
  net_savings: number;
  account_count: number;
  transaction_count: number;
  period_start: string;
  period_end: string;
}

// ============================================================================
// SUPABASE DATABASE TYPE (for type-safe queries)
// ============================================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      admin_config: {
        Row: AdminConfig;
        Insert: AdminConfigInsert;
        Update: AdminConfigUpdate;
      };
      accounts: {
        Row: Account;
        Insert: AccountInsert;
        Update: AccountUpdate;
      };
      categories: {
        Row: Category;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
      };
      transactions: {
        Row: Transaction;
        Insert: TransactionInsert;
        Update: TransactionUpdate;
      };
      recurring_expenses: {
        Row: RecurringExpense;
        Insert: RecurringExpenseInsert;
        Update: RecurringExpenseUpdate;
      };
      cfo_conversations: {
        Row: CfoConversation;
        Insert: CfoConversationInsert;
        Update: never; // Conversations are immutable
      };
      budgets: {
        Row: Budget;
        Insert: BudgetInsert;
        Update: BudgetUpdate;
      };
      user_alerts: {
        Row: UserAlert;
        Insert: UserAlertInsert;
        Update: UserAlertUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_account_balance: {
        Args: { account_uuid: string };
        Returns: number;
      };
      get_user_total_balance: {
        Args: { user_uuid: string };
        Returns: number;
      };
      get_monthly_spending_by_category: {
        Args: {
          user_uuid: string;
          target_year: number;
          target_month: number;
        };
        Returns: MonthlySpendingByCategory[];
      };
      get_budget_progress: {
        Args: { budget_uuid: string };
        Returns: BudgetProgress[];
      };
      seed_default_categories: {
        Args: { user_uuid: string };
        Returns: void;
      };
      process_due_recurring_expenses: {
        Args: Record<string, never>;
        Returns: ProcessRecurringResult[];
      };
      get_unread_alerts_count: {
        Args: { user_uuid: string };
        Returns: number;
      };
      dismiss_expired_alerts: {
        Args: Record<string, never>;
        Returns: number;
      };
      cleanup_old_alerts: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: {
      account_type: AccountType;
      category_type: CategoryType;
      transaction_type: TransactionType;
      recurring_frequency: RecurringFrequency;
      budget_period: BudgetPeriod;
      conversation_role: ConversationRole;
      alert_type: AlertType;
      alert_priority: AlertPriority;
    };
  };
}

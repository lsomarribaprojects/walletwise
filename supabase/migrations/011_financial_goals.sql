-- ===================================================
-- MIGRATION 011: FINANCIAL GOALS SYSTEM
-- Metas financieras con tracking automático
-- ===================================================

-- Goal Types
CREATE TYPE goal_type AS ENUM (
  'savings',        -- Ahorro general
  'debt_payoff',    -- Pagar deuda
  'emergency_fund', -- Fondo de emergencia
  'purchase',       -- Compra específica
  'investment',     -- Meta de inversión
  'retirement',     -- Jubilación
  'custom'          -- Personalizado
);

-- Goal Status
CREATE TYPE goal_status AS ENUM (
  'active',
  'completed',
  'paused',
  'cancelled'
);

-- Financial Goals Table
CREATE TABLE financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  goal_type goal_type NOT NULL DEFAULT 'savings',
  target_amount DECIMAL(12,2) NOT NULL CHECK (target_amount > 0),
  current_amount DECIMAL(12,2) DEFAULT 0 CHECK (current_amount >= 0),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE,
  status goal_status DEFAULT 'active',
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#3B82F6',
  linked_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  auto_track BOOLEAN DEFAULT false,
  monthly_contribution DECIMAL(12,2),
  milestones JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals" ON financial_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON financial_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON financial_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON financial_goals
  FOR DELETE USING (auth.uid() = user_id);

-- Goal Contributions Tracking
CREATE TABLE goal_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES financial_goals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Contributions
ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contributions" ON goal_contributions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contributions" ON goal_contributions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contributions" ON goal_contributions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contributions" ON goal_contributions
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for Performance
CREATE INDEX idx_goals_user ON financial_goals(user_id);
CREATE INDEX idx_goals_status ON financial_goals(status);
CREATE INDEX idx_goals_target_date ON financial_goals(target_date);
CREATE INDEX idx_goals_user_status ON financial_goals(user_id, status);
CREATE INDEX idx_contributions_goal ON goal_contributions(goal_id);
CREATE INDEX idx_contributions_user ON goal_contributions(user_id);
CREATE INDEX idx_contributions_date ON goal_contributions(contribution_date);

-- Trigger para updated_at
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON financial_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Auto-update current_amount when contribution added
CREATE OR REPLACE FUNCTION update_goal_current_amount()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the goal's current amount
  UPDATE financial_goals
  SET
    current_amount = current_amount + NEW.amount,
    updated_at = NOW(),
    -- Auto-complete if target reached
    status = CASE
      WHEN (current_amount + NEW.amount) >= target_amount THEN 'completed'::goal_status
      ELSE status
    END
  WHERE id = NEW.goal_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_goal_amount
  AFTER INSERT ON goal_contributions
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_current_amount();

-- Function: Get goal progress with analytics
CREATE OR REPLACE FUNCTION get_goal_progress(goal_uuid UUID)
RETURNS TABLE (
  goal_id UUID,
  percentage NUMERIC,
  days_remaining INTEGER,
  days_elapsed INTEGER,
  on_track BOOLEAN,
  monthly_needed NUMERIC,
  projected_completion DATE
) AS $$
DECLARE
  goal_record RECORD;
  months_remaining NUMERIC;
  monthly_rate NUMERIC;
BEGIN
  SELECT * INTO goal_record
  FROM financial_goals
  WHERE id = goal_uuid;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Calculate days
  days_elapsed := CURRENT_DATE - goal_record.start_date;
  days_remaining := CASE
    WHEN goal_record.target_date IS NOT NULL
    THEN goal_record.target_date - CURRENT_DATE
    ELSE NULL
  END;

  -- Calculate percentage
  percentage := CASE
    WHEN goal_record.target_amount > 0
    THEN (goal_record.current_amount / goal_record.target_amount) * 100
    ELSE 0
  END;

  -- Calculate monthly needed
  months_remaining := CASE
    WHEN goal_record.target_date IS NOT NULL
    THEN GREATEST(1, EXTRACT(EPOCH FROM (goal_record.target_date - CURRENT_DATE)) / (60 * 60 * 24 * 30))
    ELSE 12 -- Default to 1 year if no target date
  END;

  monthly_needed := CASE
    WHEN months_remaining > 0
    THEN (goal_record.target_amount - goal_record.current_amount) / months_remaining
    ELSE 0
  END;

  -- Calculate if on track
  on_track := CASE
    WHEN goal_record.target_date IS NULL THEN TRUE
    WHEN days_elapsed <= 0 THEN TRUE
    WHEN goal_record.current_amount >= goal_record.target_amount THEN TRUE
    ELSE (goal_record.current_amount / NULLIF(days_elapsed, 0)) *
         (goal_record.target_date - goal_record.start_date) >= goal_record.target_amount
  END;

  -- Calculate projected completion
  monthly_rate := CASE
    WHEN days_elapsed > 30
    THEN goal_record.current_amount / (days_elapsed / 30.0)
    WHEN goal_record.monthly_contribution IS NOT NULL
    THEN goal_record.monthly_contribution
    ELSE 0
  END;

  projected_completion := CASE
    WHEN monthly_rate > 0 AND goal_record.current_amount < goal_record.target_amount
    THEN CURRENT_DATE + (((goal_record.target_amount - goal_record.current_amount) / monthly_rate) * 30)::INTEGER
    WHEN goal_record.current_amount >= goal_record.target_amount
    THEN CURRENT_DATE
    ELSE NULL
  END;

  RETURN QUERY SELECT
    goal_uuid,
    percentage,
    days_remaining,
    days_elapsed,
    on_track,
    monthly_needed,
    projected_completion;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE financial_goals IS 'User financial goals with tracking';
COMMENT ON TABLE goal_contributions IS 'Contributions made towards goals';
COMMENT ON FUNCTION get_goal_progress IS 'Calculate detailed progress analytics for a goal';

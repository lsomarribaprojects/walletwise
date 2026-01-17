-- =====================================================
-- WALLETWISE: Credit Scores Premium
-- Migración: 010_credit_scores.sql
-- Fecha: 2026-01-15
-- Feature exclusiva para usuarios Premium
-- =====================================================

-- =====================================================
-- TABLA: credit_score_history
-- Historial de credit scores del usuario
-- =====================================================
CREATE TABLE credit_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Score
  score INTEGER NOT NULL,
  score_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Factores que afectan el score (JSON)
  -- {
  --   payment_history: 0-100,
  --   credit_utilization: 0-100,
  --   credit_age: 0-100,
  --   credit_mix: 0-100,
  --   hard_inquiries: 0-100
  -- }
  factors JSONB DEFAULT '{}'::JSONB,

  -- Origen del score
  source TEXT DEFAULT 'calculated',  -- 'calculated', 'manual', 'imported'

  -- Notas
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_score CHECK (score >= 300 AND score <= 850),
  CONSTRAINT valid_source CHECK (source IN ('calculated', 'manual', 'imported'))
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX idx_credit_score_user_date ON credit_score_history(user_id, score_date DESC);
CREATE INDEX idx_credit_score_user ON credit_score_history(user_id);
CREATE INDEX idx_credit_score_date ON credit_score_history(score_date DESC);
CREATE INDEX idx_credit_score_source ON credit_score_history(source);

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================
ALTER TABLE credit_score_history ENABLE ROW LEVEL SECURITY;

-- Políticas para credit_score_history
CREATE POLICY "Users can view own credit scores"
  ON credit_score_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credit scores"
  ON credit_score_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credit scores"
  ON credit_score_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own credit scores"
  ON credit_score_history FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNCIONES
-- =====================================================

-- Función: Calcular score estimado basado en datos de la app
CREATE OR REPLACE FUNCTION calculate_estimated_credit_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_payment_score INTEGER := 0;
  v_utilization_score INTEGER := 0;
  v_age_score INTEGER := 0;
  v_mix_score INTEGER := 0;
  v_inquiries_score INTEGER := 0;
  v_final_score INTEGER;

  -- Variables para cálculos
  v_total_cards INTEGER;
  v_total_loans INTEGER;
  v_total_limit DECIMAL(15, 2);
  v_total_used DECIMAL(15, 2);
  v_utilization_ratio DECIMAL(5, 4);
  v_oldest_account_months INTEGER;
  v_avg_account_age INTEGER;
  v_on_time_payments INTEGER;
  v_total_payments INTEGER;
BEGIN
  -- 1. PAYMENT HISTORY (35% del score)
  -- Basado en loan_payments (pagos a tiempo vs totales)
  SELECT
    COUNT(*) FILTER (WHERE payment_date <= due_date),
    COUNT(*)
  INTO v_on_time_payments, v_total_payments
  FROM loan_payments
  WHERE user_id = p_user_id
    AND due_date IS NOT NULL
    AND payment_date >= CURRENT_DATE - INTERVAL '24 months';

  IF v_total_payments > 0 THEN
    v_payment_score := LEAST(100, ROUND((v_on_time_payments::DECIMAL / v_total_payments) * 100));
  ELSE
    v_payment_score := 75; -- Score neutral si no hay historial
  END IF;

  -- 2. CREDIT UTILIZATION (30% del score)
  -- Basado en credit_cards (balance vs limit)
  SELECT
    COUNT(*),
    COALESCE(SUM(credit_limit), 0),
    COALESCE(SUM(current_balance), 0)
  INTO v_total_cards, v_total_limit, v_total_used
  FROM credit_cards
  WHERE user_id = p_user_id
    AND status = 'active';

  IF v_total_limit > 0 THEN
    v_utilization_ratio := v_total_used / v_total_limit;
    -- Score óptimo: 0-30% utilización
    v_utilization_score := CASE
      WHEN v_utilization_ratio <= 0.10 THEN 100
      WHEN v_utilization_ratio <= 0.30 THEN 90
      WHEN v_utilization_ratio <= 0.50 THEN 70
      WHEN v_utilization_ratio <= 0.70 THEN 50
      WHEN v_utilization_ratio <= 0.90 THEN 30
      ELSE 10
    END;
  ELSE
    v_utilization_score := 50; -- Score neutral si no hay tarjetas
  END IF;

  -- 3. CREDIT AGE (15% del score)
  -- Basado en antigüedad de credit_cards y loans
  SELECT
    EXTRACT(MONTH FROM AGE(NOW(), MIN(opened_date)))::INTEGER
  INTO v_oldest_account_months
  FROM credit_cards
  WHERE user_id = p_user_id;

  SELECT
    AVG(EXTRACT(MONTH FROM AGE(NOW(), start_date)))::INTEGER
  INTO v_avg_account_age
  FROM (
    SELECT start_date FROM loans WHERE user_id = p_user_id
    UNION ALL
    SELECT opened_date FROM credit_cards WHERE user_id = p_user_id
  ) accounts;

  v_age_score := CASE
    WHEN v_oldest_account_months IS NULL THEN 50
    WHEN v_oldest_account_months >= 120 THEN 100  -- 10+ años
    WHEN v_oldest_account_months >= 84 THEN 90    -- 7+ años
    WHEN v_oldest_account_months >= 60 THEN 80    -- 5+ años
    WHEN v_oldest_account_months >= 36 THEN 70    -- 3+ años
    WHEN v_oldest_account_months >= 24 THEN 60    -- 2+ años
    WHEN v_oldest_account_months >= 12 THEN 50    -- 1+ año
    ELSE 30
  END;

  -- 4. CREDIT MIX (10% del score)
  -- Diversidad de tipos de crédito
  SELECT COUNT(*) INTO v_total_cards FROM credit_cards WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_total_loans FROM loans WHERE user_id = p_user_id;

  v_mix_score := CASE
    WHEN v_total_cards > 0 AND v_total_loans > 0 THEN 100
    WHEN v_total_cards > 0 OR v_total_loans > 0 THEN 70
    ELSE 40
  END;

  -- 5. HARD INQUIRIES (10% del score)
  -- Simulado: Penaliza si se han agregado muchas cuentas recientemente
  DECLARE
    v_recent_accounts INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_recent_accounts
    FROM (
      SELECT created_at FROM credit_cards
      WHERE user_id = p_user_id
        AND created_at >= CURRENT_DATE - INTERVAL '6 months'
      UNION ALL
      SELECT created_at FROM loans
      WHERE user_id = p_user_id
        AND created_at >= CURRENT_DATE - INTERVAL '6 months'
    ) recent;

    v_inquiries_score := CASE
      WHEN v_recent_accounts = 0 THEN 100
      WHEN v_recent_accounts = 1 THEN 90
      WHEN v_recent_accounts = 2 THEN 75
      WHEN v_recent_accounts = 3 THEN 60
      ELSE 40
    END;
  END;

  -- Calcular score final (ponderado)
  v_final_score := ROUND(
    (v_payment_score * 0.35) +
    (v_utilization_score * 0.30) +
    (v_age_score * 0.15) +
    (v_mix_score * 0.10) +
    (v_inquiries_score * 0.10)
  );

  -- Convertir de 0-100 a escala 300-850
  v_final_score := 300 + ROUND((v_final_score / 100.0) * 550);

  -- Asegurar que esté en rango válido
  v_final_score := LEAST(850, GREATEST(300, v_final_score));

  RETURN v_final_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Obtener factores del score
CREATE OR REPLACE FUNCTION get_credit_score_factors(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_factors JSONB;
  v_payment_score INTEGER := 0;
  v_utilization_score INTEGER := 0;
  v_age_score INTEGER := 0;
  v_mix_score INTEGER := 0;
  v_inquiries_score INTEGER := 0;

  -- Variables para cálculos
  v_total_cards INTEGER;
  v_total_loans INTEGER;
  v_total_limit DECIMAL(15, 2);
  v_total_used DECIMAL(15, 2);
  v_utilization_ratio DECIMAL(5, 4);
  v_oldest_account_months INTEGER;
  v_on_time_payments INTEGER;
  v_total_payments INTEGER;
  v_recent_accounts INTEGER;
BEGIN
  -- Payment History
  SELECT
    COUNT(*) FILTER (WHERE payment_date <= due_date),
    COUNT(*)
  INTO v_on_time_payments, v_total_payments
  FROM loan_payments
  WHERE user_id = p_user_id
    AND due_date IS NOT NULL
    AND payment_date >= CURRENT_DATE - INTERVAL '24 months';

  IF v_total_payments > 0 THEN
    v_payment_score := LEAST(100, ROUND((v_on_time_payments::DECIMAL / v_total_payments) * 100));
  ELSE
    v_payment_score := 75;
  END IF;

  -- Credit Utilization
  SELECT
    COUNT(*),
    COALESCE(SUM(credit_limit), 0),
    COALESCE(SUM(current_balance), 0)
  INTO v_total_cards, v_total_limit, v_total_used
  FROM credit_cards
  WHERE user_id = p_user_id
    AND status = 'active';

  IF v_total_limit > 0 THEN
    v_utilization_ratio := v_total_used / v_total_limit;
    v_utilization_score := CASE
      WHEN v_utilization_ratio <= 0.10 THEN 100
      WHEN v_utilization_ratio <= 0.30 THEN 90
      WHEN v_utilization_ratio <= 0.50 THEN 70
      WHEN v_utilization_ratio <= 0.70 THEN 50
      WHEN v_utilization_ratio <= 0.90 THEN 30
      ELSE 10
    END;
  ELSE
    v_utilization_score := 50;
  END IF;

  -- Credit Age
  SELECT
    EXTRACT(MONTH FROM AGE(NOW(), MIN(opened_date)))::INTEGER
  INTO v_oldest_account_months
  FROM credit_cards
  WHERE user_id = p_user_id;

  v_age_score := CASE
    WHEN v_oldest_account_months IS NULL THEN 50
    WHEN v_oldest_account_months >= 120 THEN 100
    WHEN v_oldest_account_months >= 84 THEN 90
    WHEN v_oldest_account_months >= 60 THEN 80
    WHEN v_oldest_account_months >= 36 THEN 70
    WHEN v_oldest_account_months >= 24 THEN 60
    WHEN v_oldest_account_months >= 12 THEN 50
    ELSE 30
  END;

  -- Credit Mix
  SELECT COUNT(*) INTO v_total_loans FROM loans WHERE user_id = p_user_id;
  v_mix_score := CASE
    WHEN v_total_cards > 0 AND v_total_loans > 0 THEN 100
    WHEN v_total_cards > 0 OR v_total_loans > 0 THEN 70
    ELSE 40
  END;

  -- Hard Inquiries
  SELECT COUNT(*) INTO v_recent_accounts
  FROM (
    SELECT created_at FROM credit_cards
    WHERE user_id = p_user_id
      AND created_at >= CURRENT_DATE - INTERVAL '6 months'
    UNION ALL
    SELECT created_at FROM loans
    WHERE user_id = p_user_id
      AND created_at >= CURRENT_DATE - INTERVAL '6 months'
  ) recent;

  v_inquiries_score := CASE
    WHEN v_recent_accounts = 0 THEN 100
    WHEN v_recent_accounts = 1 THEN 90
    WHEN v_recent_accounts = 2 THEN 75
    WHEN v_recent_accounts = 3 THEN 60
    ELSE 40
  END;

  -- Construir JSON de factores
  v_factors := jsonb_build_object(
    'payment_history', v_payment_score,
    'credit_utilization', v_utilization_score,
    'credit_age', v_age_score,
    'credit_mix', v_mix_score,
    'hard_inquiries', v_inquiries_score
  );

  RETURN v_factors;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE credit_score_history IS 'Historial de credit scores del usuario (Feature Premium)';
COMMENT ON FUNCTION calculate_estimated_credit_score IS 'Calcula un score crediticio estimado basado en datos de la app';
COMMENT ON FUNCTION get_credit_score_factors IS 'Obtiene el desglose de factores que afectan el credit score';

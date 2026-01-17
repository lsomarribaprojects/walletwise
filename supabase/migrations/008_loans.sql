-- =====================================================
-- WALLETWISE: Sistema de Préstamos
-- Migración: 008_loans.sql
-- Fecha: 2026-01-15
-- =====================================================

-- Tipos ENUM para préstamos
CREATE TYPE loan_type AS ENUM ('personal', 'auto', 'mortgage', 'student', 'business', 'other');
CREATE TYPE loan_status AS ENUM ('active', 'paid_off', 'defaulted', 'deferred');
CREATE TYPE payment_frequency AS ENUM ('weekly', 'biweekly', 'monthly', 'quarterly', 'annually');

-- =====================================================
-- TABLA: loans
-- Préstamos del usuario
-- =====================================================
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Información básica
  name TEXT NOT NULL,
  lender TEXT NOT NULL,  -- Banco o prestamista
  loan_type loan_type DEFAULT 'personal' NOT NULL,
  status loan_status DEFAULT 'active' NOT NULL,

  -- Montos
  original_amount DECIMAL(15, 2) NOT NULL,
  current_balance DECIMAL(15, 2) NOT NULL,
  interest_rate DECIMAL(5, 4) NOT NULL,  -- Ej: 0.0599 = 5.99%
  currency TEXT DEFAULT 'USD',

  -- Pagos
  minimum_payment DECIMAL(15, 2) NOT NULL,
  payment_frequency payment_frequency DEFAULT 'monthly',
  payment_day INTEGER CHECK (payment_day >= 1 AND payment_day <= 31),

  -- Fechas
  start_date DATE NOT NULL,
  end_date DATE,  -- Fecha esperada de término
  next_payment_date DATE,

  -- Colateral (para préstamos asegurados)
  collateral TEXT,
  collateral_value DECIMAL(15, 2),

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT positive_amounts CHECK (
    original_amount > 0 AND
    current_balance >= 0 AND
    minimum_payment > 0
  ),
  CONSTRAINT valid_interest_rate CHECK (
    interest_rate >= 0 AND interest_rate < 1
  )
);

-- =====================================================
-- TABLA: loan_payments
-- Historial de pagos de préstamos
-- =====================================================
CREATE TABLE loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES loans(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Pago
  amount DECIMAL(15, 2) NOT NULL,
  principal_amount DECIMAL(15, 2) NOT NULL,  -- Porción al principal
  interest_amount DECIMAL(15, 2) NOT NULL,   -- Porción a intereses
  fees_amount DECIMAL(15, 2) DEFAULT 0,      -- Cargos adicionales

  -- Fechas
  payment_date DATE NOT NULL,
  due_date DATE,

  -- Estado
  is_extra_payment BOOLEAN DEFAULT false,  -- Pago adicional al mínimo

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT positive_payment CHECK (amount > 0),
  CONSTRAINT valid_breakdown CHECK (
    principal_amount + interest_amount + fees_amount = amount
  )
);

-- =====================================================
-- TABLA: loan_schedules
-- Tabla de amortización proyectada
-- =====================================================
CREATE TABLE loan_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES loans(id) ON DELETE CASCADE NOT NULL,

  -- Número de pago
  payment_number INTEGER NOT NULL,

  -- Proyección
  payment_date DATE NOT NULL,
  payment_amount DECIMAL(15, 2) NOT NULL,
  principal_amount DECIMAL(15, 2) NOT NULL,
  interest_amount DECIMAL(15, 2) NOT NULL,
  balance_after DECIMAL(15, 2) NOT NULL,

  -- Si ya fue pagado
  is_paid BOOLEAN DEFAULT false,
  actual_payment_id UUID REFERENCES loan_payments(id),

  -- Unique por préstamo y número de pago
  CONSTRAINT unique_loan_payment_number UNIQUE(loan_id, payment_number)
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX idx_loans_user ON loans(user_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_type ON loans(loan_type);
CREATE INDEX idx_loans_next_payment ON loans(next_payment_date);

CREATE INDEX idx_loan_payments_loan ON loan_payments(loan_id);
CREATE INDEX idx_loan_payments_user ON loan_payments(user_id);
CREATE INDEX idx_loan_payments_date ON loan_payments(payment_date DESC);

CREATE INDEX idx_loan_schedules_loan ON loan_schedules(loan_id);
CREATE INDEX idx_loan_schedules_date ON loan_schedules(payment_date);

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_schedules ENABLE ROW LEVEL SECURITY;

-- Políticas para loans
CREATE POLICY "Users can view own loans"
  ON loans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loans"
  ON loans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loans"
  ON loans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own loans"
  ON loans FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para loan_payments
CREATE POLICY "Users can view own loan payments"
  ON loan_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loan payments"
  ON loan_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loan payments"
  ON loan_payments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own loan payments"
  ON loan_payments FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para loan_schedules (a través de loans)
CREATE POLICY "Users can view own loan schedules"
  ON loan_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = loan_schedules.loan_id
      AND loans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own loan schedules"
  ON loan_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM loans
      WHERE loans.id = loan_schedules.loan_id
      AND loans.user_id = auth.uid()
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at
CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCIONES
-- =====================================================

-- Función: Calcular tabla de amortización
CREATE OR REPLACE FUNCTION calculate_amortization_schedule(
  p_loan_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_loan RECORD;
  v_payment_number INTEGER := 1;
  v_balance DECIMAL(15, 2);
  v_monthly_rate DECIMAL(10, 8);
  v_monthly_payment DECIMAL(15, 2);
  v_interest DECIMAL(15, 2);
  v_principal DECIMAL(15, 2);
  v_payment_date DATE;
  v_months_to_pay INTEGER;
BEGIN
  -- Obtener datos del préstamo
  SELECT * INTO v_loan FROM loans WHERE id = p_loan_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found';
  END IF;

  -- Limpiar schedule existente
  DELETE FROM loan_schedules WHERE loan_id = p_loan_id;

  -- Calcular valores iniciales
  v_balance := v_loan.current_balance;
  v_monthly_rate := v_loan.interest_rate / 12;
  v_monthly_payment := v_loan.minimum_payment;
  v_payment_date := COALESCE(v_loan.next_payment_date, v_loan.start_date + INTERVAL '1 month');

  -- Calcular meses estimados para pagar
  IF v_monthly_rate > 0 THEN
    v_months_to_pay := CEIL(
      -LOG(1 - (v_balance * v_monthly_rate / v_monthly_payment)) / LOG(1 + v_monthly_rate)
    );
  ELSE
    v_months_to_pay := CEIL(v_balance / v_monthly_payment);
  END IF;

  -- Limitar a máximo 360 meses (30 años)
  v_months_to_pay := LEAST(v_months_to_pay, 360);

  -- Generar schedule
  WHILE v_balance > 0.01 AND v_payment_number <= v_months_to_pay LOOP
    -- Calcular interés del mes
    v_interest := ROUND(v_balance * v_monthly_rate, 2);

    -- Calcular principal
    IF v_monthly_payment >= v_balance + v_interest THEN
      v_principal := v_balance;
      v_monthly_payment := v_principal + v_interest;
    ELSE
      v_principal := v_monthly_payment - v_interest;
    END IF;

    -- Nuevo balance
    v_balance := v_balance - v_principal;
    IF v_balance < 0.01 THEN v_balance := 0; END IF;

    -- Insertar en schedule
    INSERT INTO loan_schedules (
      loan_id,
      payment_number,
      payment_date,
      payment_amount,
      principal_amount,
      interest_amount,
      balance_after,
      is_paid
    ) VALUES (
      p_loan_id,
      v_payment_number,
      v_payment_date,
      v_monthly_payment,
      v_principal,
      v_interest,
      v_balance,
      false
    );

    -- Siguiente mes
    v_payment_number := v_payment_number + 1;
    v_payment_date := v_payment_date + INTERVAL '1 month';
  END LOOP;

  -- Actualizar fecha de fin estimada
  UPDATE loans
  SET end_date = v_payment_date - INTERVAL '1 month'
  WHERE id = p_loan_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Registrar pago y actualizar balance
CREATE OR REPLACE FUNCTION record_loan_payment(
  p_loan_id UUID,
  p_amount DECIMAL(15, 2),
  p_payment_date DATE DEFAULT CURRENT_DATE,
  p_is_extra BOOLEAN DEFAULT false,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_loan RECORD;
  v_monthly_rate DECIMAL(10, 8);
  v_interest DECIMAL(15, 2);
  v_principal DECIMAL(15, 2);
  v_payment_id UUID;
BEGIN
  -- Obtener préstamo
  SELECT * INTO v_loan FROM loans WHERE id = p_loan_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Loan not found';
  END IF;

  -- Verificar que el usuario es el dueño
  IF v_loan.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Calcular desglose
  v_monthly_rate := v_loan.interest_rate / 12;
  v_interest := ROUND(v_loan.current_balance * v_monthly_rate, 2);
  v_principal := p_amount - v_interest;

  -- Si el pago es menor que el interés, todo va a interés
  IF v_principal < 0 THEN
    v_interest := p_amount;
    v_principal := 0;
  END IF;

  -- Insertar pago
  INSERT INTO loan_payments (
    loan_id,
    user_id,
    amount,
    principal_amount,
    interest_amount,
    payment_date,
    due_date,
    is_extra_payment,
    notes
  ) VALUES (
    p_loan_id,
    auth.uid(),
    p_amount,
    v_principal,
    v_interest,
    p_payment_date,
    v_loan.next_payment_date,
    p_is_extra,
    p_notes
  ) RETURNING id INTO v_payment_id;

  -- Actualizar balance del préstamo
  UPDATE loans
  SET
    current_balance = GREATEST(0, current_balance - v_principal),
    next_payment_date = CASE
      WHEN NOT p_is_extra THEN next_payment_date + INTERVAL '1 month'
      ELSE next_payment_date
    END,
    status = CASE
      WHEN current_balance - v_principal <= 0 THEN 'paid_off'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = p_loan_id;

  -- Recalcular schedule si fue pago extra
  IF p_is_extra THEN
    PERFORM calculate_amortization_schedule(p_loan_id);
  END IF;

  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Obtener resumen de préstamos
CREATE OR REPLACE FUNCTION get_loans_summary(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_debt', COALESCE(SUM(current_balance), 0),
    'total_original', COALESCE(SUM(original_amount), 0),
    'total_paid', COALESCE(SUM(original_amount - current_balance), 0),
    'active_loans', COUNT(*) FILTER (WHERE status = 'active'),
    'paid_off_loans', COUNT(*) FILTER (WHERE status = 'paid_off'),
    'average_interest_rate', ROUND(AVG(interest_rate) * 100, 2),
    'next_payment_date', MIN(next_payment_date) FILTER (WHERE status = 'active'),
    'monthly_payments', COALESCE(SUM(minimum_payment) FILTER (WHERE status = 'active'), 0),
    'loans_by_type', (
      SELECT jsonb_object_agg(
        loan_type,
        jsonb_build_object(
          'count', count,
          'balance', balance
        )
      )
      FROM (
        SELECT
          loan_type,
          COUNT(*) as count,
          SUM(current_balance) as balance
        FROM loans
        WHERE user_id = p_user_id AND status = 'active'
        GROUP BY loan_type
      ) t
    )
  ) INTO v_result
  FROM loans
  WHERE user_id = p_user_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE loans IS 'Préstamos del usuario con información de amortización';
COMMENT ON TABLE loan_payments IS 'Historial de pagos realizados a préstamos';
COMMENT ON TABLE loan_schedules IS 'Tabla de amortización proyectada para cada préstamo';
COMMENT ON FUNCTION calculate_amortization_schedule IS 'Genera la tabla de amortización para un préstamo';
COMMENT ON FUNCTION record_loan_payment IS 'Registra un pago y actualiza el balance del préstamo';
COMMENT ON FUNCTION get_loans_summary IS 'Obtiene un resumen de todos los préstamos del usuario';

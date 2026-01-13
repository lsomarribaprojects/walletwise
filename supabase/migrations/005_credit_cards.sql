-- ============================================================================
-- Migration: Credit Cards Management System
-- Description: Tablas para gestión de tarjetas de crédito con tasas de interés
--              y historial de pagos para asesoría inteligente de deuda
-- ============================================================================

-- 1. TABLA CREDIT_CARDS
CREATE TABLE IF NOT EXISTS credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Información básica
  nombre TEXT NOT NULL,
  banco TEXT,
  ultimos_digitos TEXT CHECK (ultimos_digitos IS NULL OR LENGTH(ultimos_digitos) = 4),

  -- Tasas y límites
  tasa_interes_anual DECIMAL(5, 2) NOT NULL CHECK (tasa_interes_anual >= 0 AND tasa_interes_anual <= 100),
  limite_credito DECIMAL(15, 2) NOT NULL CHECK (limite_credito > 0),
  saldo_actual DECIMAL(15, 2) DEFAULT 0.00 CHECK (saldo_actual >= 0),

  -- Fechas importantes (día del mes)
  fecha_corte INTEGER CHECK (fecha_corte IS NULL OR (fecha_corte >= 1 AND fecha_corte <= 31)),
  fecha_pago INTEGER CHECK (fecha_pago IS NULL OR (fecha_pago >= 1 AND fecha_pago <= 31)),

  -- Pagos
  pago_minimo DECIMAL(15, 2) DEFAULT 0.00 CHECK (pago_minimo >= 0),
  pago_no_intereses DECIMAL(15, 2) DEFAULT 0.00 CHECK (pago_no_intereses >= 0),

  -- Metadata
  color TEXT DEFAULT '#9333EA',
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. ÍNDICES PARA CREDIT_CARDS
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_active ON credit_cards(user_id, activa);
CREATE INDEX IF NOT EXISTS idx_credit_cards_saldo ON credit_cards(saldo_actual DESC);

-- 3. TRIGGER PARA UPDATED_AT
CREATE OR REPLACE TRIGGER update_credit_cards_updated_at
  BEFORE UPDATE ON credit_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. RLS POLICIES PARA CREDIT_CARDS
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS credit_cards_select_own ON credit_cards;
CREATE POLICY credit_cards_select_own ON credit_cards
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS credit_cards_insert_own ON credit_cards;
CREATE POLICY credit_cards_insert_own ON credit_cards
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS credit_cards_update_own ON credit_cards;
CREATE POLICY credit_cards_update_own ON credit_cards
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS credit_cards_delete_own ON credit_cards;
CREATE POLICY credit_cards_delete_own ON credit_cards
  FOR DELETE USING (user_id = auth.uid());

-- 5. TABLA CREDIT_CARD_PAYMENTS (Historial de pagos)
CREATE TABLE IF NOT EXISTS credit_card_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  credit_card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE NOT NULL,

  -- Monto del pago
  monto DECIMAL(15, 2) NOT NULL CHECK (monto > 0),
  fecha_pago TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Desglose (opcional, calculado)
  monto_capital DECIMAL(15, 2),
  monto_intereses DECIMAL(15, 2),

  -- Estado post-pago
  saldo_anterior DECIMAL(15, 2),
  saldo_nuevo DECIMAL(15, 2),

  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. ÍNDICES PARA CREDIT_CARD_PAYMENTS
CREATE INDEX IF NOT EXISTS idx_cc_payments_card ON credit_card_payments(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_cc_payments_user ON credit_card_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_cc_payments_date ON credit_card_payments(fecha_pago DESC);

-- 7. RLS POLICIES PARA CREDIT_CARD_PAYMENTS
ALTER TABLE credit_card_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cc_payments_select_own ON credit_card_payments;
CREATE POLICY cc_payments_select_own ON credit_card_payments
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS cc_payments_insert_own ON credit_card_payments;
CREATE POLICY cc_payments_insert_own ON credit_card_payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 8. FUNCIÓN PARA CALCULAR INTERÉS MENSUAL
CREATE OR REPLACE FUNCTION calculate_monthly_interest(
  p_saldo DECIMAL(15, 2),
  p_tasa_anual DECIMAL(5, 2)
) RETURNS DECIMAL(15, 2) AS $$
BEGIN
  RETURN ROUND(p_saldo * (p_tasa_anual / 12 / 100), 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 9. FUNCIÓN PARA OBTENER MÉTRICAS DE TARJETAS DEL USUARIO
CREATE OR REPLACE FUNCTION get_credit_card_metrics(p_user_id UUID)
RETURNS TABLE (
  deuda_total DECIMAL(15, 2),
  limite_total DECIMAL(15, 2),
  utilizacion_promedio DECIMAL(5, 2),
  tasa_promedio_ponderada DECIMAL(5, 2),
  pago_minimo_total DECIMAL(15, 2),
  intereses_mensuales DECIMAL(15, 2),
  num_tarjetas INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(cc.saldo_actual), 0)::DECIMAL(15, 2) as deuda_total,
    COALESCE(SUM(cc.limite_credito), 0)::DECIMAL(15, 2) as limite_total,
    CASE
      WHEN SUM(cc.limite_credito) > 0
      THEN ROUND((SUM(cc.saldo_actual) / SUM(cc.limite_credito) * 100)::DECIMAL, 2)
      ELSE 0
    END as utilizacion_promedio,
    CASE
      WHEN SUM(cc.saldo_actual) > 0
      THEN ROUND((SUM(cc.tasa_interes_anual * cc.saldo_actual) / SUM(cc.saldo_actual))::DECIMAL, 2)
      ELSE 0
    END as tasa_promedio_ponderada,
    COALESCE(SUM(COALESCE(cc.pago_minimo, cc.saldo_actual * 0.05)), 0)::DECIMAL(15, 2) as pago_minimo_total,
    COALESCE(SUM(calculate_monthly_interest(cc.saldo_actual, cc.tasa_interes_anual)), 0)::DECIMAL(15, 2) as intereses_mensuales,
    COUNT(*)::INTEGER as num_tarjetas
  FROM credit_cards cc
  WHERE cc.user_id = p_user_id
    AND cc.activa = true
    AND cc.saldo_actual > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. COMENTARIOS
COMMENT ON TABLE credit_cards IS 'Tarjetas de crédito del usuario con tasas de interés para asesoría de deuda';
COMMENT ON TABLE credit_card_payments IS 'Historial de pagos a tarjetas de crédito';
COMMENT ON COLUMN credit_cards.tasa_interes_anual IS 'Tasa de interés anual (APR) en porcentaje, ej: 45.00 = 45%';
COMMENT ON COLUMN credit_cards.saldo_actual IS 'Deuda actual en la tarjeta';
COMMENT ON COLUMN credit_cards.fecha_corte IS 'Día del mes (1-31) en que cierra el período';
COMMENT ON COLUMN credit_cards.fecha_pago IS 'Día del mes (1-31) límite para pagar';

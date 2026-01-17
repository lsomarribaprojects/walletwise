-- =====================================================
-- WALLETWISE: Sistema de Suscripciones
-- Migración: 007_user_subscriptions.sql
-- Fecha: 2026-01-15
-- =====================================================

-- Tipos ENUM para suscripciones
CREATE TYPE subscription_tier AS ENUM ('starter', 'pro', 'premium');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete');

-- =====================================================
-- TABLA: user_subscriptions
-- Almacena la suscripción activa de cada usuario
-- =====================================================
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Tier y estado
  tier subscription_tier DEFAULT 'starter' NOT NULL,
  status subscription_status DEFAULT 'active' NOT NULL,

  -- Stripe IDs
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,

  -- Período de facturación
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,

  -- Trial
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_subscription UNIQUE(user_id),
  CONSTRAINT valid_stripe_ids CHECK (
    (tier = 'starter') OR
    (stripe_customer_id IS NOT NULL AND stripe_subscription_id IS NOT NULL)
  )
);

-- =====================================================
-- TABLA: subscription_usage
-- Trackea el uso de features con límites
-- =====================================================
CREATE TABLE subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Período de uso (se resetea mensualmente)
  period_start DATE NOT NULL DEFAULT DATE_TRUNC('month', CURRENT_DATE),
  period_end DATE NOT NULL DEFAULT (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE,

  -- Contadores de uso
  transactions_count INTEGER DEFAULT 0,
  cfo_messages_count INTEGER DEFAULT 0,
  receipt_scans_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un registro por usuario por período
  CONSTRAINT unique_user_period UNIQUE(user_id, period_start)
);

-- =====================================================
-- TABLA: subscription_events
-- Log de eventos de suscripción (auditoría)
-- =====================================================
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- 'created', 'upgraded', 'downgraded', 'canceled', 'renewed', 'payment_failed'
  from_tier subscription_tier,
  to_tier subscription_tier,
  stripe_event_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX idx_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_sub ON user_subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_subscriptions_tier ON user_subscriptions(tier);

CREATE INDEX idx_usage_user ON subscription_usage(user_id);
CREATE INDEX idx_usage_period ON subscription_usage(user_id, period_start);

CREATE INDEX idx_events_user ON subscription_events(user_id);
CREATE INDEX idx_events_type ON subscription_events(event_type);
CREATE INDEX idx_events_created ON subscription_events(created_at DESC);

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Políticas para user_subscriptions
CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions"
  ON user_subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Políticas para subscription_usage
CREATE POLICY "Users can view own usage"
  ON subscription_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON subscription_usage FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all usage"
  ON subscription_usage FOR ALL
  USING (auth.role() = 'service_role');

-- Políticas para subscription_events
CREATE POLICY "Users can view own events"
  ON subscription_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all events"
  ON subscription_events FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_updated_at
  BEFORE UPDATE ON subscription_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCIONES
-- =====================================================

-- Función: Crear suscripción starter para nuevos usuarios
CREATE OR REPLACE FUNCTION create_starter_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'starter', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-crear suscripción starter cuando se crea usuario
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_starter_subscription();

-- Función: Obtener límites por tier
CREATE OR REPLACE FUNCTION get_tier_limits(p_tier subscription_tier)
RETURNS JSONB AS $$
BEGIN
  RETURN CASE p_tier
    WHEN 'starter' THEN '{
      "transactions": 100,
      "accounts": 3,
      "recurring": 5,
      "credit_cards": 0,
      "loans": 0,
      "cfo_messages": 10,
      "receipt_scans": 5,
      "futures_module": false,
      "monte_carlo": false,
      "credit_scores": false,
      "reports_export": false
    }'::JSONB
    WHEN 'pro' THEN '{
      "transactions": -1,
      "accounts": 10,
      "recurring": -1,
      "credit_cards": 5,
      "loans": 5,
      "cfo_messages": 100,
      "receipt_scans": 50,
      "futures_module": true,
      "monte_carlo": false,
      "credit_scores": false,
      "reports_export": true
    }'::JSONB
    WHEN 'premium' THEN '{
      "transactions": -1,
      "accounts": -1,
      "recurring": -1,
      "credit_cards": -1,
      "loans": -1,
      "cfo_messages": -1,
      "receipt_scans": -1,
      "futures_module": true,
      "monte_carlo": true,
      "credit_scores": true,
      "reports_export": true
    }'::JSONB
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función: Verificar si usuario puede usar feature
CREATE OR REPLACE FUNCTION check_feature_access(
  p_user_id UUID,
  p_feature TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier subscription_tier;
  v_limits JSONB;
  v_limit INTEGER;
  v_usage INTEGER;
BEGIN
  -- Obtener tier del usuario
  SELECT tier INTO v_tier
  FROM user_subscriptions
  WHERE user_id = p_user_id AND status = 'active';

  IF v_tier IS NULL THEN
    v_tier := 'starter';
  END IF;

  -- Obtener límites
  v_limits := get_tier_limits(v_tier);

  -- Verificar features booleanas
  IF p_feature IN ('futures_module', 'monte_carlo', 'credit_scores', 'reports_export') THEN
    RETURN (v_limits->>p_feature)::BOOLEAN;
  END IF;

  -- Verificar features con contadores
  v_limit := (v_limits->>p_feature)::INTEGER;

  -- -1 significa ilimitado
  IF v_limit = -1 THEN
    RETURN TRUE;
  END IF;

  -- Obtener uso actual
  SELECT
    CASE p_feature
      WHEN 'transactions' THEN transactions_count
      WHEN 'cfo_messages' THEN cfo_messages_count
      WHEN 'receipt_scans' THEN receipt_scans_count
      ELSE 0
    END INTO v_usage
  FROM subscription_usage
  WHERE user_id = p_user_id
    AND period_start = DATE_TRUNC('month', CURRENT_DATE);

  IF v_usage IS NULL THEN
    v_usage := 0;
  END IF;

  RETURN v_usage < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Incrementar contador de uso
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_feature TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_can_use BOOLEAN;
BEGIN
  -- Verificar acceso
  v_can_use := check_feature_access(p_user_id, p_feature);

  IF NOT v_can_use THEN
    RETURN FALSE;
  END IF;

  -- Insertar o actualizar uso
  INSERT INTO subscription_usage (user_id, period_start, period_end)
  VALUES (
    p_user_id,
    DATE_TRUNC('month', CURRENT_DATE),
    (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE
  )
  ON CONFLICT (user_id, period_start) DO NOTHING;

  -- Incrementar contador
  UPDATE subscription_usage
  SET
    transactions_count = CASE WHEN p_feature = 'transactions' THEN transactions_count + 1 ELSE transactions_count END,
    cfo_messages_count = CASE WHEN p_feature = 'cfo_messages' THEN cfo_messages_count + 1 ELSE cfo_messages_count END,
    receipt_scans_count = CASE WHEN p_feature = 'receipt_scans' THEN receipt_scans_count + 1 ELSE receipt_scans_count END,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND period_start = DATE_TRUNC('month', CURRENT_DATE);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: Obtener información completa de suscripción
CREATE OR REPLACE FUNCTION get_subscription_info(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_subscription RECORD;
  v_usage RECORD;
  v_limits JSONB;
BEGIN
  -- Obtener suscripción
  SELECT * INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id;

  -- Si no existe, crear starter
  IF v_subscription IS NULL THEN
    INSERT INTO user_subscriptions (user_id, tier, status)
    VALUES (p_user_id, 'starter', 'active')
    RETURNING * INTO v_subscription;
  END IF;

  -- Obtener uso actual
  SELECT * INTO v_usage
  FROM subscription_usage
  WHERE user_id = p_user_id
    AND period_start = DATE_TRUNC('month', CURRENT_DATE);

  -- Obtener límites
  v_limits := get_tier_limits(v_subscription.tier);

  RETURN jsonb_build_object(
    'tier', v_subscription.tier,
    'status', v_subscription.status,
    'current_period_start', v_subscription.current_period_start,
    'current_period_end', v_subscription.current_period_end,
    'cancel_at_period_end', v_subscription.cancel_at_period_end,
    'limits', v_limits,
    'usage', jsonb_build_object(
      'transactions', COALESCE(v_usage.transactions_count, 0),
      'cfo_messages', COALESCE(v_usage.cfo_messages_count, 0),
      'receipt_scans', COALESCE(v_usage.receipt_scans_count, 0)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE user_subscriptions IS 'Suscripciones de usuarios con integración Stripe';
COMMENT ON TABLE subscription_usage IS 'Uso mensual de features con límites por tier';
COMMENT ON TABLE subscription_events IS 'Log de eventos de suscripción para auditoría';
COMMENT ON FUNCTION get_tier_limits IS 'Retorna los límites de features por tier';
COMMENT ON FUNCTION check_feature_access IS 'Verifica si un usuario puede usar una feature específica';
COMMENT ON FUNCTION increment_usage IS 'Incrementa el contador de uso de una feature';
COMMENT ON FUNCTION get_subscription_info IS 'Obtiene información completa de suscripción del usuario';

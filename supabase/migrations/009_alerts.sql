-- ============================================================================
-- FASE 8: SISTEMA DE ALERTAS PROACTIVAS
-- ============================================================================
-- Descripción: Sistema inteligente de alertas que detecta patrones y oportunidades
-- Autor: Claude Code
-- Fecha: 2026-01-15
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE alert_type AS ENUM (
  'warning',        -- Advertencias (gasto inusual, crédito alto)
  'opportunity',    -- Oportunidades de ahorro
  'milestone',      -- Hitos alcanzados (25%, 50%, 75%, 100% de meta)
  'recommendation'  -- Recomendaciones basadas en patrones
);

CREATE TYPE alert_priority AS ENUM (
  'low',
  'medium',
  'high'
);

-- ============================================================================
-- TABLA: user_alerts
-- ============================================================================

CREATE TABLE user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type alert_type NOT NULL,
  priority alert_priority NOT NULL DEFAULT 'medium',

  -- Contenido
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Acción opcional (CTA)
  action_label TEXT,
  action_href TEXT,

  -- Estado
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,

  -- Expiración opcional
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Metadata adicional (JSON)
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_expiration CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver y modificar sus propias alertas
CREATE POLICY "Users can view own alerts"
  ON user_alerts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts"
  ON user_alerts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON user_alerts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON user_alerts
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

-- Índice para consultas frecuentes (alertas no leídas/no descartadas)
CREATE INDEX idx_alerts_user_unread
  ON user_alerts(user_id, is_read, is_dismissed)
  WHERE is_read = false AND is_dismissed = false;

-- Índice para ordenar por fecha de creación
CREATE INDEX idx_alerts_created
  ON user_alerts(created_at DESC);

-- Índice para filtrar por tipo y prioridad
CREATE INDEX idx_alerts_type_priority
  ON user_alerts(user_id, type, priority)
  WHERE is_dismissed = false;

-- Índice para alertas expiradas (limpieza periódica)
CREATE INDEX idx_alerts_expired
  ON user_alerts(expires_at)
  WHERE expires_at IS NOT NULL;

-- ============================================================================
-- FUNCIONES AUXILIARES
-- ============================================================================

/**
 * Obtener conteo de alertas no leídas para un usuario
 */
CREATE OR REPLACE FUNCTION get_unread_alerts_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM user_alerts
    WHERE user_id = user_uuid
      AND is_read = false
      AND is_dismissed = false
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$;

/**
 * Marcar alertas expiradas como descartadas (ejecutar diariamente)
 */
CREATE OR REPLACE FUNCTION dismiss_expired_alerts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  dismissed_count INTEGER;
BEGIN
  UPDATE user_alerts
  SET is_dismissed = true
  WHERE expires_at IS NOT NULL
    AND expires_at <= NOW()
    AND is_dismissed = false;

  GET DIAGNOSTICS dismissed_count = ROW_COUNT;
  RETURN dismissed_count;
END;
$$;

/**
 * Limpiar alertas antiguas descartadas (ejecutar semanalmente)
 * Mantiene solo los últimos 90 días de alertas descartadas
 */
CREATE OR REPLACE FUNCTION cleanup_old_alerts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_alerts
  WHERE is_dismissed = true
    AND created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON TABLE user_alerts IS 'Alertas proactivas para usuarios basadas en patrones financieros';
COMMENT ON COLUMN user_alerts.type IS 'Tipo de alerta: warning, opportunity, milestone, recommendation';
COMMENT ON COLUMN user_alerts.priority IS 'Prioridad: low, medium, high';
COMMENT ON COLUMN user_alerts.action_label IS 'Texto del botón de acción (ej: "Ver detalles", "Configurar presupuesto")';
COMMENT ON COLUMN user_alerts.action_href IS 'URL de la acción (ej: "/budgets/create")';
COMMENT ON COLUMN user_alerts.metadata IS 'Datos adicionales en formato JSON (ej: {"category_id": "...", "amount": 500})';
COMMENT ON COLUMN user_alerts.expires_at IS 'Fecha de expiración opcional (ej: alerta de pago vence en 3 días)';

COMMENT ON FUNCTION get_unread_alerts_count IS 'Retorna el número de alertas no leídas y no expiradas para un usuario';
COMMENT ON FUNCTION dismiss_expired_alerts IS 'Marca como descartadas las alertas que han expirado';
COMMENT ON FUNCTION cleanup_old_alerts IS 'Elimina alertas descartadas con más de 90 días de antigüedad';

-- ============================================================================
-- DATOS DE EJEMPLO (OPCIONAL - comentado por defecto)
-- ============================================================================

/*
-- Ejemplo de alerta de advertencia
INSERT INTO user_alerts (user_id, type, priority, title, message, action_label, action_href, metadata)
VALUES (
  'user-uuid-here',
  'warning',
  'high',
  'Gasto inusual detectado',
  'Tu gasto en "Entretenimiento" este mes es 2.5x mayor que tu promedio habitual ($500 vs $200).',
  'Ver gastos',
  '/transactions?category=entertainment',
  '{"category_id": "uuid", "amount": 500, "average": 200, "multiplier": 2.5}'
);

-- Ejemplo de alerta de oportunidad
INSERT INTO user_alerts (user_id, type, priority, title, message, action_label, action_href)
VALUES (
  'user-uuid-here',
  'opportunity',
  'medium',
  'Oportunidad de ahorro detectada',
  'Podrías ahorrar $120/año cancelando suscripciones no utilizadas en los últimos 3 meses.',
  'Revisar suscripciones',
  '/subscriptions'
);

-- Ejemplo de alerta de hito
INSERT INTO user_alerts (user_id, type, priority, title, message)
VALUES (
  'user-uuid-here',
  'milestone',
  'low',
  '¡Meta alcanzada!',
  'Has alcanzado el 50% de tu meta de ahorro mensual. ¡Sigue así!'
);

-- Ejemplo de alerta con expiración (3 días antes del pago)
INSERT INTO user_alerts (user_id, type, priority, title, message, expires_at, action_label, action_href)
VALUES (
  'user-uuid-here',
  'warning',
  'high',
  'Pago próximo',
  'Tu pago de tarjeta de crédito Banamex vence en 3 días ($1,250.00).',
  NOW() + INTERVAL '3 days',
  'Ir a tarjetas',
  '/credit-cards'
);
*/

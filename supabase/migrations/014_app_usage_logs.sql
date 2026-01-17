-- Migration: app_usage_logs
-- Tabla para logs de uso de la aplicacion

CREATE TABLE IF NOT EXISTS app_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para consultas rapidas
CREATE INDEX IF NOT EXISTS idx_usage_user ON app_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_action ON app_usage_logs(action);
CREATE INDEX IF NOT EXISTS idx_usage_created ON app_usage_logs(created_at DESC);

-- Enable RLS
ALTER TABLE app_usage_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins pueden ver todos los logs
CREATE POLICY "Admins can view all usage"
  ON app_usage_logs FOR SELECT
  USING (is_admin());

-- Policy: Usuarios pueden crear sus propios logs
CREATE POLICY "Users can create own logs"
  ON app_usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Funcion para registrar uso
CREATE OR REPLACE FUNCTION log_app_usage(
  p_action TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO app_usage_logs (user_id, action, metadata)
  VALUES (auth.uid(), p_action, p_metadata)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vista para estadisticas de admin
CREATE OR REPLACE VIEW admin_usage_stats AS
SELECT
  action,
  COUNT(*) as total_count,
  COUNT(DISTINCT user_id) as unique_users,
  DATE_TRUNC('day', created_at) as day
FROM app_usage_logs
GROUP BY action, DATE_TRUNC('day', created_at)
ORDER BY day DESC, total_count DESC;

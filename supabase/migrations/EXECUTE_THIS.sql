-- ============================================================================
-- WALLETWISE - MIGRATION COMPLETA
-- Ejecuta este archivo en: https://supabase.com/dashboard/project/fyppzlepkvfltmdrludz/sql/new
-- ============================================================================

-- 1. TABLA DE CUENTAS BANCARIAS
CREATE TABLE IF NOT EXISTS cuentas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('debito', 'credito', 'efectivo')),
  balance_inicial DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
  fecha_corte TEXT DEFAULT '1',
  color TEXT,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. TABLA DE TRANSACCIONES
CREATE TABLE IF NOT EXISTS transacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'gasto', 'transferencia')),
  monto DECIMAL(15, 2) NOT NULL,
  categoria TEXT NOT NULL,
  descripcion TEXT,
  fecha_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  cuenta TEXT NOT NULL,
  cuenta_destino TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. TABLA DE GASTOS MENSUALES (RECURRENTES)
CREATE TABLE IF NOT EXISTS gastos_mensuales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_app TEXT NOT NULL,
  categoria TEXT NOT NULL,
  dia_de_cobro INTEGER NOT NULL CHECK (dia_de_cobro >= 1 AND dia_de_cobro <= 31),
  monto DECIMAL(15, 2) NOT NULL,
  activo BOOLEAN DEFAULT true,
  cuenta TEXT NOT NULL,
  ultimo_procesado DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. TABLA DE GASTOS ANUALES
CREATE TABLE IF NOT EXISTS gastos_anuales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_servicio TEXT NOT NULL,
  categoria TEXT NOT NULL,
  mes_de_cobro INTEGER NOT NULL CHECK (mes_de_cobro >= 1 AND mes_de_cobro <= 12),
  dia_de_cobro INTEGER NOT NULL CHECK (dia_de_cobro >= 1 AND dia_de_cobro <= 31),
  monto DECIMAL(15, 2) NOT NULL,
  activo BOOLEAN DEFAULT true,
  cuenta TEXT NOT NULL,
  ultimo_procesado DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. TABLA DE SESIONES DEL AGENTE CFO
CREATE TABLE IF NOT EXISTS agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nueva sesion',
  model TEXT NOT NULL DEFAULT 'haiku-4.5',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. TABLA DE ACCIONES DEL AGENTE
CREATE TABLE IF NOT EXISTS agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES agent_sessions(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('user_message', 'think', 'message', 'analyze', 'calculate', 'recommend', 'alert')),
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================================
-- INDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_transacciones_user_id ON transacciones(user_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON transacciones(fecha_hora DESC);
CREATE INDEX IF NOT EXISTS idx_transacciones_user_fecha ON transacciones(user_id, fecha_hora DESC);

CREATE INDEX IF NOT EXISTS idx_gastos_mensuales_user_id ON gastos_mensuales(user_id);
CREATE INDEX IF NOT EXISTS idx_gastos_mensuales_activo ON gastos_mensuales(user_id, activo);

CREATE INDEX IF NOT EXISTS idx_gastos_anuales_user_id ON gastos_anuales(user_id);
CREATE INDEX IF NOT EXISTS idx_gastos_anuales_activo ON gastos_anuales(user_id, activo);

CREATE INDEX IF NOT EXISTS idx_cuentas_user_id ON cuentas(user_id);
CREATE INDEX IF NOT EXISTS idx_cuentas_activa ON cuentas(user_id, activa);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_id ON agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_updated ON agent_sessions(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_actions_session ON agent_actions(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_actions_session_created ON agent_actions(session_id, created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE cuentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_mensuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_anuales ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_actions ENABLE ROW LEVEL SECURITY;

-- Politicas para CUENTAS
CREATE POLICY "Users can view own cuentas" ON cuentas
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cuentas" ON cuentas
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cuentas" ON cuentas
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cuentas" ON cuentas
  FOR DELETE USING (auth.uid() = user_id);

-- Politicas para TRANSACCIONES
CREATE POLICY "Users can view own transacciones" ON transacciones
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transacciones" ON transacciones
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transacciones" ON transacciones
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transacciones" ON transacciones
  FOR DELETE USING (auth.uid() = user_id);

-- Politicas para GASTOS_MENSUALES
CREATE POLICY "Users can view own gastos_mensuales" ON gastos_mensuales
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gastos_mensuales" ON gastos_mensuales
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gastos_mensuales" ON gastos_mensuales
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own gastos_mensuales" ON gastos_mensuales
  FOR DELETE USING (auth.uid() = user_id);

-- Politicas para GASTOS_ANUALES
CREATE POLICY "Users can view own gastos_anuales" ON gastos_anuales
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own gastos_anuales" ON gastos_anuales
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own gastos_anuales" ON gastos_anuales
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own gastos_anuales" ON gastos_anuales
  FOR DELETE USING (auth.uid() = user_id);

-- Politicas para AGENT_SESSIONS
CREATE POLICY "Users can view own sessions" ON agent_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON agent_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON agent_sessions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON agent_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Politicas para AGENT_ACTIONS (via session ownership)
CREATE POLICY "Users can view own actions" ON agent_actions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM agent_sessions WHERE id = agent_actions.session_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can insert own actions" ON agent_actions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM agent_sessions WHERE id = agent_actions.session_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can delete own actions" ON agent_actions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM agent_sessions WHERE id = agent_actions.session_id AND user_id = auth.uid())
  );

-- ============================================================================
-- DATOS INICIALES - CUENTAS POR DEFECTO
-- (Se insertan solo si no existen, usando el primer usuario que se registre)
-- ============================================================================

-- Funcion para crear cuentas por defecto cuando un usuario se registra
CREATE OR REPLACE FUNCTION create_default_accounts()
RETURNS TRIGGER AS $$
BEGIN
  -- Crear cuentas por defecto para el nuevo usuario
  INSERT INTO cuentas (user_id, nombre, tipo, balance_inicial, color) VALUES
    (NEW.id, 'Nubank Daniel', 'debito', 0, '#820AD1'),
    (NEW.id, 'Bancoppel Daniel', 'debito', 0, '#FFD000'),
    (NEW.id, 'Efectivo', 'efectivo', 0, '#22C55E'),
    (NEW.id, 'Nu credito Diana', 'credito', 0, '#820AD1'),
    (NEW.id, 'Bancoppel Diana', 'debito', 0, '#FFD000');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear cuentas automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_accounts();

-- ============================================================================
-- LISTO!
-- ============================================================================

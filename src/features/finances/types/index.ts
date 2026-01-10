// Cuentas bancarias - ahora dinámicas desde la BD
// El array vacío es solo para compatibilidad, las cuentas reales vienen de la BD
export const CUENTAS: string[] = []

export type Cuenta = string

// Tipos de transacciones
export type TipoTransaccion = 'ingreso' | 'gasto' | 'transferencia'

export interface Transaction {
  id: string
  tipo: TipoTransaccion
  monto: number
  categoria: string
  descripcion?: string
  fecha_hora: string
  cuenta: Cuenta
  cuenta_destino?: Cuenta | null  // Solo para transferencias
  created_at?: string
}

export interface TransactionInput {
  tipo: TipoTransaccion
  monto: number
  categoria: string
  descripcion?: string
  fecha_hora?: string
  cuenta: Cuenta
  cuenta_destino?: Cuenta  // Solo requerido para transferencias
}

// Gastos recurrentes mensuales
export interface GastoMensual {
  id: string
  nombre_app: string
  categoria: string
  dia_de_cobro: number
  monto: number
  activo: boolean
  cuenta: Cuenta
  created_at?: string
}

export interface GastoMensualInput {
  nombre_app: string
  categoria: string
  dia_de_cobro: number
  monto: number
  activo?: boolean
  cuenta: Cuenta
}

// Gastos recurrentes anuales
export interface GastoAnual {
  id: string
  nombre_servicio: string
  categoria: string
  mes_de_cobro: number
  dia_de_cobro: number
  monto: number
  activo: boolean
  cuenta: Cuenta
  created_at?: string
}

export interface GastoAnualInput {
  nombre_servicio: string
  categoria: string
  mes_de_cobro: number
  dia_de_cobro: number
  monto: number
  activo?: boolean
  cuenta: Cuenta
}

// Re-exportar categorías desde la fuente única de verdad
export {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type ExpenseCategory,
  type IncomeCategory,
} from '@/lib/categoryColors'

// KPIs financieros
export interface FinanceKPIs {
  totalIngresos: number
  totalGastos: number
  balance: number
  transaccionesCount: number
}

// Filtros de vista
export type VistaRango = 'diaria' | 'semanal' | 'mensual' | 'personalizada'

export interface FiltroFechas {
  vista: VistaRango
  fechaInicio?: Date
  fechaFin?: Date
}

// Cuenta desde BD (con balance inicial)
export type TipoCuenta = 'debito' | 'credito' | 'efectivo' | 'ahorro' | 'inversion'

export interface CuentaDB {
  id: string
  user_id?: string
  nombre: string
  tipo: TipoCuenta
  balance_inicial: number
  fecha_corte?: string | null
  color: string | null
  icono?: string | null
  activa: boolean
  created_at?: string
  updated_at?: string
}

export interface CuentaInput {
  nombre: string
  tipo: TipoCuenta
  balance_inicial?: number
  color?: string
  icono?: string
}

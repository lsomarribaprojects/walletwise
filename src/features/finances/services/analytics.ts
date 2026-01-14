import { Transaction, GastoMensual, GastoAnual, CuentaDB, TipoCuenta } from '../types'

export interface CuentaBalance {
  cuenta: string
  balance: number
  balanceInicial: number
  ingresos: number
  gastos: number
  tipo: TipoCuenta
  color: string
}

export interface CategorySummary {
  categoria: string
  total: number
  porcentaje: number
  count: number
}

export interface TrendDataPoint {
  fecha: string
  ingresos: number
  gastos: number
}

export interface CategoryTrendDataPoint {
  fecha: string
  categorias: Record<string, number>
}

// Agrupa transacciones por categoria
export function summarizeByCategory(
  transactions: Transaction[],
  tipo: 'ingreso' | 'gasto'
): CategorySummary[] {
  const filtered = transactions.filter((t) => t.tipo === tipo)
  const total = filtered.reduce((sum, t) => sum + Number(t.monto), 0)

  const grouped = filtered.reduce(
    (acc, t) => {
      const cat = t.categoria
      if (!acc[cat]) {
        acc[cat] = { total: 0, count: 0 }
      }
      acc[cat].total += Number(t.monto)
      acc[cat].count += 1
      return acc
    },
    {} as Record<string, { total: number; count: number }>
  )

  return Object.entries(grouped)
    .map(([categoria, data]) => ({
      categoria,
      total: data.total,
      porcentaje: total > 0 ? (data.total / total) * 100 : 0,
      count: data.count,
    }))
    .sort((a, b) => b.total - a.total)
}

// Genera datos para grafica de tendencias
export function generateTrendData(
  transactions: Transaction[],
  days: number = 30
): TrendDataPoint[] {
  const now = new Date()
  const result: TrendDataPoint[] = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const dayTransactions = transactions.filter((t) => {
      const tDate = new Date(t.fecha_hora).toISOString().split('T')[0]
      return tDate === dateStr
    })

    const ingresos = dayTransactions
      .filter((t) => t.tipo === 'ingreso')
      .reduce((sum, t) => sum + Number(t.monto), 0)

    const gastos = dayTransactions
      .filter((t) => t.tipo === 'gasto')
      .reduce((sum, t) => sum + Number(t.monto), 0)

    result.push({ fecha: dateStr, ingresos, gastos })
  }

  return result
}

// Genera datos para gráfica de tendencias por categoría
export function generateCategoryTrendData(
  transactions: Transaction[],
  tipo: 'ingreso' | 'gasto',
  days: number = 30
): { labels: string[]; categories: string[]; data: Record<string, number[]> } {
  const now = new Date()
  const labels: string[] = []
  const dataByCategory: Record<string, number[]> = {}

  // Obtener todas las categorías únicas del tipo
  const categories = [
    ...new Set(
      transactions.filter((t) => t.tipo === tipo).map((t) => t.categoria)
    ),
  ]

  // Inicializar arrays para cada categoría
  categories.forEach((cat) => {
    dataByCategory[cat] = []
  })

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    labels.push(dateStr)

    const dayTransactions = transactions.filter((t) => {
      const tDate = new Date(t.fecha_hora).toISOString().split('T')[0]
      return tDate === dateStr && t.tipo === tipo
    })

    categories.forEach((cat) => {
      const total = dayTransactions
        .filter((t) => t.categoria === cat)
        .reduce((sum, t) => sum + Number(t.monto), 0)
      dataByCategory[cat].push(total)
    })
  }

  return { labels, categories, data: dataByCategory }
}

// Calcula total de gastos recurrentes mensuales
export function calculateMonthlyRecurring(
  gastosMensuales: GastoMensual[]
): number {
  return gastosMensuales
    .filter((g) => g.activo)
    .reduce((sum, g) => sum + Number(g.monto), 0)
}

// Calcula total de gastos recurrentes anuales (prorrateado mensual)
export function calculateAnnualRecurringMonthly(
  gastosAnuales: GastoAnual[]
): number {
  const totalAnual = gastosAnuales
    .filter((g) => g.activo)
    .reduce((sum, g) => sum + Number(g.monto), 0)
  return totalAnual / 12
}

// Obtiene gastos que vencen pronto
export function getUpcomingExpenses(
  gastosMensuales: GastoMensual[],
  daysAhead: number = 7
): GastoMensual[] {
  const today = new Date().getDate()
  const upcoming: GastoMensual[] = []

  gastosMensuales
    .filter((g) => g.activo)
    .forEach((g) => {
      const daysUntil =
        g.dia_de_cobro >= today
          ? g.dia_de_cobro - today
          : 30 - today + g.dia_de_cobro

      if (daysUntil <= daysAhead) {
        upcoming.push(g)
      }
    })

  return upcoming.sort((a, b) => {
    const daysA =
      a.dia_de_cobro >= today
        ? a.dia_de_cobro - today
        : 30 - today + a.dia_de_cobro
    const daysB =
      b.dia_de_cobro >= today
        ? b.dia_de_cobro - today
        : 30 - today + b.dia_de_cobro
    return daysA - daysB
  })
}

// Formatea moneda USD
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Formatea fecha corta
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  })
}

// Formatea fecha completa
export function formatDateFull(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Calcula balance por cuenta (con balance inicial de BD)
// Incluye transferencias: salidas restan, entradas suman
// Ahora usa las cuentas de la BD en lugar del array hardcodeado
export function calculateBalancesByCuenta(
  transactions: Transaction[],
  cuentasDB: CuentaDB[]
): CuentaBalance[] {
  return cuentasDB.map((cuentaInfo) => {
    const cuenta = cuentaInfo.nombre
    const cuentaTransactions = transactions.filter((t) => t.cuenta === cuenta)

    const ingresos = cuentaTransactions
      .filter((t) => t.tipo === 'ingreso')
      .reduce((sum, t) => sum + Number(t.monto), 0)

    const gastos = cuentaTransactions
      .filter((t) => t.tipo === 'gasto')
      .reduce((sum, t) => sum + Number(t.monto), 0)

    // Transferencias que SALEN de esta cuenta (resta)
    const transferenciasOut = cuentaTransactions
      .filter((t) => t.tipo === 'transferencia')
      .reduce((sum, t) => sum + Number(t.monto), 0)

    // Transferencias que ENTRAN a esta cuenta (suma)
    const transferenciasIn = transactions
      .filter((t) => t.tipo === 'transferencia' && t.cuenta_destino === cuenta)
      .reduce((sum, t) => sum + Number(t.monto), 0)

    const balanceInicial = cuentaInfo.balance_inicial ?? 0
    const balanceTransacciones = ingresos - gastos - transferenciasOut + transferenciasIn

    // Convertir color hex a nombre de color para las clases CSS
    const colorMap: Record<string, string> = {
      '#9333EA': 'purple',
      '#3B82F6': 'blue',
      '#22C55E': 'emerald',
      '#F59E0B': 'amber',
      '#EF4444': 'red',
      '#EC4899': 'pink',
      '#06B6D4': 'cyan',
      '#6366F1': 'indigo',
      '#820AD1': 'purple',
      '#FFD000': 'amber',
    }

    return {
      cuenta,
      balance: balanceInicial + balanceTransacciones,
      balanceInicial,
      ingresos,
      gastos,
      tipo: cuentaInfo.tipo,
      color: colorMap[cuentaInfo.color || ''] || 'gray',
    }
  })
}

// Calcula balance total sumando todas las cuentas
export function calculateBalanceTotal(cuentaBalances: CuentaBalance[]): number {
  return cuentaBalances.reduce((sum, c) => sum + c.balance, 0)
}

// ============================================================
// GASTOS COMPROMETIDOS - Sistema de proyección de gastos
// ============================================================

export interface CommittedExpense {
  id: string
  nombre: string
  monto: number
  categoria: string
  dia_cobro: number
  cuenta: string
  tipo: 'mensual' | 'anual'
  dias_restantes: number
  ya_pagado: boolean
}

export interface CommittedSummary {
  total_comprometido: number
  total_pendiente: number
  total_pagado: number
  gastos: CommittedExpense[]
  por_cuenta: Record<string, { comprometido: number; pendiente: number }>
}

export interface ProjectedBalance {
  balance_actual: number
  gastos_comprometidos: number
  balance_proyectado: number
  tiene_fondos_suficientes: boolean
  deficit: number
  alerta: 'ok' | 'warning' | 'danger'
  mensaje_alerta: string
}

/**
 * Calcula los gastos comprometidos del mes actual
 * Incluye gastos mensuales y anuales que caen este mes
 */
export function calculateCommittedExpenses(
  gastosMensuales: GastoMensual[],
  gastosAnuales: GastoAnual[],
  transactions: Transaction[]
): CommittedSummary {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth() + 1
  const currentYear = today.getFullYear()

  const gastos: CommittedExpense[] = []
  const porCuenta: Record<string, { comprometido: number; pendiente: number }> = {}

  // Procesar gastos mensuales activos
  gastosMensuales
    .filter(g => g.activo)
    .forEach(g => {
      const diaCobro = g.dia_de_cobro
      const diasRestantes = diaCobro >= currentDay
        ? diaCobro - currentDay
        : 0 // Ya pasó este mes

      // Verificar si ya se pagó este mes
      const yaPagado = checkIfPaidThisMonth(
        g.nombre_app,
        g.monto,
        currentMonth,
        currentYear,
        transactions
      )

      gastos.push({
        id: g.id,
        nombre: g.nombre_app,
        monto: g.monto,
        categoria: g.categoria,
        dia_cobro: diaCobro,
        cuenta: g.cuenta,
        tipo: 'mensual',
        dias_restantes: diasRestantes,
        ya_pagado: yaPagado || diaCobro < currentDay,
      })

      // Agrupar por cuenta
      if (!porCuenta[g.cuenta]) {
        porCuenta[g.cuenta] = { comprometido: 0, pendiente: 0 }
      }
      porCuenta[g.cuenta].comprometido += g.monto
      if (!yaPagado && diaCobro >= currentDay) {
        porCuenta[g.cuenta].pendiente += g.monto
      }
    })

  // Procesar gastos anuales que caen este mes
  gastosAnuales
    .filter(g => g.activo && g.mes_de_cobro === currentMonth)
    .forEach(g => {
      const diaCobro = g.dia_de_cobro
      const diasRestantes = diaCobro >= currentDay
        ? diaCobro - currentDay
        : 0

      const yaPagado = checkIfPaidThisMonth(
        g.nombre_servicio,
        g.monto,
        currentMonth,
        currentYear,
        transactions
      )

      gastos.push({
        id: g.id,
        nombre: g.nombre_servicio,
        monto: g.monto,
        categoria: g.categoria,
        dia_cobro: diaCobro,
        cuenta: g.cuenta,
        tipo: 'anual',
        dias_restantes: diasRestantes,
        ya_pagado: yaPagado || diaCobro < currentDay,
      })

      if (!porCuenta[g.cuenta]) {
        porCuenta[g.cuenta] = { comprometido: 0, pendiente: 0 }
      }
      porCuenta[g.cuenta].comprometido += g.monto
      if (!yaPagado && diaCobro >= currentDay) {
        porCuenta[g.cuenta].pendiente += g.monto
      }
    })

  // Ordenar por días restantes (más próximos primero)
  gastos.sort((a, b) => {
    if (a.ya_pagado && !b.ya_pagado) return 1
    if (!a.ya_pagado && b.ya_pagado) return -1
    return a.dias_restantes - b.dias_restantes
  })

  const totalComprometido = gastos.reduce((sum, g) => sum + g.monto, 0)
  const totalPendiente = gastos
    .filter(g => !g.ya_pagado)
    .reduce((sum, g) => sum + g.monto, 0)
  const totalPagado = gastos
    .filter(g => g.ya_pagado)
    .reduce((sum, g) => sum + g.monto, 0)

  return {
    total_comprometido: totalComprometido,
    total_pendiente: totalPendiente,
    total_pagado: totalPagado,
    gastos,
    por_cuenta: porCuenta,
  }
}

/**
 * Verifica si un gasto recurrente ya se pagó este mes
 * Busca transacciones similares en el mes actual
 */
function checkIfPaidThisMonth(
  nombre: string,
  monto: number,
  mes: number,
  año: number,
  transactions: Transaction[]
): boolean {
  const startOfMonth = new Date(año, mes - 1, 1)
  const endOfMonth = new Date(año, mes, 0, 23, 59, 59)

  return transactions.some(t => {
    const fechaTx = new Date(t.fecha_hora)
    const enEsteMes = fechaTx >= startOfMonth && fechaTx <= endOfMonth
    const montoSimilar = Math.abs(Number(t.monto) - monto) < 1 // Tolerancia de $1
    const nombreSimilar = t.descripcion?.toLowerCase().includes(nombre.toLowerCase()) ||
                          t.categoria?.toLowerCase().includes(nombre.toLowerCase())

    return enEsteMes && montoSimilar && (nombreSimilar || t.tipo === 'gasto')
  })
}

/**
 * Calcula el balance proyectado después de gastos comprometidos
 */
export function calculateProjectedBalance(
  balanceActual: number,
  committed: CommittedSummary
): ProjectedBalance {
  const balanceProyectado = balanceActual - committed.total_pendiente
  const tieneFondos = balanceProyectado >= 0
  const deficit = tieneFondos ? 0 : Math.abs(balanceProyectado)

  // Determinar nivel de alerta
  let alerta: 'ok' | 'warning' | 'danger' = 'ok'
  let mensajeAlerta = ''

  if (deficit > 0) {
    alerta = 'danger'
    mensajeAlerta = `Te faltan $${deficit.toLocaleString()} para cubrir tus gastos del mes`
  } else if (balanceProyectado < committed.total_pendiente * 0.2) {
    // Si después de pagar queda menos del 20% de lo que se debe pagar
    alerta = 'warning'
    mensajeAlerta = `Después de tus pagos tendrás poco margen. Considera reducir gastos.`
  } else {
    mensajeAlerta = `Tienes fondos suficientes para cubrir tus gastos comprometidos`
  }

  return {
    balance_actual: balanceActual,
    gastos_comprometidos: committed.total_pendiente,
    balance_proyectado: balanceProyectado,
    tiene_fondos_suficientes: tieneFondos,
    deficit,
    alerta,
    mensaje_alerta: mensajeAlerta,
  }
}

/**
 * Calcula balance proyectado por cuenta específica
 */
export function calculateProjectedBalanceByCuenta(
  cuentaBalances: CuentaBalance[],
  committed: CommittedSummary
): Array<CuentaBalance & { balance_proyectado: number; alerta: 'ok' | 'warning' | 'danger' }> {
  return cuentaBalances.map(cuenta => {
    const comprometidoCuenta = committed.por_cuenta[cuenta.cuenta]?.pendiente || 0
    const balanceProyectado = cuenta.balance - comprometidoCuenta

    let alerta: 'ok' | 'warning' | 'danger' = 'ok'
    if (balanceProyectado < 0) {
      alerta = 'danger'
    } else if (balanceProyectado < comprometidoCuenta * 0.2) {
      alerta = 'warning'
    }

    return {
      ...cuenta,
      balance_proyectado: balanceProyectado,
      alerta,
    }
  })
}

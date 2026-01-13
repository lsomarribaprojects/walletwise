// services/debtCalculator.ts
// Cálculos de deuda y planes de pago para tarjetas de crédito

import type {
  CreditCard,
  CreditCardMetrics,
  DebtPaymentStrategy,
  DebtPaymentPlan,
  DebtPaymentPlanItem,
  DebtPaymentSummary,
  StrategyComparison,
} from '../types/creditCards'

/**
 * Calcula métricas agregadas de todas las tarjetas
 */
export function calculateCreditCardMetrics(cards: CreditCard[]): CreditCardMetrics {
  const activeCards = cards.filter(c => c.activa && c.saldo_actual > 0)

  if (activeCards.length === 0) {
    return {
      deuda_total: 0,
      limite_total: cards.filter(c => c.activa).reduce((sum, c) => sum + c.limite_credito, 0),
      utilizacion_promedio: 0,
      tasa_promedio_ponderada: 0,
      pago_minimo_total: 0,
      intereses_mensuales_proyectados: 0,
      num_tarjetas: cards.filter(c => c.activa).length,
    }
  }

  const deudaTotal = activeCards.reduce((sum, c) => sum + c.saldo_actual, 0)
  const limiteTotal = activeCards.reduce((sum, c) => sum + c.limite_credito, 0)

  // Tasa promedio ponderada por saldo
  const tasaPonderada = activeCards.reduce(
    (sum, c) => sum + (c.tasa_interes_anual * c.saldo_actual),
    0
  ) / deudaTotal

  // Intereses mensuales proyectados
  const interesesMensuales = activeCards.reduce((sum, c) => {
    const tasaMensual = c.tasa_interes_anual / 12 / 100
    return sum + (c.saldo_actual * tasaMensual)
  }, 0)

  // Pago mínimo total (si no está definido, usar 3% del saldo)
  const pagoMinimoTotal = activeCards.reduce(
    (sum, c) => sum + (c.pago_minimo || c.saldo_actual * 0.03),
    0
  )

  return {
    deuda_total: deudaTotal,
    limite_total: limiteTotal,
    utilizacion_promedio: limiteTotal > 0 ? (deudaTotal / limiteTotal) * 100 : 0,
    tasa_promedio_ponderada: tasaPonderada,
    pago_minimo_total: pagoMinimoTotal,
    intereses_mensuales_proyectados: interesesMensuales,
    num_tarjetas: activeCards.length,
  }
}

/**
 * Calcula meses para liquidar deuda con pago fijo mensual
 */
function calculateMonthsToPayoff(
  saldo: number,
  pagoMensual: number,
  tasaAnual: number
): number {
  if (pagoMensual <= 0 || saldo <= 0) return 0
  if (saldo <= pagoMensual) return 1

  const tasaMensual = tasaAnual / 12 / 100

  if (tasaMensual === 0) {
    return Math.ceil(saldo / pagoMensual)
  }

  // Verificar si el pago cubre al menos los intereses
  const interesesMensuales = saldo * tasaMensual
  if (pagoMensual <= interesesMensuales) {
    return Infinity // El pago no cubre ni los intereses
  }

  // Fórmula: n = -ln(1 - (r*P)/A) / ln(1+r)
  const ratio = (tasaMensual * saldo) / pagoMensual

  if (ratio >= 1) {
    return Infinity
  }

  const meses = -Math.log(1 - ratio) / Math.log(1 + tasaMensual)
  return Math.ceil(meses)
}

/**
 * Calcula intereses totales a pagar
 */
function calculateTotalInterest(
  saldo: number,
  pagoMensual: number,
  tasaAnual: number,
  meses: number
): number {
  if (meses === Infinity || meses === 0) return 0

  // Simulación mes a mes para mayor precisión
  let saldoRestante = saldo
  let interesesTotales = 0
  const tasaMensual = tasaAnual / 12 / 100

  for (let i = 0; i < meses && saldoRestante > 0; i++) {
    const interesMes = saldoRestante * tasaMensual
    interesesTotales += interesMes
    const capitalPagado = Math.min(saldoRestante, pagoMensual - interesMes)
    saldoRestante -= capitalPagado
  }

  return Math.round(interesesTotales * 100) / 100
}

/**
 * Genera plan de pago usando estrategia especificada
 */
export function generateDebtPaymentPlan(
  cards: CreditCard[],
  pagoMensualDisponible: number,
  estrategia: DebtPaymentStrategy
): DebtPaymentPlan {
  const activeCards = cards.filter(c => c.activa && c.saldo_actual > 0)

  if (activeCards.length === 0 || pagoMensualDisponible <= 0) {
    return {
      estrategia,
      tarjetas: [],
      resumen: {
        deuda_total: 0,
        pago_mensual_total: 0,
        meses_totales: 0,
        intereses_totales: 0,
        ahorro_vs_minimos: 0,
      },
    }
  }

  // Ordenar según estrategia
  const sortedCards = [...activeCards].sort((a, b) => {
    if (estrategia === 'avalancha') {
      // Mayor tasa primero (minimiza intereses totales)
      return b.tasa_interes_anual - a.tasa_interes_anual
    } else {
      // Menor saldo primero (victorias rápidas, mejor psicológicamente)
      return a.saldo_actual - b.saldo_actual
    }
  })

  // Calcular pagos mínimos totales
  const pagosMinimos = sortedCards.reduce(
    (sum, c) => sum + (c.pago_minimo || c.saldo_actual * 0.03),
    0
  )

  // Verificar si hay suficiente para cubrir mínimos
  const pagoEfectivo = Math.max(pagoMensualDisponible, pagosMinimos)

  // Dinero extra después de pagos mínimos
  const dineroExtra = Math.max(0, pagoEfectivo - pagosMinimos)

  // Asignar pagos
  const planItems: DebtPaymentPlanItem[] = sortedCards.map((card, index) => {
    const pagoMinimo = card.pago_minimo || card.saldo_actual * 0.03

    // El primero en la lista recibe el dinero extra
    const pagoSugerido = index === 0
      ? pagoMinimo + dineroExtra
      : pagoMinimo

    // Calcular meses para liquidar
    const mesesParaLiquidar = calculateMonthsToPayoff(
      card.saldo_actual,
      pagoSugerido,
      card.tasa_interes_anual
    )

    // Calcular intereses proyectados
    const interesesProyectados = calculateTotalInterest(
      card.saldo_actual,
      pagoSugerido,
      card.tasa_interes_anual,
      mesesParaLiquidar
    )

    return {
      tarjeta_id: card.id,
      nombre: card.nombre,
      banco: card.banco,
      saldo_actual: card.saldo_actual,
      tasa_interes: card.tasa_interes_anual,
      pago_sugerido: Math.round(pagoSugerido * 100) / 100,
      orden_pago: index + 1,
      meses_para_liquidar: mesesParaLiquidar === Infinity ? 999 : mesesParaLiquidar,
      intereses_proyectados: interesesProyectados,
    }
  })

  // Calcular resumen
  const interesesTotales = planItems.reduce((sum, p) => sum + p.intereses_proyectados, 0)
  const mesesTotales = Math.max(...planItems.map(p => p.meses_para_liquidar))

  // Calcular ahorro vs solo pagar mínimos
  const interesesSoloMinimos = sortedCards.reduce((sum, card) => {
    const pagoMinimo = card.pago_minimo || card.saldo_actual * 0.03
    const meses = calculateMonthsToPayoff(card.saldo_actual, pagoMinimo, card.tasa_interes_anual)
    return sum + calculateTotalInterest(card.saldo_actual, pagoMinimo, card.tasa_interes_anual, meses)
  }, 0)

  return {
    estrategia,
    tarjetas: planItems,
    resumen: {
      deuda_total: activeCards.reduce((sum, c) => sum + c.saldo_actual, 0),
      pago_mensual_total: pagoEfectivo,
      meses_totales: mesesTotales === Infinity ? 999 : mesesTotales,
      intereses_totales: Math.round(interesesTotales * 100) / 100,
      ahorro_vs_minimos: Math.round((interesesSoloMinimos - interesesTotales) * 100) / 100,
    },
  }
}

/**
 * Compara ambas estrategias y da recomendación
 */
export function compareStrategies(
  cards: CreditCard[],
  pagoMensual: number
): StrategyComparison {
  const avalancha = generateDebtPaymentPlan(cards, pagoMensual, 'avalancha')
  const bolaDeNieve = generateDebtPaymentPlan(cards, pagoMensual, 'bola_de_nieve')

  const ahorroDiferencia =
    bolaDeNieve.resumen.intereses_totales - avalancha.resumen.intereses_totales

  let recomendacion = ''
  if (ahorroDiferencia > 1000) {
    recomendacion = `La estrategia Avalancha te ahorra $${formatNumber(ahorroDiferencia)} en intereses. Recomendada si priorizas ahorrar dinero y puedes mantener la disciplina.`
  } else if (ahorroDiferencia > 100) {
    recomendacion = `Avalancha ahorra $${formatNumber(ahorroDiferencia)}, pero Bola de Nieve te da victorias rápidas que motivan. Elige según tu personalidad.`
  } else if (ahorroDiferencia > 0) {
    recomendacion = `Ambas estrategias son muy similares (diferencia de $${formatNumber(ahorroDiferencia)}). Bola de Nieve puede ser mejor para la motivación.`
  } else {
    recomendacion = 'Ambas estrategias tienen el mismo costo. Elige Bola de Nieve para victorias rápidas.'
  }

  return {
    avalancha,
    bola_de_nieve: bolaDeNieve,
    recomendacion,
    ahorro_avalancha: ahorroDiferencia,
  }
}

/**
 * Calcula cuánto debería pagar mensualmente para liquidar en X meses
 */
export function calculateRequiredPayment(
  saldo: number,
  tasaAnual: number,
  mesesObjetivo: number
): number {
  if (mesesObjetivo <= 0 || saldo <= 0) return 0

  const tasaMensual = tasaAnual / 12 / 100

  if (tasaMensual === 0) {
    return saldo / mesesObjetivo
  }

  // Fórmula: A = P * [r(1+r)^n] / [(1+r)^n - 1]
  const factor = Math.pow(1 + tasaMensual, mesesObjetivo)
  const pago = saldo * (tasaMensual * factor) / (factor - 1)

  return Math.round(pago * 100) / 100
}

/**
 * Rangos de utilización de crédito según estándares bancarios (FICO/Bureaus de crédito)
 * - 0-10%: Excelente - Score crediticio óptimo
 * - 10-30%: Bueno - Rango saludable
 * - 30-50%: Precaución - Puede afectar score
 * - >50%: Peligroso - Daña significativamente el score crediticio
 */
export type UtilizationLevel = 'excellent' | 'good' | 'warning' | 'danger'

export interface UtilizationInfo {
  level: UtilizationLevel
  color: string
  bgColor: string
  textColor: string
  maxPercent: number
  description: string
}

const UTILIZATION_THRESHOLDS = {
  excellent: 10,  // 0-10%
  good: 30,       // 10-30%
  warning: 50,    // 30-50%
  // > 50% = danger
}

/**
 * Obtiene el nivel de utilización (para indicadores de color)
 * Basado en estándares de bureaus de crédito (FICO, Equifax, TransUnion)
 */
export function getUtilizationLevel(utilizacion: number): UtilizationLevel {
  if (utilizacion <= UTILIZATION_THRESHOLDS.excellent) return 'excellent'
  if (utilizacion <= UTILIZATION_THRESHOLDS.good) return 'good'
  if (utilizacion <= UTILIZATION_THRESHOLDS.warning) return 'warning'
  return 'danger'
}

/**
 * Obtiene información completa de utilización para UI
 */
export function getUtilizationInfo(utilizacion: number): UtilizationInfo {
  const level = getUtilizationLevel(utilizacion)

  const configs: Record<UtilizationLevel, Omit<UtilizationInfo, 'level'>> = {
    excellent: {
      color: '#10B981',      // green-500
      bgColor: '#D1FAE5',    // green-100
      textColor: '#065F46',  // green-800
      maxPercent: UTILIZATION_THRESHOLDS.excellent,
      description: 'Excelente para tu score crediticio',
    },
    good: {
      color: '#3B82F6',      // blue-500
      bgColor: '#DBEAFE',    // blue-100
      textColor: '#1E40AF',  // blue-800
      maxPercent: UTILIZATION_THRESHOLDS.good,
      description: 'Rango saludable',
    },
    warning: {
      color: '#F59E0B',      // amber-500
      bgColor: '#FEF3C7',    // amber-100
      textColor: '#92400E',  // amber-800
      maxPercent: UTILIZATION_THRESHOLDS.warning,
      description: 'Puede afectar tu score',
    },
    danger: {
      color: '#EF4444',      // red-500
      bgColor: '#FEE2E2',    // red-100
      textColor: '#991B1B',  // red-800
      maxPercent: 100,
      description: 'Afecta negativamente tu score',
    },
  }

  return { level, ...configs[level] }
}

/**
 * Obtiene el color según nivel de utilización
 */
export function getUtilizationColor(utilizacion: number): string {
  return getUtilizationInfo(utilizacion).color
}

/**
 * Formatea número con separadores de miles
 */
function formatNumber(num: number): string {
  return num.toLocaleString('es-MX', { maximumFractionDigits: 0 })
}

/**
 * Genera resumen textual del plan para el CFO
 */
export function generatePlanSummaryText(plan: DebtPaymentPlan): string {
  const { estrategia, tarjetas, resumen } = plan

  if (tarjetas.length === 0) {
    return 'No hay tarjetas con deuda para analizar.'
  }

  const estrategiaNombre = estrategia === 'avalancha'
    ? 'Avalancha (mayor tasa primero)'
    : 'Bola de Nieve (menor saldo primero)'

  let texto = `PLAN DE PAGO - ${estrategiaNombre}\n`
  texto += `Deuda Total: $${formatNumber(resumen.deuda_total)}\n`
  texto += `Pago Mensual: $${formatNumber(resumen.pago_mensual_total)}\n`
  texto += `Tiempo para liquidar: ${resumen.meses_totales} meses\n`
  texto += `Intereses a pagar: $${formatNumber(resumen.intereses_totales)}\n`
  texto += `Ahorro vs mínimos: $${formatNumber(resumen.ahorro_vs_minimos)}\n\n`

  texto += 'ORDEN DE PAGO:\n'
  tarjetas.forEach((t, i) => {
    texto += `${i + 1}. ${t.nombre}${t.banco ? ` (${t.banco})` : ''}\n`
    texto += `   Saldo: $${formatNumber(t.saldo_actual)} | APR: ${t.tasa_interes}% | Pago: $${formatNumber(t.pago_sugerido)}\n`
  })

  return texto
}

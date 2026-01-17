/**
 * Detectores de Alertas Proactivas
 * Analiza patrones financieros y genera alertas automáticas
 */

import { createClient } from '@/lib/supabase/client'
import type { CreateAlertInput, DetectionResult } from '../types'
import type { Transaction, Budget, Category } from '@/shared/types/database'
import type { CreditCard } from '@/features/finances/types/creditCards'

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const DEFAULT_LOOKBACK_DAYS = 90
const UNUSUAL_SPENDING_MULTIPLIER = 2.0 // 2x el promedio
const HIGH_CREDIT_UTILIZATION_THRESHOLD = 0.3 // 30%
const UPCOMING_PAYMENT_DAYS = 3 // Alertar 3 días antes
const BUDGET_MILESTONES = [0.25, 0.5, 0.75, 1.0] // 25%, 50%, 75%, 100%

// ============================================================================
// DETECTOR PRINCIPAL
// ============================================================================

/**
 * Ejecuta todos los detectores y genera alertas
 */
export async function runAllDetectors(): Promise<DetectionResult> {
  const results: CreateAlertInput[] = []

  try {
    // Ejecutar todos los detectores en paralelo
    const [
      unusualSpending,
      highCreditUtilization,
      upcomingPayments,
      budgetMilestones,
      savingsOpportunities
    ] = await Promise.all([
      detectUnusualSpending(),
      detectHighCreditUtilization(),
      detectUpcomingPayments(),
      detectBudgetMilestones(),
      detectSavingsOpportunities()
    ])

    results.push(...unusualSpending)
    results.push(...highCreditUtilization)
    results.push(...upcomingPayments)
    results.push(...budgetMilestones)
    results.push(...savingsOpportunities)

  } catch (error) {
    console.error('Error running alert detectors:', error)
  }

  return {
    alerts: results,
    detected_at: new Date().toISOString(),
    detector_name: 'all'
  }
}

// ============================================================================
// 1. DETECTOR: GASTO INUSUAL
// ============================================================================

/**
 * Detecta gastos inusuales por categoría (>2x promedio)
 */
async function detectUnusualSpending(): Promise<CreateAlertInput[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const alerts: CreateAlertInput[] = []

  try {
    // Obtener todas las categorías de gasto
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .eq('is_active', true)

    if (!categories || categories.length === 0) return []

    // Calcular fechas
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)

    // Analizar cada categoría
    for (const category of categories) {
      // Gasto del mes actual
      const { data: currentMonthTxs } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('category_id', category.id)
        .eq('type', 'expense')
        .gte('transaction_date', currentMonthStart.toISOString())

      const currentAmount = currentMonthTxs?.reduce((sum, t) => sum + t.amount, 0) || 0

      // Promedio de los últimos 3 meses
      const { data: historicalTxs } = await supabase
        .from('transactions')
        .select('amount, transaction_date')
        .eq('user_id', user.id)
        .eq('category_id', category.id)
        .eq('type', 'expense')
        .gte('transaction_date', threeMonthsAgo.toISOString())
        .lt('transaction_date', currentMonthStart.toISOString())

      if (!historicalTxs || historicalTxs.length < 3) continue // Necesitamos datos históricos

      const totalHistorical = historicalTxs.reduce((sum, t) => sum + t.amount, 0)
      const avgMonthly = totalHistorical / 3

      // Si el gasto actual es 2x el promedio y es significativo (>$50)
      if (currentAmount > avgMonthly * UNUSUAL_SPENDING_MULTIPLIER && currentAmount > 50) {
        const multiplier = (currentAmount / avgMonthly).toFixed(1)

        alerts.push({
          type: 'warning',
          priority: currentAmount > avgMonthly * 3 ? 'high' : 'medium',
          title: 'Gasto inusual detectado',
          message: `Tu gasto en "${category.name}" este mes es ${multiplier}x mayor que tu promedio habitual ($${currentAmount.toFixed(2)} vs $${avgMonthly.toFixed(2)}).`,
          action_label: 'Ver gastos',
          action_href: `/transactions?category=${category.id}`,
          metadata: {
            category_id: category.id,
            category_name: category.name,
            amount: currentAmount,
            average: avgMonthly,
            multiplier: parseFloat(multiplier)
          }
        })
      }
    }
  } catch (error) {
    console.error('Error detecting unusual spending:', error)
  }

  return alerts
}

// ============================================================================
// 2. DETECTOR: UTILIZACIÓN DE CRÉDITO ALTA
// ============================================================================

/**
 * Detecta tarjetas con alta utilización de crédito (>30%)
 */
async function detectHighCreditUtilization(): Promise<CreateAlertInput[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const alerts: CreateAlertInput[] = []

  try {
    const { data: cards } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('activa', true)

    if (!cards || cards.length === 0) return []

    for (const card of cards as CreditCard[]) {
      const utilization = card.saldo_actual / card.limite_credito

      if (utilization > HIGH_CREDIT_UTILIZATION_THRESHOLD) {
        const percentage = (utilization * 100).toFixed(0)
        const priority = utilization > 0.7 ? 'high' : utilization > 0.5 ? 'medium' : 'low'

        alerts.push({
          type: 'warning',
          priority,
          title: 'Alta utilización de crédito',
          message: `Tu tarjeta ${card.nombre} tiene ${percentage}% de utilización ($${card.saldo_actual.toFixed(2)} de $${card.limite_credito.toFixed(2)}). Mantenerla bajo 30% mejora tu score de crédito.`,
          action_label: 'Ver tarjetas',
          action_href: '/credit-cards',
          metadata: {
            credit_card_id: card.id,
            credit_card_name: card.nombre,
            utilization_percentage: parseFloat(percentage),
            current_balance: card.saldo_actual,
            credit_limit: card.limite_credito
          }
        })
      }
    }
  } catch (error) {
    console.error('Error detecting high credit utilization:', error)
  }

  return alerts
}

// ============================================================================
// 3. DETECTOR: PAGOS PRÓXIMOS
// ============================================================================

/**
 * Detecta pagos de tarjetas próximos a vencer (3 días antes)
 */
async function detectUpcomingPayments(): Promise<CreateAlertInput[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const alerts: CreateAlertInput[] = []

  try {
    const { data: cards } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('user_id', user.id)
      .eq('activa', true)
      .gt('saldo_actual', 0)

    if (!cards || cards.length === 0) return []

    const now = new Date()
    const currentDay = now.getDate()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    for (const card of cards as CreditCard[]) {
      if (!card.fecha_pago) continue

      // Calcular próxima fecha de pago
      let paymentDate = new Date(currentYear, currentMonth, card.fecha_pago)

      // Si ya pasó este mes, usar el próximo mes
      if (paymentDate < now) {
        paymentDate = new Date(currentYear, currentMonth + 1, card.fecha_pago)
      }

      // Días hasta el pago
      const daysUntilDue = Math.ceil((paymentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      // Alertar si está dentro de 3 días
      if (daysUntilDue > 0 && daysUntilDue <= UPCOMING_PAYMENT_DAYS) {
        const amount = card.pago_no_intereses || card.pago_minimo || card.saldo_actual

        // Crear alerta que expira en la fecha de pago
        alerts.push({
          type: 'warning',
          priority: 'high',
          title: 'Pago próximo',
          message: `Tu pago de ${card.nombre} vence en ${daysUntilDue} día${daysUntilDue > 1 ? 's' : ''} ($${amount.toFixed(2)}).`,
          action_label: 'Ir a tarjetas',
          action_href: '/credit-cards',
          expires_at: paymentDate.toISOString(),
          metadata: {
            credit_card_id: card.id,
            credit_card_name: card.nombre,
            due_date: paymentDate.toISOString(),
            payment_amount: amount,
            days_until_due: daysUntilDue
          }
        })
      }
    }
  } catch (error) {
    console.error('Error detecting upcoming payments:', error)
  }

  return alerts
}

// ============================================================================
// 4. DETECTOR: HITOS DE PRESUPUESTO
// ============================================================================

/**
 * Detecta cuando se alcanzan hitos de presupuesto (25%, 50%, 75%, 100%)
 */
async function detectBudgetMilestones(): Promise<CreateAlertInput[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const alerts: CreateAlertInput[] = []

  try {
    const { data: budgets } = await supabase
      .from('budgets')
      .select('*, category:categories(*)')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (!budgets || budgets.length === 0) return []

    const now = new Date()

    for (const budget of budgets as (Budget & { category: Category })[]) {
      // Verificar que esté en el período activo
      const startDate = new Date(budget.start_date)
      const endDate = budget.end_date ? new Date(budget.end_date) : null

      if (now < startDate || (endDate && now > endDate)) continue

      // Calcular período actual
      let periodStart: Date
      let periodEnd: Date

      switch (budget.period) {
        case 'monthly':
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
          periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          break
        case 'weekly':
          const dayOfWeek = now.getDay()
          periodStart = new Date(now)
          periodStart.setDate(now.getDate() - dayOfWeek)
          periodEnd = new Date(periodStart)
          periodEnd.setDate(periodStart.getDate() + 6)
          break
        default:
          continue // Solo manejamos monthly y weekly por ahora
      }

      // Obtener gasto del período
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('category_id', budget.category_id)
        .eq('type', 'expense')
        .gte('transaction_date', periodStart.toISOString())
        .lte('transaction_date', periodEnd.toISOString())

      const spent = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0
      const percentage = spent / budget.amount

      // Verificar hitos
      for (const milestone of BUDGET_MILESTONES) {
        // Solo alertar si acabamos de cruzar el hito (dentro del 5%)
        if (percentage >= milestone && percentage < milestone + 0.05) {
          const percent = (milestone * 100).toFixed(0)

          let message: string
          let priority: 'low' | 'medium' | 'high' = 'low'
          let type: 'milestone' | 'warning' = 'milestone'

          if (milestone >= 1.0) {
            message = `Has alcanzado el 100% de tu presupuesto "${budget.name}" ($${spent.toFixed(2)} de $${budget.amount.toFixed(2)}). ¡Cuidado con los gastos adicionales!`
            priority = 'high'
            type = 'warning'
          } else if (milestone >= 0.75) {
            message = `Has alcanzado el ${percent}% de tu presupuesto "${budget.name}" ($${spent.toFixed(2)} de $${budget.amount.toFixed(2)}). Controla tus gastos para no excederte.`
            priority = 'medium'
            type = 'warning'
          } else {
            message = `Has alcanzado el ${percent}% de tu presupuesto "${budget.name}". ¡Vas por buen camino!`
            priority = 'low'
          }

          alerts.push({
            type,
            priority,
            title: milestone >= 0.75 ? 'Límite de presupuesto cercano' : 'Hito de presupuesto alcanzado',
            message,
            action_label: 'Ver presupuestos',
            action_href: '/budgets',
            metadata: {
              budget_id: budget.id,
              budget_name: budget.name,
              goal_percentage: milestone * 100,
              category_id: budget.category_id,
              category_name: budget.category.name,
              amount: spent,
              budget_amount: budget.amount
            }
          })
        }
      }
    }
  } catch (error) {
    console.error('Error detecting budget milestones:', error)
  }

  return alerts
}

// ============================================================================
// 5. DETECTOR: OPORTUNIDADES DE AHORRO
// ============================================================================

/**
 * Detecta oportunidades de ahorro (gastos recurrentes no utilizados)
 */
async function detectSavingsOpportunities(): Promise<CreateAlertInput[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const alerts: CreateAlertInput[] = []

  try {
    // Buscar gastos recurrentes activos
    const { data: recurring } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (!recurring || recurring.length === 0) return []

    // Analizar si hay gastos recurrentes sin transacciones recientes
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const unusedRecurring = []
    let totalSavings = 0

    for (const expense of recurring) {
      if (!expense.category_id) continue

      // Buscar transacciones relacionadas en los últimos 3 meses
      const { data: recentTxs } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('category_id', expense.category_id)
        .gte('transaction_date', threeMonthsAgo.toISOString())
        .limit(1)

      // Si no hay transacciones recientes, podría ser una suscripción no utilizada
      if (!recentTxs || recentTxs.length === 0) {
        unusedRecurring.push(expense)

        // Calcular ahorro anual
        let yearlyAmount = expense.amount
        switch (expense.frequency) {
          case 'monthly':
            yearlyAmount *= 12
            break
          case 'quarterly':
            yearlyAmount *= 4
            break
          case 'weekly':
            yearlyAmount *= 52
            break
          case 'daily':
            yearlyAmount *= 365
            break
        }

        totalSavings += yearlyAmount
      }
    }

    // Si hay oportunidades de ahorro significativas (>$100/año)
    if (totalSavings > 100) {
      alerts.push({
        type: 'opportunity',
        priority: totalSavings > 500 ? 'high' : 'medium',
        title: 'Oportunidad de ahorro detectada',
        message: `Podrías ahorrar $${totalSavings.toFixed(2)}/año revisando ${unusedRecurring.length} gasto${unusedRecurring.length > 1 ? 's' : ''} recurrente${unusedRecurring.length > 1 ? 's' : ''} sin actividad reciente.`,
        action_label: 'Revisar gastos recurrentes',
        action_href: '/recurring-expenses',
        metadata: {
          potential_savings: totalSavings,
          subscription_ids: unusedRecurring.map(e => e.id)
        }
      })
    }
  } catch (error) {
    console.error('Error detecting savings opportunities:', error)
  }

  return alerts
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Formatea un monto a moneda
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

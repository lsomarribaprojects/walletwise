// services/creditCardsService.ts
// CRUD para tarjetas de crédito

import { createClient } from '@/lib/supabase/client'
import type { CreditCard, CreditCardInput, CreditCardPayment } from '../types/creditCards'

/**
 * Obtener todas las tarjetas de crédito activas del usuario
 */
export async function getCreditCards(): Promise<CreditCard[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('user_id', user.id)
    .eq('activa', true)
    .order('saldo_actual', { ascending: false })

  if (error) {
    console.error('Error fetching credit cards:', error)
    return []
  }

  return data || []
}

/**
 * Obtener todas las tarjetas incluyendo inactivas
 */
export async function getAllCreditCards(): Promise<CreditCard[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('user_id', user.id)
    .order('activa', { ascending: false })
    .order('saldo_actual', { ascending: false })

  if (error) {
    console.error('Error fetching all credit cards:', error)
    return []
  }

  return data || []
}

/**
 * Obtener una tarjeta por ID
 */
export async function getCreditCardById(id: string): Promise<CreditCard | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching credit card:', error)
    return null
  }

  return data
}

/**
 * Crear nueva tarjeta de crédito
 */
export async function createCreditCard(card: CreditCardInput): Promise<CreditCard> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('credit_cards')
    .insert({
      user_id: user.id,
      nombre: card.nombre,
      banco: card.banco || null,
      ultimos_digitos: card.ultimos_digitos || null,
      tasa_interes_anual: card.tasa_interes_anual,
      limite_credito: card.limite_credito,
      saldo_actual: card.saldo_actual || 0,
      fecha_corte: card.fecha_corte || null,
      fecha_pago: card.fecha_pago || null,
      pago_minimo: card.pago_minimo || null,
      pago_no_intereses: card.pago_no_intereses || null,
      color: card.color || '#9333EA',
      activa: true,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Actualizar tarjeta de crédito
 */
export async function updateCreditCard(
  id: string,
  updates: Partial<CreditCardInput>
): Promise<CreditCard> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('credit_cards')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Eliminar tarjeta (soft delete)
 */
export async function deleteCreditCard(id: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('credit_cards')
    .update({
      activa: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  return true
}

/**
 * Actualizar saldo de tarjeta
 */
export async function updateCardBalance(
  id: string,
  nuevoSaldo: number
): Promise<CreditCard> {
  return updateCreditCard(id, { saldo_actual: nuevoSaldo } as Partial<CreditCardInput>)
}

/**
 * Registrar pago a tarjeta de crédito
 */
export async function registerPayment(
  cardId: string,
  monto: number,
  notas?: string
): Promise<CreditCardPayment> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  // Obtener tarjeta actual
  const card = await getCreditCardById(cardId)
  if (!card) throw new Error('Tarjeta no encontrada')

  const saldoAnterior = card.saldo_actual
  const saldoNuevo = Math.max(0, saldoAnterior - monto)

  // Calcular desglose aproximado
  const tasaMensual = card.tasa_interes_anual / 12 / 100
  const interesesEstimados = saldoAnterior * tasaMensual
  const montoIntereses = Math.min(monto, interesesEstimados)
  const montoCapital = Math.max(0, monto - montoIntereses)

  // Registrar pago
  const { data: payment, error: paymentError } = await supabase
    .from('credit_card_payments')
    .insert({
      user_id: user.id,
      credit_card_id: cardId,
      monto,
      saldo_anterior: saldoAnterior,
      saldo_nuevo: saldoNuevo,
      monto_capital: montoCapital,
      monto_intereses: montoIntereses,
      notas: notas || null,
    })
    .select()
    .single()

  if (paymentError) throw new Error(paymentError.message)

  // Actualizar saldo de la tarjeta
  await updateCardBalance(cardId, saldoNuevo)

  return payment
}

/**
 * Obtener historial de pagos de una tarjeta
 */
export async function getPaymentHistory(
  cardId: string,
  limit: number = 20
): Promise<CreditCardPayment[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('credit_card_payments')
    .select('*')
    .eq('credit_card_id', cardId)
    .order('fecha_pago', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching payment history:', error)
    return []
  }

  return data || []
}

/**
 * Obtener todos los pagos del usuario
 */
export async function getAllPayments(limit: number = 50): Promise<CreditCardPayment[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('credit_card_payments')
    .select('*')
    .eq('user_id', user.id)
    .order('fecha_pago', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching all payments:', error)
    return []
  }

  return data || []
}

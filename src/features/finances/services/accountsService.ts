import { createClient } from '@/lib/supabase/client'
import { CuentaDB, CuentaInput } from '../types'

// Singleton del cliente para mantener la sesión consistente
const supabase = createClient()

export async function getCuentas(): Promise<CuentaDB[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('cuentas')
    .select('*')
    .eq('user_id', user.id)
    .eq('activa', true)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching cuentas:', error)
    return []
  }

  return data || []
}

export async function createCuenta(cuenta: CuentaInput): Promise<CuentaDB | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sesión expirada. Por favor recarga la página.')

  const { data, error } = await supabase
    .from('cuentas')
    .insert({
      user_id: user.id,
      nombre: cuenta.nombre,
      tipo: cuenta.tipo,
      balance_inicial: cuenta.balance_inicial || 0,
      color: cuenta.color || '#9333EA',
      activa: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating cuenta:', error)
    throw new Error(error.message)
  }

  return data
}

export async function updateCuenta(id: string, cuenta: Partial<CuentaInput>): Promise<CuentaDB | null> {
  const { data, error } = await supabase
    .from('cuentas')
    .update({
      ...cuenta,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating cuenta:', error)
    throw new Error(error.message)
  }

  return data
}

export async function deleteCuenta(id: string): Promise<boolean> {
  // Soft delete - solo marcar como inactiva
  const { error } = await supabase
    .from('cuentas')
    .update({ activa: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error deleting cuenta:', error)
    throw new Error(error.message)
  }

  return true
}

export async function getCuentasForSelect(): Promise<{ value: string; label: string }[]> {
  const cuentas = await getCuentas()
  return cuentas.map((c) => ({
    value: c.nombre,
    label: c.nombre,
  }))
}

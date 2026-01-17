import { createClient } from '@/lib/supabase/client'
import { UserConfig, Category, CategoryType, CalculatorDefaults, DiscountCode, DiscountCodeCreate, AdminStats } from '../types'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, CATEGORY_COLORS } from '@/lib/categoryColors'

const supabase = createClient()

// Categorias default del sistema
const DEFAULT_EXPENSE_CATEGORIES: Category[] = EXPENSE_CATEGORIES.map(name => ({
  name,
  color: CATEGORY_COLORS[name] || '#6B7280'
}))

const DEFAULT_INCOME_CATEGORIES: Category[] = INCOME_CATEGORIES.map(name => ({
  name,
  color: CATEGORY_COLORS[name] || '#6B7280'
}))

export const adminService = {
  /**
   * Obtiene la config del usuario o crea una nueva con defaults
   */
  async getUserConfig(): Promise<UserConfig> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    // Intentar obtener config existente
    const { data, error } = await supabase
      .from('user_config')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message)
    }

    // Si existe, retornar (con defaults si arrays vacios)
    if (data) {
      return {
        ...data,
        expense_categories: data.expense_categories.length > 0
          ? data.expense_categories
          : DEFAULT_EXPENSE_CATEGORIES,
        income_categories: data.income_categories.length > 0
          ? data.income_categories
          : DEFAULT_INCOME_CATEGORIES,
      }
    }

    // Si no existe, crear nueva config
    const { data: newConfig, error: insertError } = await supabase
      .from('user_config')
      .insert({
        user_id: user.id,
        expense_categories: [],
        income_categories: [],
        agent_system_prompt: null,
        calculator_defaults: {},
      })
      .select()
      .single()

    if (insertError) throw new Error(insertError.message)

    return {
      ...newConfig,
      expense_categories: DEFAULT_EXPENSE_CATEGORIES,
      income_categories: DEFAULT_INCOME_CATEGORIES,
    }
  },

  /**
   * Actualiza categorias de un tipo
   */
  async updateCategories(type: CategoryType, categories: Category[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const field = type === 'expense' ? 'expense_categories' : 'income_categories'

    const { error } = await supabase
      .from('user_config')
      .update({
        [field]: categories,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (error) throw new Error(error.message)
  },

  /**
   * Actualiza el system prompt del agente
   */
  async updateAgentPrompt(prompt: string | null): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { error } = await supabase
      .from('user_config')
      .update({
        agent_system_prompt: prompt,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (error) throw new Error(error.message)
  },

  /**
   * Actualiza defaults de la calculadora
   */
  async updateCalculatorDefaults(defaults: CalculatorDefaults): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { error } = await supabase
      .from('user_config')
      .update({
        calculator_defaults: defaults,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (error) throw new Error(error.message)
  },

  /**
   * Resetea categorias a defaults
   */
  async resetCategories(type: CategoryType): Promise<Category[]> {
    const defaults = type === 'expense'
      ? DEFAULT_EXPENSE_CATEGORIES
      : DEFAULT_INCOME_CATEGORIES

    // Guardar array vacio (significa "usar defaults")
    await this.updateCategories(type, [])

    return defaults
  },

  /**
   * Obtiene categorias default del sistema
   */
  getDefaultCategories(type: CategoryType): Category[] {
    return type === 'expense'
      ? DEFAULT_EXPENSE_CATEGORIES
      : DEFAULT_INCOME_CATEGORIES
  },

  // ============================================
  // DISCOUNT CODES
  // ============================================

  /**
   * Obtiene todos los codigos de descuento
   */
  async getDiscountCodes(): Promise<DiscountCode[]> {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data || []
  },

  /**
   * Crea un nuevo codigo de descuento
   */
  async createDiscountCode(code: DiscountCodeCreate): Promise<DiscountCode> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data, error } = await supabase
      .from('discount_codes')
      .insert({
        ...code,
        code: code.code.toUpperCase(),
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  /**
   * Actualiza un codigo de descuento
   */
  async updateDiscountCode(id: string, updates: Partial<DiscountCode>): Promise<void> {
    const { error } = await supabase
      .from('discount_codes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  /**
   * Elimina un codigo de descuento
   */
  async deleteDiscountCode(id: string): Promise<void> {
    const { error } = await supabase
      .from('discount_codes')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  /**
   * Toggle activo/inactivo de un codigo
   */
  async toggleDiscountCode(id: string, isActive: boolean): Promise<void> {
    await this.updateDiscountCode(id, { is_active: isActive })
  },

  // ============================================
  // STATS
  // ============================================

  /**
   * Obtiene estadisticas del admin dashboard
   */
  async getAdminStats(): Promise<AdminStats> {
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const { count: paidUsers } = await supabase
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .neq('tier', 'starter')

    const { count: activeDiscounts } = await supabase
      .from('discount_codes')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const total = totalUsers || 0
    const paid = paidUsers || 0

    return {
      totalUsers: total,
      paidUsers: paid,
      conversionRate: total > 0 ? (paid / total) * 100 : 0,
      activeDiscounts: activeDiscounts || 0,
      mrr: paid * 9.99
    }
  },

  // ============================================
  // APP USAGE LOGS
  // ============================================

  /**
   * Registra uso de la app
   */
  async logUsage(action: string, metadata: Record<string, unknown> = {}): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('app_usage_logs')
      .insert({
        user_id: user.id,
        action,
        metadata,
      })
  }
}

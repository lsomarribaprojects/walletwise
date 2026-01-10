#!/usr/bin/env node

/**
 * Script para eliminar cuentas de prueba y el trigger que las crea
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fyppzlepkvfltmdrludz.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5cHB6bGVwa3ZmbHRtZHJsdWR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzM5MTYwMSwiZXhwIjoyMDgyOTY3NjAxfQ.6VY0z6Wg3jyoUZDlFr0VDQ_E-bgat0-AAHLWZ4lY_xc'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function main() {
  console.log('🧹 Limpiando cuentas de prueba...\n')

  try {
    // 1. Ver cuentas actuales
    console.log('📋 Cuentas actuales:')
    const { data: cuentasAntes } = await supabase.from('cuentas').select('nombre, tipo')
    cuentasAntes?.forEach(c => console.log(`   - ${c.nombre} (${c.tipo})`))

    // 2. Eliminar cuentas hardcodeadas
    console.log('\n🗑️  Eliminando cuentas de prueba...')
    const testAccounts = [
      'Nubank Daniel',
      'Bancoppel Daniel',
      'Nu credito Diana',
      'Bancoppel Diana'
    ]

    const { error: deleteError, count } = await supabase
      .from('cuentas')
      .delete()
      .in('nombre', testAccounts)

    if (deleteError) {
      console.error('   Error:', deleteError.message)
    } else {
      console.log(`   ✅ ${count || 0} cuentas de prueba eliminadas`)
    }

    // 3. Eliminar trigger y función
    console.log('\n🔧 Eliminando trigger de cuentas automáticas...')

    // Ejecutar SQL raw para eliminar trigger
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP TRIGGER IF EXISTS on_user_created_accounts ON auth.users;
        DROP TRIGGER IF EXISTS create_default_accounts_trigger ON auth.users;
        DROP FUNCTION IF EXISTS create_default_accounts();
      `
    })

    if (triggerError) {
      console.log('   ⚠️  No se pudo eliminar trigger via RPC (puede que ya no exista)')
      console.log('   Ejecuta manualmente el SQL en Supabase Dashboard si es necesario')
    } else {
      console.log('   ✅ Trigger eliminado')
    }

    // 4. Ver resultado final
    console.log('\n📋 Cuentas restantes:')
    const { data: cuentasDespues } = await supabase.from('cuentas').select('nombre, tipo')
    if (cuentasDespues?.length === 0) {
      console.log('   (ninguna - listo para crear tus propias cuentas)')
    } else {
      cuentasDespues?.forEach(c => console.log(`   - ${c.nombre} (${c.tipo})`))
    }

    console.log('\n✨ Limpieza completada!')
    console.log('\nAhora puedes crear tus propias cuentas desde la app.')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

main()

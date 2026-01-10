#!/usr/bin/env node

/**
 * Script simplificado para crear usuario admin
 */

import { createClient } from '@supabase/supabase-js'

// Configuración directa
const SUPABASE_URL = 'https://fyppzlepkvfltmdrludz.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5cHB6bGVwa3ZmbHRtZHJsdWR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzM5MTYwMSwiZXhwIjoyMDgyOTY3NjAxfQ.6VY0z6Wg3jyoUZDlFr0VDQ_E-bgat0-AAHLWZ4lY_xc'

// Datos del admin
const ADMIN_EMAIL = 'luis.somarriba.r@gmail.com'
const ADMIN_PASSWORD = 'Admin2026!WalletWise'
const ADMIN_NAME = 'Luis Somarriba'

// Cliente Supabase con privilegios admin
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  console.log('🚀 Creando usuario admin...')
  console.log(`   Email: ${ADMIN_EMAIL}`)

  try {
    // 1. Crear usuario en auth
    console.log('\n👤 Paso 1: Creando usuario en auth.users...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: ADMIN_NAME }
    })

    let userId

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        console.log('   ⚠️ Usuario ya existe en auth, obteniendo ID...')
        const { data: users } = await supabase.auth.admin.listUsers()
        const existingUser = users.users.find(u => u.email === ADMIN_EMAIL)
        if (existingUser) {
          userId = existingUser.id
          console.log(`   ✅ Usuario encontrado: ${userId}`)
        } else {
          throw new Error('No se pudo encontrar el usuario existente')
        }
      } else {
        throw authError
      }
    } else {
      userId = authData.user.id
      console.log(`   ✅ Usuario creado: ${userId}`)
    }

    // 2. Crear/actualizar perfil como admin
    console.log('\n👑 Paso 2: Creando perfil admin...')
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: ADMIN_EMAIL,
        full_name: ADMIN_NAME,
        status: 'approved',
        role: 'admin',
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single()

    if (profileError) {
      console.log(`   ⚠️ Error creando perfil: ${profileError.message}`)
      console.log('   Intentando con INSERT directo...')

      // Intentar insert directo
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: ADMIN_EMAIL,
          full_name: ADMIN_NAME,
          status: 'approved',
          role: 'admin',
          approved_at: new Date().toISOString()
        })

      if (insertError && !insertError.message.includes('duplicate')) {
        throw insertError
      }

      // Intentar update si ya existe
      await supabase
        .from('profiles')
        .update({
          status: 'approved',
          role: 'admin',
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
    }

    console.log('   ✅ Perfil admin configurado')

    // 3. Verificar
    console.log('\n🔐 Paso 3: Verificando...')
    const { data: verifyData } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', ADMIN_EMAIL)
      .single()

    if (verifyData) {
      console.log('\n✨ ¡Usuario admin creado exitosamente!')
      console.log('================================')
      console.log(`Email: ${verifyData.email}`)
      console.log(`Nombre: ${verifyData.full_name}`)
      console.log(`Status: ${verifyData.status}`)
      console.log(`Role: ${verifyData.role}`)
      console.log('================================')
      console.log('\n📝 Credenciales de acceso:')
      console.log(`   Email: ${ADMIN_EMAIL}`)
      console.log(`   Password: ${ADMIN_PASSWORD}`)
      console.log('\n🌐 Inicia sesión en tu app desplegada')
    } else {
      console.log('⚠️ No se pudo verificar el perfil, pero el usuario debería existir')
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message || error)
    process.exit(1)
  }
}

main()

#!/usr/bin/env node

/**
 * Script: Create Admin User
 * Propósito: Crear usuario admin para Walletwise
 * Email: luis.somarriba.r@gmail.com
 *
 * Uso:
 *   SUPABASE_SERVICE_ROLE_KEY="tu_key" node scripts/create-admin.js
 *
 * O con archivo .env.local:
 *   node scripts/create-admin.js
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: join(__dirname, '..', '.env.local') })

// Configuración
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fyppzlepkvfltmdrludz.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Datos del admin
const ADMIN_EMAIL = 'luis.somarriba.r@gmail.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin2026!WalletWise'
const ADMIN_NAME = 'Luis Somarriba'

// Validaciones
if (!SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY no está configurada')
  console.error('')
  console.error('Opciones:')
  console.error('1. Agregar SUPABASE_SERVICE_ROLE_KEY a .env.local')
  console.error('2. Ejecutar: SUPABASE_SERVICE_ROLE_KEY="tu_key" node scripts/create-admin.js')
  console.error('')
  console.error('Obtén tu SERVICE_ROLE_KEY en:')
  console.error('Dashboard > Settings > API > service_role (secret)')
  process.exit(1)
}

// Cliente Supabase con privilegios admin
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkUserExists() {
  console.log('\n🔍 Verificando si el usuario ya existe...')

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, status, role')
    .eq('email', ADMIN_EMAIL)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Error al verificar usuario: ${error.message}`)
  }

  return data
}

async function createAuthUser() {
  console.log('\n👤 Creando usuario en auth.users...')

  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: ADMIN_NAME
    }
  })

  if (error) {
    // Si el usuario ya existe, intentamos obtenerlo
    if (error.message.includes('already registered')) {
      console.log('⚠️  Usuario ya existe en auth, continuando...')
      const { data: users } = await supabase.auth.admin.listUsers()
      const existingUser = users.users.find(u => u.email === ADMIN_EMAIL)
      if (!existingUser) {
        throw new Error('Usuario existe pero no se pudo obtener')
      }
      return existingUser
    }
    throw new Error(`Error al crear usuario: ${error.message}`)
  }

  console.log('✅ Usuario creado en auth.users')
  console.log(`   ID: ${data.user.id}`)
  console.log(`   Email: ${data.user.email}`)
  console.log(`   Email confirmado: ${data.user.email_confirmed_at ? 'Sí' : 'No'}`)

  return data.user
}

async function createAdminProfile(userId) {
  console.log('\n👑 Creando perfil admin...')

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: ADMIN_EMAIL,
      full_name: ADMIN_NAME,
      status: 'approved',
      role: 'admin',
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Error al crear perfil: ${error.message}`)
  }

  console.log('✅ Perfil admin creado/actualizado')
  console.log(`   ID: ${data.id}`)
  console.log(`   Email: ${data.email}`)
  console.log(`   Status: ${data.status}`)
  console.log(`   Role: ${data.role}`)

  return data
}

async function verifyAdminAccess() {
  console.log('\n🔐 Verificando acceso admin...')

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      status,
      role,
      approved_at,
      created_at
    `)
    .eq('email', ADMIN_EMAIL)
    .single()

  if (error) {
    throw new Error(`Error al verificar acceso: ${error.message}`)
  }

  // Verificar en auth.users también
  const { data: authData } = await supabase.auth.admin.listUsers()
  const authUser = authData.users.find(u => u.email === ADMIN_EMAIL)

  console.log('✅ Verificación completada')
  console.log('\n📊 Resumen del Usuario Admin:')
  console.log('================================')
  console.log(`Email: ${data.email}`)
  console.log(`Nombre: ${data.full_name}`)
  console.log(`Status: ${data.status}`)
  console.log(`Role: ${data.role}`)
  console.log(`Aprobado: ${data.approved_at ? new Date(data.approved_at).toLocaleString() : 'No'}`)
  console.log(`Email confirmado: ${authUser?.email_confirmed_at ? 'Sí' : 'No'}`)
  console.log(`Creado: ${new Date(data.created_at).toLocaleString()}`)
  console.log('================================')

  return data
}

async function main() {
  console.log('🚀 Iniciando creación de usuario admin')
  console.log('=====================================')
  console.log(`Email: ${ADMIN_EMAIL}`)
  console.log(`Supabase URL: ${SUPABASE_URL}`)

  try {
    // Verificar si ya existe
    const existingProfile = await checkUserExists()

    if (existingProfile) {
      console.log('⚠️  Usuario ya existe en profiles:')
      console.log(`   Status: ${existingProfile.status}`)
      console.log(`   Role: ${existingProfile.role}`)

      const readline = await import('readline')
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })

      const answer = await new Promise(resolve => {
        rl.question('\n¿Actualizar a admin? (s/n): ', resolve)
      })
      rl.close()

      if (answer.toLowerCase() !== 's') {
        console.log('❌ Operación cancelada')
        process.exit(0)
      }
    }

    // Crear usuario en auth
    const authUser = await createAuthUser()

    // Crear perfil admin
    await createAdminProfile(authUser.id)

    // Verificar acceso
    await verifyAdminAccess()

    console.log('\n✨ Proceso completado exitosamente')
    console.log('\n📝 Credenciales de acceso:')
    console.log('   Email:', ADMIN_EMAIL)
    console.log('   Password:', ADMIN_PASSWORD)
    console.log('\n🌐 Inicia sesión en: http://localhost:3000/auth/login')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.error('\n💡 Revisa las instrucciones en: scripts/ADMIN_SETUP_INSTRUCTIONS.md')
    process.exit(1)
  }
}

// Ejecutar
main()

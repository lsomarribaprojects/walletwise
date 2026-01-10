/**
 * Script para arreglar las políticas RLS de profiles
 * Usa conexión directa a PostgreSQL via pg
 *
 * Instalar: npm install pg
 * Ejecutar: node scripts/fix-rls-pg.mjs
 */

import pg from 'pg'
const { Client } = pg

// Connection string de Supabase (modo transacción)
// Formato: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
const DATABASE_URL = 'postgresql://postgres.fyppzlepkvfltmdrludz:Ot361YSsnifrOYby@aws-0-us-west-1.pooler.supabase.com:6543/postgres'

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    console.log('Conectando a PostgreSQL...')
    await client.connect()
    console.log('Conectado!\n')

    // 1. Eliminar políticas existentes
    console.log('1. Eliminando políticas existentes...')
    const dropPolicies = [
      'Users can view own profile',
      'Users can update own profile name',
      'Admins can view all profiles',
      'Admins can update any profile',
      'profiles_select_own',
      'profiles_select_admin',
      'profiles_update_own',
      'profiles_update_admin'
    ]

    for (const policy of dropPolicies) {
      try {
        await client.query(`DROP POLICY IF EXISTS "${policy}" ON profiles;`)
        console.log(`   Eliminada: ${policy}`)
      } catch (e) {
        console.log(`   Skip: ${policy}`)
      }
    }

    // 2. Crear función helper
    console.log('\n2. Creando función is_admin...')
    await client.query(`
      CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
      RETURNS BOOLEAN AS $$
      DECLARE
        user_role TEXT;
      BEGIN
        SELECT role INTO user_role FROM profiles WHERE id = user_id;
        RETURN user_role = 'admin';
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
    `)
    console.log('   Función creada!')

    // 3. Crear nuevas políticas
    console.log('\n3. Creando nuevas políticas RLS...')

    await client.query(`
      CREATE POLICY "profiles_select_own" ON profiles
      FOR SELECT USING (auth.uid() = id);
    `)
    console.log('   Creada: profiles_select_own')

    await client.query(`
      CREATE POLICY "profiles_select_admin" ON profiles
      FOR SELECT USING (is_admin(auth.uid()));
    `)
    console.log('   Creada: profiles_select_admin')

    await client.query(`
      CREATE POLICY "profiles_update_own" ON profiles
      FOR UPDATE USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
    `)
    console.log('   Creada: profiles_update_own')

    await client.query(`
      CREATE POLICY "profiles_update_admin" ON profiles
      FOR UPDATE USING (is_admin(auth.uid()));
    `)
    console.log('   Creada: profiles_update_admin')

    // 4. Verificar admin
    console.log('\n4. Verificando usuario admin...')
    const { rows } = await client.query(`
      SELECT id, email, full_name, status, role
      FROM profiles
      WHERE email = 'luis.somarriba.r@gmail.com'
    `)

    if (rows.length > 0) {
      console.log(`   Email: ${rows[0].email}`)
      console.log(`   Status: ${rows[0].status}`)
      console.log(`   Role: ${rows[0].role}`)
    }

    console.log('\n✅ Migración completada exitosamente!')

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await client.end()
  }
}

main()

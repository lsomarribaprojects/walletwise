import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '..', '.env.local') })

const SUPABASE_URL = 'https://fyppzlepkvfltmdrludz.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('URL:', SUPABASE_URL)
console.log('Key exists:', !!SUPABASE_SERVICE_KEY)

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function fixRLS() {
  console.log('Arreglando políticas RLS de profiles...\n')

  // 1. Eliminar políticas problemáticas
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
    const { error } = await supabase.rpc('exec_sql', {
      sql: `DROP POLICY IF EXISTS "${policy}" ON profiles;`
    }).single()

    if (error && !error.message.includes('does not exist')) {
      console.log(`  Drop ${policy}: ${error.message}`)
    }
  }

  // 2. Crear función helper
  console.log('Creando función is_admin...')
  const { error: fnError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
      RETURNS BOOLEAN AS $$
      DECLARE
        user_role TEXT;
      BEGIN
        SELECT role INTO user_role FROM profiles WHERE id = user_id;
        RETURN user_role = 'admin';
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
    `
  }).single()

  if (fnError) {
    console.log(`  Error: ${fnError.message}`)
  }

  // 3. Crear nuevas políticas
  const policies = [
    {
      name: 'profiles_select_own',
      sql: `CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);`
    },
    {
      name: 'profiles_select_admin',
      sql: `CREATE POLICY "profiles_select_admin" ON profiles FOR SELECT USING (is_admin(auth.uid()));`
    },
    {
      name: 'profiles_update_own',
      sql: `CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);`
    },
    {
      name: 'profiles_update_admin',
      sql: `CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE USING (is_admin(auth.uid()));`
    }
  ]

  for (const policy of policies) {
    console.log(`Creando política ${policy.name}...`)
    const { error } = await supabase.rpc('exec_sql', { sql: policy.sql }).single()
    if (error) {
      console.log(`  Error: ${error.message}`)
    }
  }

  // 4. Verificar admin
  console.log('\nVerificando admin...')
  const { data, error: selectError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'luis.somarriba.r@gmail.com')
    .single()

  if (selectError) {
    console.log(`Error: ${selectError.message}`)
  } else {
    console.log(`Usuario: ${data.email}`)
    console.log(`Status: ${data.status}`)
    console.log(`Role: ${data.role}`)
  }

  console.log('\nListo!')
}

fixRLS().catch(console.error)

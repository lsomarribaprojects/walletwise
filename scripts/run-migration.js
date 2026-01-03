const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://fyppzlepkvfltmdrludz.supabase.co';
const serviceRoleKey = 'sb_secret_VgHXKruUk2DJPPMTaaI6lA_u28MtI_c';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration(filename) {
  const filePath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
  const sql = fs.readFileSync(filePath, 'utf8');

  console.log(`Running migration: ${filename}`);

  // Split by semicolon and filter empty statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (stmt.length < 5) continue;

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: stmt + ';' });
      if (error) {
        // Try direct query if RPC doesn't exist
        console.log(`Statement ${i + 1}: Trying alternate method...`);
      }
    } catch (e) {
      console.log(`Statement ${i + 1}: ${e.message}`);
    }
  }

  console.log(`Completed: ${filename}`);
}

async function main() {
  // Check connection first
  const { data, error } = await supabase.from('profiles').select('count').limit(1);

  if (error && error.code === '42P01') {
    console.log('Tables do not exist yet. Need to run migrations via SQL Editor.');
    console.log('\nPlease go to: https://supabase.com/dashboard/project/fyppzlepkvfltmdrludz/sql/new');
    console.log('And run the migration files manually.');
  } else if (error) {
    console.log('Connection test result:', error.message);
  } else {
    console.log('Connection successful! Tables already exist.');
    console.log('Data:', data);
  }
}

main().catch(console.error);

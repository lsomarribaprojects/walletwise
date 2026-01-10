# Instrucciones: Crear Usuario Admin

## Contexto
El trigger de creación de perfiles está fallando. Este proceso arregla la base de datos y crea el usuario admin para `luis.somarriba.r@gmail.com`.

---

## MÉTODO 1: Via Dashboard de Supabase (RECOMENDADO)

### Paso 1: Arreglar la Base de Datos
1. Abre Supabase Dashboard: https://supabase.com/dashboard
2. Ve a tu proyecto `Walletwise`
3. Click en **SQL Editor** en el menú lateral
4. Ejecuta el contenido del archivo: `scripts/fix-database-and-create-admin.sql`
5. Verifica que no haya errores

### Paso 2: Crear Usuario en Auth
1. Ve a **Authentication > Users**
2. Click en **Add User** (botón verde arriba a la derecha)
3. Completa el formulario:
   - Email: `luis.somarriba.r@gmail.com`
   - Password: (elige una segura, ej: `Admin2026!WalletWise`)
   - **Auto Confirm User**: ✅ ACTIVAR (importante!)
4. Click en **Create User**
5. Copia el `User UID` que aparece en la tabla

### Paso 3: Crear Perfil Admin
1. Regresa a **SQL Editor**
2. Ejecuta el contenido del archivo: `scripts/create-admin-profile.sql`
3. Verifica el resultado en la tabla que aparece

### Paso 4: Verificación Final
Ejecuta este query en SQL Editor:
```sql
SELECT
  p.id,
  p.email,
  p.full_name,
  p.status,
  p.role,
  p.approved_at,
  u.email_confirmed_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.email = 'luis.somarriba.r@gmail.com';
```

Deberías ver:
- `status`: `approved`
- `role`: `admin`
- `approved_at`: timestamp
- `email_confirmed_at`: timestamp

---

## MÉTODO 2: Via Supabase CLI (Para usuarios avanzados)

### Prerequisitos
```bash
npm install -g supabase
supabase login
supabase link --project-ref fyppzlepkvfltmdrludz
```

### Paso 1: Arreglar Base de Datos
```bash
supabase db execute --file scripts/fix-database-and-create-admin.sql
```

### Paso 2: Crear Usuario
```bash
# Necesitarás usar la API directamente
# Obtén tu SERVICE_ROLE_KEY del dashboard en Settings > API

curl -X POST 'https://fyppzlepkvfltmdrludz.supabase.co/auth/v1/admin/users' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "luis.somarriba.r@gmail.com",
    "password": "Admin2026!WalletWise",
    "email_confirm": true,
    "user_metadata": {
      "full_name": "Luis Somarriba"
    }
  }'
```

### Paso 3: Crear Perfil Admin
```bash
supabase db execute --file scripts/create-admin-profile.sql
```

---

## MÉTODO 3: Via Node.js Script (Automatizado)

Crea un archivo `scripts/create-admin.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fyppzlepkvfltmdrludz.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY // ¡NUNCA comitear esto!

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdmin() {
  try {
    // 1. Crear usuario en auth
    const { data: user, error: authError } = await supabase.auth.admin.createUser({
      email: 'luis.somarriba.r@gmail.com',
      password: 'Admin2026!WalletWise',
      email_confirm: true,
      user_metadata: {
        full_name: 'Luis Somarriba'
      }
    })

    if (authError) throw authError
    console.log('✅ Usuario creado:', user.user.id)

    // 2. Crear perfil admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.user.id,
        email: 'luis.somarriba.r@gmail.com',
        full_name: 'Luis Somarriba',
        status: 'approved',
        role: 'admin',
        approved_at: new Date().toISOString()
      })
      .select()

    if (profileError) throw profileError
    console.log('✅ Perfil admin creado:', profile)

    // 3. Verificar
    const { data: verification } = await supabase
      .from('profiles')
      .select('id, email, status, role, approved_at')
      .eq('email', 'luis.somarriba.r@gmail.com')
      .single()

    console.log('✅ Verificación:', verification)

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

createAdmin()
```

Ejecutar:
```bash
SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key" node scripts/create-admin.js
```

---

## Troubleshooting

### Error: "duplicate key value violates unique constraint"
El usuario ya existe. Ejecuta solo el script `create-admin-profile.sql`.

### Error: "relation profiles does not exist"
La tabla profiles no está creada. Revisa las migraciones en `supabase/migrations/`.

### Error: "permission denied for table auth.users"
Necesitas usar el SERVICE_ROLE_KEY, no el ANON_KEY.

### No puedo iniciar sesión después de crear el usuario
1. Verifica que `email_confirmed_at` no sea NULL en auth.users
2. Si es NULL, ejecuta:
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'luis.somarriba.r@gmail.com';
```

---

## Verificación de Acceso Admin

Una vez creado el usuario, prueba iniciar sesión en:
- URL: http://localhost:3000/auth/login
- Email: luis.somarriba.r@gmail.com
- Password: (la que estableciste)

Deberías tener acceso a todas las funcionalidades de admin.

---

## Archivos Relacionados
- `scripts/fix-database-and-create-admin.sql` - Script principal de arreglo
- `scripts/create-admin-profile.sql` - Script de creación de perfil admin
- `supabase/migrations/` - Migraciones de base de datos
- `.env.local` - Variables de entorno (no comitear)

# Resumen: Creación de Usuario Admin

## Estado Actual

**Problema identificado**: El trigger de creación automática de perfiles está fallando, impidiendo que los usuarios se registren normalmente.

**Solución implementada**: He creado scripts automatizados para arreglar la base de datos y crear el usuario admin de forma manual.

---

## Archivos Creados

### 1. Scripts SQL
- `scripts/fix-database-and-create-admin.sql` - Arregla triggers y estructura de BD
- `scripts/create-admin-profile.sql` - Crea el perfil admin

### 2. Script Automatizado
- `scripts/create-admin.js` - Script Node.js para automatizar todo el proceso
- Añadido al package.json como: `npm run create-admin`

### 3. Documentación
- `scripts/ADMIN_SETUP_INSTRUCTIONS.md` - Instrucciones detalladas paso a paso

---

## Limitación Encontrada

**No tengo acceso directo al MCP de Supabase** en este momento. Aunque el MCP está configurado en `.mcp.json`, no está disponible como herramienta que pueda invocar directamente desde esta sesión.

Por lo tanto, he creado 3 métodos alternativos que puedes ejecutar tú mismo.

---

## MÉTODO RECOMENDADO: Script Automatizado

### Paso 1: Instalar dependencias
```bash
npm install
```

### Paso 2: Configurar variables de entorno

Añade a tu archivo `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://fyppzlepkvfltmdrludz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
ADMIN_PASSWORD=Admin2026!WalletWise
```

**Obtener SERVICE_ROLE_KEY**:
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto Walletwise
3. Settings > API
4. Copia el `service_role` key (es un secret, NO lo comitees)

### Paso 3: Ejecutar script
```bash
npm run create-admin
```

El script automáticamente:
1. Verifica si el usuario ya existe
2. Crea el usuario en auth.users con email confirmado
3. Crea/actualiza el perfil con role='admin' y status='approved'
4. Verifica que todo esté correcto
5. Muestra las credenciales de acceso

---

## Alternativa Manual (Dashboard)

Si prefieres hacerlo manualmente desde el Dashboard de Supabase:

### Paso 1: Arreglar Base de Datos
1. Abre https://supabase.com/dashboard
2. Ve a tu proyecto > SQL Editor
3. Ejecuta el contenido de `scripts/fix-database-and-create-admin.sql`

### Paso 2: Crear Usuario
1. Ve a Authentication > Users
2. Click "Add User"
3. Email: `luis.somarriba.r@gmail.com`
4. Password: (tu elección)
5. **Activar**: Auto Confirm User
6. Click "Create User"

### Paso 3: Crear Perfil Admin
1. Regresa a SQL Editor
2. Ejecuta el contenido de `scripts/create-admin-profile.sql`

### Paso 4: Verificar
Ejecuta en SQL Editor:
```sql
SELECT p.*, u.email_confirmed_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.email = 'luis.somarriba.r@gmail.com';
```

Deberías ver:
- role: 'admin'
- status: 'approved'
- email_confirmed_at: (timestamp)

---

## Credenciales por Defecto

```
Email: luis.somarriba.r@gmail.com
Password: Admin2026!WalletWise
```

**IMPORTANTE**: Cambia la contraseña después del primer login.

---

## Verificación de Acceso

Una vez creado el usuario:

1. Inicia sesión en: http://localhost:3000/auth/login
2. Usa las credenciales de arriba
3. Deberías tener acceso completo como admin

---

## Próximos Pasos

### 1. Arreglar el Trigger (Permanente)
El script SQL ya arregla el trigger, pero deberías:
- Revisar las migraciones en `supabase/migrations/`
- Asegurar que el trigger `handle_new_user()` tenga manejo de errores
- Probar registrando un nuevo usuario normal

### 2. Verificar RLS (Row Level Security)
Ejecuta en SQL Editor:
```sql
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Asegúrate de que:
- La tabla `profiles` tenga políticas de INSERT habilitadas
- Los admins puedan leer todos los perfiles
- Los usuarios normales solo vean su propio perfil

### 3. Testing
Después de crear el admin, prueba:
- Registrar un nuevo usuario normal
- Verificar que el perfil se cree automáticamente
- Confirmar que el trigger funciona sin errores

---

## Troubleshooting

### "SUPABASE_SERVICE_ROLE_KEY no está configurada"
- Añade la variable a `.env.local`
- O ejecuta: `SUPABASE_SERVICE_ROLE_KEY="tu_key" npm run create-admin`

### "Usuario ya existe en auth"
- El script detectará esto y solo actualizará el perfil
- O ejecuta solo `scripts/create-admin-profile.sql`

### "Error: relation profiles does not exist"
- Ejecuta primero las migraciones: `supabase db push`
- O revisa `supabase/migrations/`

### "No puedo iniciar sesión"
- Verifica que `email_confirmed_at` no sea NULL
- Ejecuta:
  ```sql
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE email = 'luis.somarriba.r@gmail.com';
  ```

---

## Archivos Relevantes

```
c:\Users\Bimma\OneDrive\Sinsajo LS\Apps\Walletwise\
├── scripts/
│   ├── create-admin.js                    - Script automatizado
│   ├── fix-database-and-create-admin.sql  - SQL: arreglar BD
│   ├── create-admin-profile.sql           - SQL: crear perfil
│   └── ADMIN_SETUP_INSTRUCTIONS.md        - Instrucciones detalladas
├── package.json                            - Añadido script "create-admin"
└── .env.local                              - Variables de entorno (crear)
```

---

## Contacto

Si tienes problemas:
1. Revisa `scripts/ADMIN_SETUP_INSTRUCTIONS.md` para detalles completos
2. Verifica los logs de Supabase en Dashboard > Logs
3. Ejecuta `get_logs(service: "postgres")` si tienes MCP configurado

---

**Creado**: 2026-01-03
**Email Admin**: luis.somarriba.r@gmail.com
**Status**: Listo para ejecutar

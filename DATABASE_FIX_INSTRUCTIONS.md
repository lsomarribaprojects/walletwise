# Instrucciones para Arreglar el Error de Registro

## Problema Detectado
Error: "Database error saving new user" al intentar registrarse en la aplicación.

**Causa raíz**: La tabla `profiles` probablemente:
1. No tiene las columnas `status` y `role` que el trigger intenta usar
2. O le falta la política RLS de INSERT que permite al trigger crear perfiles

## Solución RÁPIDA (1 Solo Paso)

### EJECUTA ESTE ARCHIVO COMPLETO EN SUPABASE

1. Ve al **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecciona tu proyecto **Walletwise** (fyppzlepkvfltmdrludz)
3. Ve a **SQL Editor** en el menú lateral
4. Abre el archivo **`supabase/migrations/EXECUTE_THIS_NOW.sql`**
5. Copia y pega el contenido COMPLETO en el SQL Editor
6. Haz clic en **Run**
7. Deberías ver al final 3 tablas con:
   - Estructura de profiles (9 columnas)
   - Trigger on_auth_user_created_profile
   - 5 políticas RLS

### VERIFICACIÓN: Deberías ver este output al final

```
=== ESTRUCTURA DE PROFILES ===
column_name     | data_type | is_nullable | column_default
----------------+-----------+-------------+----------------
id              | uuid      | NO          |
email           | text      | NO          |
full_name       | text      | YES         |
status          | text      | NO          | 'pending'
role            | text      | NO          | 'user'
approved_at     | timestamp | YES         |
approved_by     | uuid      | YES         |
created_at      | timestamp | NO          | now()
updated_at      | timestamp | NO          | now()

=== TRIGGER CREADO ===
trigger_name                  | event_manipulation | action_timing
------------------------------+-------------------+--------------
on_auth_user_created_profile  | INSERT            | AFTER

=== POLÍTICAS RLS ===
policyname                          | cmd    | permissive
------------------------------------+--------+-----------
Enable insert for authentication    | INSERT | PERMISSIVE
Users can view own profile          | SELECT | PERMISSIVE
Users can update own profile name   | UPDATE | PERMISSIVE
Admins can view all profiles        | SELECT | PERMISSIVE
Admins can update any profile       | UPDATE | PERMISSIVE
```

### AHORA PRUEBA EL REGISTRO

1. Ve a la aplicación: https://walletwise-app.vercel.app/signup
2. Intenta registrarte con un nuevo email
3. Deberías poder registrarte exitosamente sin errores

---

## Paso 2: Crear el Usuario Admin

**IMPORTANTE**: Primero regístrate en la app con `luis.somarriba.r@gmail.com`

Luego ejecuta el archivo **`supabase/migrations/CREATE_ADMIN.sql`** COMPLETO en el SQL Editor.

Este script:
1. Verificará que el usuario existe en auth.users
2. Creará/actualizará el perfil como admin aprobado
3. Mostrará el resultado final

## Resultado Esperado

Después de aplicar la migración:

1. ✅ La tabla `profiles` tendrá las columnas: `status`, `role`, `approved_at`, `approved_by`
2. ✅ El trigger `on_auth_user_created_profile` creará perfiles automáticamente
3. ✅ Los nuevos usuarios se crearán con `status='pending'` y `role='user'`
4. ✅ El usuario admin tendrá `status='approved'` y `role='admin'`
5. ✅ No más errores "Database error saving new user"

## Troubleshooting

### Error: "column already exists"
Si ves este error, significa que la columna ya existe. Ignóralo y continúa.

### Error: "trigger does not exist"
Si ves este error al intentar DROP TRIGGER, es normal. Ignóralo y continúa.

### Error: "permission denied"
Asegúrate de estar ejecutando las queries como el propietario del proyecto en Supabase Dashboard.

### El registro sigue fallando
1. Ejecuta el script de diagnóstico (Paso 1)
2. Verifica los logs en Supabase Dashboard → Logs → Postgres Logs
3. Busca el error específico y compártelo

## Archivos Creados

1. **supabase/migrations/20260103_verify_diagnosis.sql** - Script de diagnóstico
2. **supabase/migrations/20260103_fix_profiles_registration.sql** - Migración de corrección
3. **DATABASE_FIX_INSTRUCTIONS.md** - Este documento

## Siguiente Paso Opcional: Configurar MCP de Supabase

Para evitar tener que copiar/pegar SQL manualmente en el futuro, puedes configurar el MCP de Supabase:

1. Genera un Access Token en Supabase Dashboard → Settings → API → Access Tokens
2. Crea el archivo `.claude/mcp.json` con este contenido:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=fyppzlepkvfltmdrludz"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "TU_ACCESS_TOKEN_AQUI"
      }
    }
  }
}
```

3. Reinicia Claude Code
4. Ahora podrás ejecutar comandos SQL directamente desde el chat

---

**Estado**: Pendiente de ejecución
**Prioridad**: CRÍTICA
**Tiempo estimado**: 5-10 minutos

# SOLUCIÓN RÁPIDA - Error de Registro

## El Problema
El registro falla con error "Database error saving new user" porque la tabla `profiles` no está correctamente configurada.

---

## LA SOLUCIÓN (2 Pasos)

### PASO 1: Arreglar la Base de Datos

1. Ve a: https://supabase.com/dashboard/project/fyppzlepkvfltmdrludz/sql/new

2. Abre el archivo: **`C:\Users\Bimma\OneDrive\Sinsajo LS\Apps\Walletwise\supabase\migrations\EXECUTE_THIS_NOW.sql`**

3. Copia TODO el contenido y pégalo en el SQL Editor de Supabase

4. Haz clic en **Run**

5. Al final deberías ver 3 tablas mostrando:
   - 9 columnas en profiles
   - 1 trigger creado
   - 5 políticas RLS

**LISTO. Ahora el registro funcionará.**

---

### PASO 2: Crear el Usuario Admin

1. Regístrate en la app con tu email: https://walletwise-app.vercel.app/signup
   - Email: `luis.somarriba.r@gmail.com`
   - Password: [el que quieras]

2. Ve de nuevo al SQL Editor de Supabase

3. Abre el archivo: **`C:\Users\Bimma\OneDrive\Sinsajo LS\Apps\Walletwise\supabase\migrations\CREATE_ADMIN.sql`**

4. Copia TODO el contenido y pégalo en el SQL Editor

5. Haz clic en **Run**

6. Deberías ver tu perfil con:
   - status: 'approved'
   - role: 'admin'

**LISTO. Ahora eres admin aprobado.**

---

## Archivos Creados

He creado estos archivos SQL listos para ejecutar:

1. **supabase/migrations/EXECUTE_THIS_NOW.sql**
   - Script completo que arregla la base de datos
   - Crea/actualiza la tabla profiles
   - Crea el trigger automático
   - Configura las políticas RLS
   - Incluye verificación automática al final

2. **supabase/migrations/CREATE_ADMIN.sql**
   - Script para convertir tu usuario en admin
   - Incluye verificaciones de seguridad
   - Muestra el resultado al final

3. **supabase/migrations/20260103_verify_diagnosis.sql**
   - Script de diagnóstico (opcional)
   - Útil para debugging futuro

4. **DATABASE_FIX_INSTRUCTIONS.md**
   - Documentación detallada
   - Troubleshooting
   - Explicación técnica

---

## Tiempo Estimado
5 minutos

## Riesgo
BAJO - Los scripts usan `IF NOT EXISTS` y `ON CONFLICT` para no romper datos existentes.

---

## Próximo Paso Opcional: MCP de Supabase

Para poder ejecutar queries SQL directamente desde Claude Code en el futuro:

1. Ve a: https://supabase.com/dashboard/project/fyppzlepkvfltmdrludz/settings/api

2. En la sección **Access Tokens**, haz clic en **Generate New Token**
   - Nombre: "Claude MCP"
   - Selecciona todos los permisos
   - Copia el token generado

3. Crea el archivo **`.claude/mcp.json`** con este contenido:

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
        "SUPABASE_ACCESS_TOKEN": "PEGA_TU_TOKEN_AQUI"
      }
    }
  }
}
```

4. Reinicia Claude Code

Ahora podrás ejecutar comandos SQL directamente desde el chat usando el MCP de Supabase.

---

**Estado**: LISTO PARA EJECUTAR
**Prioridad**: CRÍTICA
**Última actualización**: 2026-01-03

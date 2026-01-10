# CREAR USUARIO ADMIN - INSTRUCCIONES RÁPIDAS

## TU TAREA AHORA

Necesitas agregar el `SUPABASE_SERVICE_ROLE_KEY` a tu archivo `.env.local` y ejecutar el script automatizado.

---

## PASO 1: Obtener SERVICE_ROLE_KEY

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto **Walletwise**
3. Click en **Settings** (rueda dentada en el menú lateral)
4. Click en **API**
5. Busca la sección **Project API keys**
6. Copia el `service_role` key (el secreto, NO el anon/public)

---

## PASO 2: Agregar a .env.local

Abre el archivo `.env.local` y agrega esta línea:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tu_key_real_aqui
```

También agrega (opcional, para cambiar la contraseña):
```env
ADMIN_PASSWORD=TuContraseñaSegura2026!
```

Tu archivo `.env.local` debería verse así:

```env
NEXT_PUBLIC_SUPABASE_URL=https://fyppzlepkvfltmdrludz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_qDLaALp_5U22txAi4BsX0w_8TZZ6tWS
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tu_key_real_aqui
OPENROUTER_API_KEY=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
ADMIN_PASSWORD=Admin2026!WalletWise
NEXT_PUBLIC_SITE_URL=https://walletwise-app.vercel.app
NEXT_PUBLIC_SITE_NAME=Walletwise
```

---

## PASO 3: Instalar Dependencias

Si no lo has hecho aún:

```bash
npm install
```

---

## PASO 4: Ejecutar Script

```bash
npm run create-admin
```

El script automáticamente:
- Arregla los triggers de la base de datos
- Crea el usuario en auth.users
- Confirma el email automáticamente
- Crea el perfil con role='admin' y status='approved'
- Verifica que todo esté correcto
- Muestra las credenciales

---

## RESULTADO ESPERADO

Deberías ver algo como:

```
🚀 Iniciando creación de usuario admin
=====================================
Email: luis.somarriba.r@gmail.com
Supabase URL: https://fyppzlepkvfltmdrludz.supabase.co

🔍 Verificando si el usuario ya existe...
👤 Creando usuario en auth.users...
✅ Usuario creado en auth.users
   ID: abc123-def456-ghi789
   Email: luis.somarriba.r@gmail.com
   Email confirmado: Sí

👑 Creando perfil admin...
✅ Perfil admin creado/actualizado
   Status: approved
   Role: admin

🔐 Verificando acceso admin...
✅ Verificación completada

📊 Resumen del Usuario Admin:
================================
Email: luis.somarriba.r@gmail.com
Nombre: Luis Somarriba
Status: approved
Role: admin
Aprobado: 2026-01-03
Email confirmado: Sí
================================

✨ Proceso completado exitosamente

📝 Credenciales de acceso:
   Email: luis.somarriba.r@gmail.com
   Password: Admin2026!WalletWise

🌐 Inicia sesión en: http://localhost:3000/auth/login
```

---

## PASO 5: Probar Login

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Abre en tu navegador: http://localhost:3000/auth/login

3. Inicia sesión con:
   - Email: `luis.somarriba.r@gmail.com`
   - Password: `Admin2026!WalletWise` (o la que configuraste)

---

## SI ALGO FALLA

### Error: "SUPABASE_SERVICE_ROLE_KEY no está configurada"
- Verifica que agregaste la línea en `.env.local`
- Asegúrate de que NO tiene espacios antes o después
- Reinicia el terminal y vuelve a ejecutar

### Error: "Usuario ya existe en auth"
- Está bien, el script solo actualizará el perfil a admin
- Continúa normalmente

### Error: "permission denied for table auth.users"
- Verifica que usaste el `service_role` key, NO el `anon` key
- El service_role key empieza con `eyJ...` y es MUY largo

### No puedo iniciar sesión después de crear el usuario
- Ejecuta este SQL en Dashboard > SQL Editor:
  ```sql
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE email = 'luis.somarriba.r@gmail.com';
  ```

---

## ALTERNATIVA: Método Manual

Si prefieres hacerlo manualmente sin el script, sigue las instrucciones en:

📄 `scripts/ADMIN_SETUP_INSTRUCTIONS.md`

---

## ARCHIVOS RELEVANTES

- `scripts/create-admin.js` - Script automatizado
- `scripts/ADMIN_SETUP_INSTRUCTIONS.md` - Instrucciones detalladas
- `ADMIN_CREATION_SUMMARY.md` - Resumen completo del proceso
- `.env.local` - Tus variables de entorno (NO comitear)

---

## SIGUIENTE PASO

Una vez que el admin esté creado y puedas iniciar sesión, la próxima tarea es:

1. Probar el registro de un usuario normal
2. Verificar que el trigger funcione correctamente
3. Arreglar cualquier problema de RLS (Row Level Security)

---

**Email Admin**: luis.somarriba.r@gmail.com
**Password Default**: Admin2026!WalletWise
**Status**: Listo para ejecutar

**Creado**: 2026-01-03

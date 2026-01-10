# Checklist: Crear Usuario Admin

## Pre-requisitos
- [ ] Tienes acceso al Dashboard de Supabase
- [ ] Conoces el project ref: `fyppzlepkvfltmdrludz`
- [ ] Tienes Node.js instalado (v18+)

---

## Opción A: Script Automatizado (RECOMENDADO)

### 1. Configuración
- [ ] Abrir Dashboard de Supabase: https://supabase.com/dashboard
- [ ] Ir a Settings > API
- [ ] Copiar el `service_role` key (secret)
- [ ] Abrir archivo `.env.local`
- [ ] Agregar línea: `SUPABASE_SERVICE_ROLE_KEY=tu_key_aqui`
- [ ] (Opcional) Agregar: `ADMIN_PASSWORD=TuContraseña2026!`

### 2. Instalación
- [ ] Abrir terminal en la carpeta del proyecto
- [ ] Ejecutar: `npm install`
- [ ] Verificar que no haya errores

### 3. Ejecución
- [ ] Ejecutar: `npm run create-admin`
- [ ] Esperar a que termine (debería tomar ~5 segundos)
- [ ] Verificar que veas el mensaje "✨ Proceso completado exitosamente"
- [ ] Copiar las credenciales mostradas

### 4. Verificación
- [ ] Ejecutar: `npm run dev`
- [ ] Abrir: http://localhost:3000/auth/login
- [ ] Iniciar sesión con:
  - Email: `luis.somarriba.r@gmail.com`
  - Password: (la que configuraste o `Admin2026!WalletWise`)
- [ ] Verificar que puedas acceder al dashboard

---

## Opción B: Dashboard Manual

### 1. Arreglar Base de Datos
- [ ] Abrir Dashboard de Supabase
- [ ] Ir a SQL Editor
- [ ] Abrir archivo: `scripts/fix-database-and-create-admin.sql`
- [ ] Copiar todo el contenido
- [ ] Pegar en SQL Editor
- [ ] Click en "Run"
- [ ] Verificar que no haya errores (debe decir "Success")

### 2. Crear Usuario en Auth
- [ ] Ir a Authentication > Users
- [ ] Click en "Add User" (botón verde)
- [ ] Email: `luis.somarriba.r@gmail.com`
- [ ] Password: (elegir una segura)
- [ ] **IMPORTANTE**: Activar "Auto Confirm User"
- [ ] Click en "Create User"
- [ ] Copiar el User UID que aparece

### 3. Crear Perfil Admin
- [ ] Regresar a SQL Editor
- [ ] Abrir archivo: `scripts/create-admin-profile.sql`
- [ ] Copiar todo el contenido
- [ ] Pegar en SQL Editor
- [ ] Click en "Run"
- [ ] Verificar que aparezca una tabla con los datos del usuario

### 4. Verificación Final
- [ ] En SQL Editor, ejecutar query de verificación:
  ```sql
  SELECT p.*, u.email_confirmed_at
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.email = 'luis.somarriba.r@gmail.com';
  ```
- [ ] Verificar que:
  - [ ] `role` = 'admin'
  - [ ] `status` = 'approved'
  - [ ] `email_confirmed_at` tenga un timestamp (no NULL)

### 5. Probar Login
- [ ] Ejecutar: `npm run dev`
- [ ] Abrir: http://localhost:3000/auth/login
- [ ] Iniciar sesión con las credenciales
- [ ] Verificar acceso al dashboard

---

## Troubleshooting

### El script dice "SUPABASE_SERVICE_ROLE_KEY no está configurada"
- [ ] Verificar que agregaste la línea en `.env.local`
- [ ] Asegurar que NO hay espacios antes o después del `=`
- [ ] Cerrar y reabrir el terminal
- [ ] Volver a ejecutar `npm run create-admin`

### "Error: Usuario ya existe en auth"
- [ ] Esto es OK, el script solo actualizará el perfil
- [ ] Continuar normalmente
- [ ] O ejecutar solo: `scripts/create-admin-profile.sql`

### "Error: permission denied for table auth.users"
- [ ] Verificar que usaste el `service_role` key
- [ ] NO usar el `anon` key (el público)
- [ ] El service_role key es MUY largo (~200 caracteres)

### No puedo iniciar sesión
- [ ] Ir a Dashboard > SQL Editor
- [ ] Ejecutar:
  ```sql
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE email = 'luis.somarriba.r@gmail.com';
  ```
- [ ] Volver a intentar login

### La página de login no carga
- [ ] Verificar que `npm run dev` esté corriendo
- [ ] Verificar que no haya errores en la terminal
- [ ] Abrir: http://localhost:3000 (sin /auth/login)
- [ ] Verificar el puerto (puede ser 3001, 3002, etc.)

---

## Verificación de Seguridad

### Columnas de Profiles
- [ ] `status` existe y tiene valor 'approved'
- [ ] `role` existe y tiene valor 'admin'
- [ ] `approved_at` existe y tiene timestamp
- [ ] `approved_by` existe (puede ser NULL)

### Políticas RLS
- [ ] Ejecutar en SQL Editor:
  ```sql
  SELECT tablename, policyname
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'profiles';
  ```
- [ ] Debe haber al menos 1 política habilitada

### Triggers
- [ ] Ejecutar en SQL Editor:
  ```sql
  SELECT trigger_name, event_object_table
  FROM information_schema.triggers
  WHERE trigger_name LIKE '%user%';
  ```
- [ ] Debe aparecer `on_auth_user_created_profile`

---

## Post-Setup

### Crear Más Admins (futuro)
- [ ] Usar el script: `npm run create-admin`
- [ ] O cambiar el email en el script y re-ejecutar

### Crear Usuarios Normales
- [ ] Probar registro normal en: http://localhost:3000/auth/signup
- [ ] Verificar que el perfil se cree automáticamente
- [ ] Verificar que el role sea 'user' (no 'admin')
- [ ] Verificar que el status sea 'pending'

### Configurar RLS para Admins
- [ ] Crear política para que admins vean todos los perfiles
- [ ] Crear política para que admins puedan aprobar usuarios
- [ ] Ver: `docs/database-setup-guide.md`

---

## Archivos de Referencia

- [ ] Leído: `EJECUTAR_ESTO_PRIMERO.md`
- [ ] Leído: `ADMIN_CREATION_SUMMARY.md`
- [ ] Leído: `scripts/ADMIN_SETUP_INSTRUCTIONS.md`
- [ ] Disponible: `scripts/QUERIES_RAPIDOS.sql` (para debugging)

---

## Estado Final Esperado

```
✅ Usuario creado en auth.users
✅ Email confirmado automáticamente
✅ Perfil creado en profiles
✅ Role = 'admin'
✅ Status = 'approved'
✅ Puede iniciar sesión
✅ Tiene acceso al dashboard
✅ Triggers funcionando correctamente
```

---

**Email Admin**: luis.somarriba.r@gmail.com
**Password Default**: Admin2026!WalletWise

**Última actualización**: 2026-01-03

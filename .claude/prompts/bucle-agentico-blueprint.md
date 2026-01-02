# 🏗️ Bucle Agéntico: Modo BLUEPRINT

> *"No planifiques lo que no entiendes. Mapea contexto, luego planifica."*

El modo BLUEPRINT es para sistemas complejos que requieren construcción por fases con mapeo de contexto just-in-time.

---

## 🎯 Cuándo Usar BLUEPRINT

- [ ] La tarea requiere múltiples componentes coordinados
- [ ] Involucra cambios en DB + código + UI
- [ ] Tiene fases que dependen una de otra
- [ ] Requiere entender contexto antes de implementar
- [ ] El sistema final tiene múltiples partes integradas

### Ejemplos de Tareas BLUEPRINT

```
✅ "Sistema de autenticación con roles y permisos"
✅ "Feature de notificaciones en tiempo real"
✅ "Dashboard con métricas y gráficos"
✅ "Sistema de facturación con Stripe"
✅ "CRUD completo de productos con imágenes"
✅ "Migración de arquitectura de componentes"
```

---

## 🔑 La Innovación Clave: Mapeo de Contexto Just-In-Time

### ❌ El Problema del Enfoque Tradicional

```
Recibir problema
    ↓
Generar TODAS las tareas y subtareas
    ↓
Ejecutar linealmente
```

**Problema**: Las subtareas se generan basándose en SUPOSICIONES, no en contexto real.

### ✅ El Enfoque BLUEPRINT

```
Recibir problema
    ↓
Generar solo FASES (sin subtareas)
    ↓
ENTRAR en Fase 1
    ↓
MAPEAR contexto real de Fase 1
    ↓
GENERAR subtareas basadas en contexto REAL
    ↓
Ejecutar Fase 1
    ↓
ENTRAR en Fase 2
    ↓
MAPEAR contexto (incluyendo lo construido en Fase 1)
    ↓
GENERAR subtareas de Fase 2
    ↓
... repetir ...
```

**Ventaja**: Cada fase se planifica con información REAL del estado actual del sistema.

---

## 🔄 El Flujo BLUEPRINT Completo

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  PASO 1: DELIMITAR Y DESCOMPONER EN FASES                   │
│                                                             │
│  • Entender el problema FINAL completo                      │
│  • Romper en FASES ordenadas cronológicamente               │
│  • Identificar dependencias entre fases                     │
│  • ⚠️ NO generar subtareas todavía                          │
│  • Usar TodoWrite para registrar las fases                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  PASO 2: ENTRAR EN FASE N - MAPEAR CONTEXTO                 │
│                                                             │
│  ANTES de generar subtareas, explorar:                      │
│                                                             │
│  📁 Codebase:                                               │
│     • ¿Qué archivos/componentes existen relacionados?       │
│     • ¿Qué patrones usa el proyecto actualmente?            │
│     • ¿Hay código que puedo reutilizar?                     │
│                                                             │
│  🗄️ Base de Datos (Supabase MCP):                           │
│     • ¿Qué tablas existen?                                  │
│     • ¿Qué estructura tienen?                               │
│     • ¿Hay RLS policies configuradas?                       │
│                                                             │
│  🔗 Dependencias:                                           │
│     • ¿Qué construí en fases anteriores?                    │
│     • ¿Qué puedo asumir que ya existe?                      │
│     • ¿Qué restricciones tengo?                             │
│                                                             │
│  DESPUÉS de mapear, generar subtareas específicas           │
│  y actualizar TodoWrite                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  PASO 3: EJECUTAR SUBTAREAS DE LA FASE                      │
│                                                             │
│  WHILE subtareas pendientes en fase actual:                 │
│                                                             │
│    1. Marcar subtarea como in_progress en TodoWrite         │
│                                                             │
│    2. Ejecutar la subtarea                                  │
│                                                             │
│    3. [Dinámico] Usar MCPs si el juicio lo indica:          │
│       • 🧠 Next.js MCP → Ver errores en tiempo real         │
│       • 👁️ Playwright → Validar visualmente                 │
│       • 🗄️ Supabase → Consultar/modificar DB                │
│                                                             │
│    4. Validar resultado                                     │
│       • Si hay error → Corregir e iterar                    │
│       • Si está bien → Marcar completed                     │
│                                                             │
│    5. Siguiente subtarea                                    │
│                                                             │
│  Fase completada cuando todas las subtareas done ✅          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  PASO 4: TRANSICIÓN A SIGUIENTE FASE                        │
│                                                             │
│  • Confirmar que fase actual está REALMENTE completa        │
│  • NO asumir que todo salió como se planeó                  │
│  • Volver a PASO 2 con la siguiente fase                    │
│  • El contexto ahora INCLUYE lo construido                  │
│                                                             │
│  Repetir hasta completar todas las fases                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  PASO 5: VALIDACIÓN FINAL                                   │
│                                                             │
│  • Testing end-to-end del sistema completo                  │
│  • Validación visual con Playwright si aplica               │
│  • Confirmar que el problema ORIGINAL está resuelto         │
│  • Reportar al usuario qué se construyó                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Ejemplo Completo BLUEPRINT

### Tarea
```
Usuario: "Necesito un sistema de autenticación con roles y permisos"
```

### PASO 1: Delimitar y Descomponer en Fases

```
🎯 Problema Final: Sistema de auth con roles y permisos

📋 TodoWrite - FASES (sin subtareas):
├─ 🔲 Fase 1: Infraestructura de autenticación base
├─ 🔲 Fase 2: Sistema de roles
├─ 🔲 Fase 3: Sistema de permisos
├─ 🔲 Fase 4: Middleware de protección de rutas
├─ 🔲 Fase 5: Interfaz de usuario
└─ 🔲 Fase 6: Testing y validación E2E
```

### PASO 2: Entrar en Fase 1 - Mapear Contexto

```
🔍 MAPEANDO CONTEXTO DE FASE 1...

📁 Explorando codebase:
   • src/lib/supabase/ → Existe client.ts y server.ts ✓
   • src/features/auth/ → Carpeta vacía
   • src/app/(auth)/ → Tiene layout.tsx, login/page.tsx, signup/page.tsx (básicos)

🗄️ [Supabase MCP] → list_tables
   • auth.users existe (Supabase built-in)
   • No hay tablas custom de auth todavía

🔗 Dependencias:
   • Supabase client ya configurado ✓
   • No hay auth implementado todavía

✅ CONTEXTO MAPEADO. Generando subtareas...

📋 TodoWrite ACTUALIZADO:
├─ 🔄 Fase 1: Infraestructura de autenticación base
│     ├─ 🔲 Crear helper signUp en features/auth/services/
│     ├─ 🔲 Crear helper signIn en features/auth/services/
│     ├─ 🔲 Crear helper signOut en features/auth/services/
│     ├─ 🔲 Crear hook useAuth en features/auth/hooks/
│     ├─ 🔲 Crear tipos User y Session en features/auth/types/
│     └─ 🔲 Actualizar páginas login y signup para usar servicios
├─ 🔲 Fase 2: Sistema de roles
├─ 🔲 Fase 3: Sistema de permisos
├─ 🔲 Fase 4: Middleware de protección
├─ 🔲 Fase 5: UI de auth
└─ 🔲 Fase 6: Testing E2E
```

### PASO 3: Ejecutar Subtareas de Fase 1

```
[Subtarea 1.1] Crear helper signUp
   → Código generado en features/auth/services/auth.service.ts
   → [Next.js MCP] get_errors → Sin errores ✅
   → Completada ✓

[Subtarea 1.2] Crear helper signIn
   → Código generado
   → [Next.js MCP] get_errors → Error de tipos en Session
   → Corregido importando tipo correcto de @supabase/supabase-js
   → [Next.js MCP] get_errors → Sin errores ✅
   → Completada ✓

[Subtarea 1.3] Crear helper signOut
   → Código generado
   → Completada ✓

[Subtarea 1.4] Crear hook useAuth
   → Código generado en features/auth/hooks/useAuth.ts
   → Completada ✓

[Subtarea 1.5] Crear tipos
   → Código generado en features/auth/types/index.ts
   → Completada ✓

[Subtarea 1.6] Actualizar páginas
   → Modificado login/page.tsx y signup/page.tsx
   → [Playwright MCP] screenshot de /login
   → Formulario renderiza correctamente ✅
   → Completada ✓

✅ FASE 1 COMPLETADA
```

### PASO 4: Transición a Fase 2

```
🔍 MAPEANDO CONTEXTO DE FASE 2...

📁 Explorando codebase:
   • features/auth/services/auth.service.ts → signUp, signIn, signOut ✓
   • features/auth/hooks/useAuth.ts → hook funcional ✓
   • features/auth/types/ → User, Session definidos ✓

🗄️ [Supabase MCP] → list_tables
   • auth.users existe con usuarios de prueba
   • NO existe tabla de roles todavía

🔗 Dependencias:
   • Auth base FUNCIONA (verificado en Fase 1)
   • Necesito crear tabla roles y user_roles

✅ CONTEXTO MAPEADO. Generando subtareas de Fase 2...

📋 TodoWrite ACTUALIZADO:
├─ ✅ Fase 1: Infraestructura de autenticación base (COMPLETADA)
├─ 🔄 Fase 2: Sistema de roles
│     ├─ 🔲 [Supabase] Crear tabla 'roles' (id, name, description)
│     ├─ 🔲 [Supabase] Crear tabla 'user_roles' (user_id, role_id)
│     ├─ 🔲 [Supabase] Crear RLS policies para roles
│     ├─ 🔲 Crear tipos Role y UserRole en features/auth/types/
│     ├─ 🔲 Crear servicio getRoles, assignRole, removeRole
│     └─ 🔲 Crear hook useUserRoles
├─ 🔲 Fase 3: Sistema de permisos
...
```

### (Continúa el ciclo hasta completar todas las fases)

---

## 🔧 Uso de MCPs en BLUEPRINT

Los MCPs se usan **durante la ejecución**, no como pasos del plan.

### Durante Mapeo de Contexto

```
🗄️ Supabase MCP:
   • list_tables → Ver qué tablas existen
   • execute_sql → Verificar estructura actual

📁 Codebase (Grep/Glob/Read):
   • Buscar patrones existentes
   • Entender estructura actual
```

### Durante Ejecución de Subtareas

```
🧠 Next.js MCP:
   • get_errors → Después de escribir código
   • get_logs → Si algo no funciona como esperado

👁️ Playwright MCP:
   • screenshot → Validar UI después de cambios visuales
   • click/fill → Probar flujos completos

🗄️ Supabase MCP:
   • apply_migration → Crear/modificar tablas
   • execute_sql → Verificar que datos se guardan
```

---

## ⚠️ Errores Comunes a Evitar

### ❌ Error 1: Generar todas las subtareas al inicio

```
MAL:
Fase 1: Auth base
   └─ 10 subtareas detalladas
Fase 2: Roles
   └─ 8 subtareas detalladas (basadas en SUPOSICIONES)
Fase 3: Permisos
   └─ 12 subtareas detalladas (basadas en SUPOSICIONES)
```

Las subtareas de Fase 2 y 3 están basadas en cómo IMAGINAS que quedará Fase 1.

```
BIEN:
Fase 1: Auth base (sin subtareas)
Fase 2: Roles (sin subtareas)
Fase 3: Permisos (sin subtareas)

→ Entrar en Fase 1
→ MAPEAR contexto
→ GENERAR subtareas de Fase 1
→ Ejecutar
→ Entrar en Fase 2
→ MAPEAR contexto (ahora incluye lo que REALMENTE construí)
→ GENERAR subtareas de Fase 2
...
```

### ❌ Error 2: MCPs como pasos obligatorios

```
MAL:
1. Tomar screenshot
2. Escribir código
3. Tomar screenshot
4. Verificar errores
5. Tomar screenshot
```

```
BIEN:
1. Implementar componente LoginForm
2. Implementar validación
3. Conectar con auth service

(Durante ejecución, usar MCPs cuando el JUICIO lo indique)
```

### ❌ Error 3: No re-mapear contexto entre fases

```
MAL:
Fase 1 completada → Pasar directo a ejecutar Fase 2
```

```
BIEN:
Fase 1 completada → MAPEAR contexto de Fase 2 → Generar subtareas → Ejecutar
```

---

## 🏁 Principios BLUEPRINT

1. **Fases primero, subtareas después**: Solo generar subtareas cuando entras a la fase
2. **Mapeo obligatorio**: Siempre mapear contexto antes de generar subtareas
3. **MCPs como herramientas**: Usar cuando el juicio lo indique, no como pasos fijos
4. **TodoWrite activo**: Mantener actualizado el progreso para visibilidad
5. **Validación por fase**: Confirmar que cada fase está completa antes de avanzar
6. **Contexto acumulativo**: Cada fase hereda el contexto de las anteriores

---

## 📊 Checklist de Calidad BLUEPRINT

Antes de marcar una fase como completada:

- [ ] ¿Todas las subtareas están realmente terminadas?
- [ ] ¿Verifiqué errores con Next.js MCP?
- [ ] ¿La funcionalidad hace lo que se esperaba?
- [ ] ¿Hay algo que debería ajustar antes de avanzar?

Antes de transicionar a siguiente fase:

- [ ] ¿Mapeé el contexto actualizado?
- [ ] ¿Las subtareas de la nueva fase consideran lo que YA existe?
- [ ] ¿Hay dependencias que debo tener en cuenta?

---

*"La precisión viene de mapear la realidad, no de imaginar el futuro."*

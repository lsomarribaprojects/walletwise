# 🚀 Next.js + Claude Code - Frontend Setup

Setup completo de Next.js 16 + Supabase + Claude Code listo para producción. Arquitectura Feature-First optimizada para desarrollo asistido por IA.

## 🎯 ¿Qué es esto?

Un template **production-ready** para aplicaciones frontend modernas con:

- ✅ Next.js 16 (App Router) + TypeScript
- ✅ Supabase (Database + Auth)
- ✅ Tailwind CSS + shadcn/ui
- ✅ Claude Code con comandos, agentes y skills
- ✅ Arquitectura Feature-First optimizada para IA
- ✅ Auto port detection (3000-3006)
- ✅ Testing, linting y type checking configurados
- ✅ **Google Analytics** integration ready
- ✅ **Facebook Pixel** integration ready

## 📦 Tech Stack

```yaml
Runtime: Node.js + TypeScript
Framework: Next.js 16 (App Router)
Database: PostgreSQL/Supabase
Styling: Tailwind CSS
State: Zustand
Testing: Jest + React Testing Library
Validation: Zod
AI Tooling: Claude Code + MCPs
```

## 🏗️ Arquitectura Feature-First

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Rutas auth (grupo)
│   ├── (main)/              # Rutas principales
│   ├── layout.tsx
│   └── page.tsx
│
├── features/                 # 🎯 Organizadas por funcionalidad
│   ├── auth/
│   │   ├── components/      # LoginForm, SignupForm
│   │   ├── hooks/           # useAuth, useSession
│   │   ├── services/        # authService.ts
│   │   ├── types/           # User, Session
│   │   └── store/           # authStore.ts
│   │
│   ├── dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   │
│   └── [tu-feature]/
│
└── shared/                   # Código reutilizable
    ├── components/          # Button, Card, Input
    ├── hooks/               # useDebounce, useLocalStorage
    ├── stores/              # appStore.ts
    ├── types/               # api.ts, domain.ts
    ├── utils/               # helpers
    ├── lib/                 # supabase.ts, axios.ts
    └── constants/
```

> **¿Por qué Feature-First?** Cada feature tiene TODO lo necesario en un solo lugar. Perfecto para que la IA entienda contexto completo sin navegar múltiples carpetas.

## 🚀 Quick Start

### 1. Instalar Dependencias

```bash
npm install
# o
pnpm install
```

### 2. Configurar Variables de Entorno

```bash
# Crear .env.local
cp .env.example .env.local

# Editar con tus credenciales de Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

### 3. Configurar MCPs (Opcional)

Edita `.mcp.json` con tu project ref de Supabase:

```json
{
  "mcpServers": {
    "supabase": {
      "args": ["--project-ref=TU_PROJECT_REF"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "TU_TOKEN"
      }
    }
  }
}
```

### 4. Iniciar Desarrollo

```bash
npm run dev
# Auto-detecta puerto disponible (3000-3006)
```

## 🛠️ Comandos Disponibles

### Development
```bash
npm run dev          # Servidor desarrollo (auto-port 3000-3006)
npm run build        # Build para producción
npm run start        # Servidor producción
```

### Quality Assurance
```bash
npm run test         # Tests con Jest
npm run test:watch   # Tests en modo watch
npm run lint         # ESLint
npm run lint:fix     # Fix automático
npm run typecheck    # TypeScript check
```

### Skills Management
```bash
# Crear nuevo skill
python .claude/skills/skill-creator/scripts/init_skill.py my-skill

# Validar skill
python .claude/skills/skill-creator/scripts/quick_validate.py ./my-skill

# Empaquetar skill
python .claude/skills/skill-creator/scripts/package_skill.py ./my-skill
```

## 🤖 Claude Code Integration

### Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `/explorador` | Explora codebase y arquitectura |
| `/ejecutar-prp` | Ejecuta PRPs (features complejas) |
| `/generar-prp` | Genera nuevo PRP |
| `/preparar-paralelo` | Prepara tareas paralelas |
| `/ejecutar-paralelo` | Ejecuta en paralelo |

### Agentes Especializados

1. **Codebase Analyst** - Analiza arquitectura y patrones
2. **Gestor Documentación** - Mantiene docs actualizados

### MCPs Configurados (El Cyborg)

- 🧠 **Next.js DevTools** - Conectado a `/_next/mcp` para debug en tiempo real
- 👁️ **Playwright** - Validación visual y testing automatizado
- 🗄️ **Supabase** - Integración directa con DB y auth

## 🎨 Bucle Agéntico con Playwright

Este setup incluye integración con Playwright MCP para desarrollo visual:

```
1. Implementar componente
2. Capturar screenshot automático
3. Comparar vs requirements
4. Iterar hasta pixel-perfect
```

Lee `.claude/prompts/bucle-agentico.md` para más detalles.

## 📝 Crear tu Primera Feature

### Opción 1: Manual

```bash
mkdir -p src/features/mi-feature/{components,hooks,services,types,store}
```

### Opción 2: Con PRP

```bash
# En Claude Code, ejecuta:
/generar-prp

# Describe tu feature, el agente generará:
# - Estructura completa
# - Componentes base
# - Hooks necesarios
# - Types + validaciones
# - Tests
```

## 🔒 Supabase Setup

### 1. Crear Proyecto en Supabase

```bash
# Visita: https://supabase.com/dashboard
# Crea nuevo proyecto
# Copia URL y Anon Key
```

### 2. Configurar Cliente

El cliente ya está configurado en `src/shared/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### 3. Crear Migraciones

```bash
# Guardar migraciones en supabase/migrations/
# Ejemplo: supabase/migrations/001_create_users.sql
```

## 🧪 Testing Strategy

### Unit Tests

```typescript
// src/features/auth/hooks/useAuth.test.ts
import { renderHook } from '@testing-library/react'
import { useAuth } from './useAuth'

test('should authenticate user', async () => {
  const { result } = renderHook(() => useAuth())
  await result.current.login('test@example.com', 'password')
  expect(result.current.user).toBeDefined()
})
```

### Run Tests

```bash
npm run test                    # Run all tests
npm run test:watch              # Watch mode
npm run test:coverage           # Coverage report
```

## 🎯 Best Practices

### Component Structure

```typescript
// ✅ GOOD: Clear props, typed, documented
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  onClick: () => void
}

export function Button({ children, variant = 'primary', onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  )
}
```

### Feature Organization

```typescript
// ✅ GOOD: Todo relacionado en un lugar
src/features/auth/
├── components/     # UI específicos de auth
├── hooks/          # Lógica de auth
├── services/       # API calls
├── types/          # Types de auth
└── store/          # Estado de auth
```

## 📚 Documentación

- **CLAUDE.md** - System prompt completo (la fuente de verdad)
- **.claude/prompts/** - Metodologías y patrones
- **.claude/PRPs/templates/** - Templates para features
- **.claude/skills/** - Skills reutilizables

## 🚨 Troubleshooting

### Puerto Ocupado (EADDRINUSE)

```bash
# El auto-port detection debería resolver esto
# Si persiste:
lsof -i :3000
kill -9 <PID>

# O usa el script directamente:
node scripts/dev-server.js
```

### TypeScript Errors

```bash
npm run typecheck          # Verificar errores
rm -rf .next               # Limpiar cache
npm install                # Reinstalar deps
```

### Tests Failing

```bash
npm run test -- --clearCache    # Limpiar cache de Jest
npm run test -- --verbose       # Ver detalles
```

## 🎯 Próximos Pasos

1. **Lee CLAUDE.md** - Principios y convenciones completas
2. **Configura Supabase** - Auth + Database
3. **Crea tu primera feature** - Usa `/generar-prp`
4. **Implementa autenticación** - Feature auth incluida
5. **Deploy** - Vercel/Netlify ready

## 🤝 Contribuir

Este template está diseñado para ser extendido. Algunas ideas:

- [ ] Añadir más features base (notifications, settings)
- [ ] Crear más skills específicos
- [ ] Mejorar PRPs templates
- [ ] Añadir más tests de ejemplo

## 📦 Deploy

### Vercel (Recomendado)

```bash
npm install -g vercel
vercel
```

### Configurar Variables de Entorno

En tu dashboard de Vercel, añade:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GA_ID` (Google Analytics)
- `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` (Facebook Pixel)

**IMPORTANTE**: Para variables `NEXT_PUBLIC_*`, también crea un archivo `.env.production` en tu repo con los valores, ya que se inyectan en build time.

## 📊 Analytics Integration

### Google Analytics

1. Obtén tu Measurement ID en [analytics.google.com](https://analytics.google.com)
2. Añade a `.env.production`:
```bash
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Facebook Pixel

1. Obtén tu Pixel ID en [business.facebook.com/events_manager](https://business.facebook.com/events_manager)
2. Añade a `.env.production`:
```bash
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=123456789012345
```

### Eventos disponibles

Los componentes incluyen helpers para trackear eventos:

```typescript
import { gaEvents } from '@/components/analytics/GoogleAnalytics'
import { fbEvents } from '@/components/analytics/FacebookPixel'

// Trackear cuando usuario abre chat
gaEvents.chatStarted()
fbEvents.chatStarted()

// Trackear lead
gaEvents.chatLead('industry')
fbEvents.lead({ content_name: 'Form', content_category: 'Lead' })
```

---

**Next.js + Claude Code Setup v1.0** | Built with AI-first development in mind 🤖

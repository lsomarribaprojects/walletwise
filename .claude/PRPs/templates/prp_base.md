# PRP-XXX: [Titulo]

> **Estado**: PENDIENTE APROBACION
> **Fecha**: YYYY-MM-DD
> **Proyecto**: [nombre]

---

## Objetivo
[Que se construye - estado final deseado]

## Por Que

| Problema | Solucion |
|----------|----------|
| [Problema] | [Solucion] |

**Valor de negocio**: [Impacto medible]

## Que

### Criterios de Exito
- [ ] [Criterio medible]

---

## Contexto

### Referencias
```yaml
- file: src/features/existente/
  why: Patron a seguir
- url: [docs]
  why: API reference
```

### Arquitectura Propuesta (Feature-First)
```
src/features/[nueva-feature]/
├── components/
├── hooks/
├── services/
├── store/
└── types/
```

### Modelo de Datos (Supabase)
```sql
CREATE TABLE [tabla] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_[tabla]_[campo] ON [tabla]([campo]);
```

---

## Blueprint

### Fase 1: [Nombre]
**Objetivo**: [Que se logra]
- [ ] Tarea 1
- [ ] Tarea 2

**Validacion**: [Como verificar]

### Fase N: Validacion E2E
- [ ] `npm run typecheck && npm run lint`
- [ ] `npm run build`
- [ ] Playwright screenshot

---

## Bucle de Validacion

```bash
# Nivel 1: TypeScript
npm run typecheck

# Nivel 2: Build
npm run build

# Nivel 3: Visual (Playwright)
# screenshot → verificar → iterar
```

---

## Gotchas
```typescript
// CRITICO: Chart.js + SSR requiere dynamic import
// CRITICO: Supabase RLS debe habilitarse en produccion
// CRITICO: Neumorphism usa bg-neu-bg y shadow-neu
```

## Anti-Patrones
- NO crear nuevos patrones si los existentes funcionan
- NO ignorar errores de TypeScript
- NO hardcodear valores (usar constantes)
- NO omitir validacion Zod en inputs

---

*PRP pendiente aprobacion. No se ha modificado codigo.*

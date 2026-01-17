# Credit Scores Feature (Premium)

Feature exclusiva para usuarios Premium que permite trackear y analizar el credit score estimado basado en datos de la aplicación.

## Estructura

```
credit-scores/
├── types/
│   └── index.ts              # Tipos, interfaces, y helpers
├── services/
│   ├── creditScoreService.ts # CRUD y operaciones de DB
│   └── scoreCalculator.ts    # Algoritmos de cálculo y tips
├── hooks/
│   └── useCreditScore.ts     # React hooks
├── components/
│   ├── CreditScoreGauge.tsx       # Gauge semicircular principal
│   ├── ScoreFactorsCard.tsx       # Desglose de factores
│   ├── ScoreHistoryChart.tsx      # Gráfico de historial
│   ├── ScoreTipsCard.tsx          # Tips de mejora
│   ├── ScoreRangeIndicator.tsx    # Indicador de rangos
│   └── index.ts
└── index.ts                  # Exports principales
```

## Base de Datos

### Tabla: `credit_score_history`

Almacena el historial de credit scores del usuario.

```sql
CREATE TABLE credit_score_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  score INTEGER (300-850),
  score_date DATE,
  factors JSONB,
  source TEXT ('calculated', 'manual', 'imported'),
  notes TEXT,
  created_at TIMESTAMP
)
```

### Funciones RPC

1. **calculate_estimated_credit_score(user_id)**: Calcula un score estimado basado en datos de la app
2. **get_credit_score_factors(user_id)**: Obtiene el desglose de factores (0-100 cada uno)

## Algoritmo de Cálculo

El score se calcula basado en 5 factores ponderados:

### 1. Payment History (35%)
- Basado en `loan_payments` (pagos a tiempo vs totales)
- 100 puntos = 100% pagos a tiempo
- 75 puntos = sin historial (neutral)

### 2. Credit Utilization (30%)
- Basado en `credit_cards` (balance usado vs límite)
- 100 puntos = 0-10% utilización
- 90 puntos = 10-30% utilización
- 50 puntos = sin tarjetas (neutral)

### 3. Credit Age (15%)
- Basado en antigüedad de cuentas
- 100 puntos = 10+ años
- 50 puntos = sin cuentas (neutral)

### 4. Credit Mix (10%)
- Diversidad de tipos de crédito
- 100 puntos = tarjetas + préstamos
- 70 puntos = solo uno de los dos
- 40 puntos = sin cuentas

### 5. Hard Inquiries (10%)
- Penaliza cuentas recientes (< 6 meses)
- 100 puntos = 0 cuentas nuevas
- 40 puntos = 4+ cuentas nuevas

### Conversión a FICO (300-850)

```typescript
// Factores de 0-100 a score 300-850
const weighted =
  payment_history * 0.35 +
  credit_utilization * 0.30 +
  credit_age * 0.15 +
  credit_mix * 0.10 +
  hard_inquiries * 0.10

const score = 300 + Math.round((weighted / 100) * 550)
```

## Rangos de Score

| Rango | Min | Max | Color | Label |
|-------|-----|-----|-------|-------|
| Exceptional | 800 | 850 | Emerald (#10B981) | Exceptional |
| Very Good | 740 | 799 | Lime (#84CC16) | Very Good |
| Good | 670 | 739 | Yellow (#FBBF24) | Good |
| Fair | 580 | 669 | Orange (#FB923C) | Fair |
| Poor | 300 | 579 | Red (#EF4444) | Poor |

## Uso

### 1. Calcular Score Automáticamente

```typescript
import { useCalculatedScore } from '@/features/credit-scores'

function MyComponent() {
  const { scoreData, isLoading, recalculate } = useCalculatedScore()

  if (scoreData) {
    console.log(scoreData.score)        // 720
    console.log(scoreData.range)        // 'good'
    console.log(scoreData.factors)      // { payment_history: 85, ... }
    console.log(scoreData.tips)         // [{ title: "Pay all bills...", ... }]
  }

  return <button onClick={recalculate}>Recalculate</button>
}
```

### 2. Ver Historial

```typescript
import { useScoreHistory } from '@/features/credit-scores'

function History() {
  const { scores, statistics, trend } = useScoreHistory(12) // últimos 12 meses

  console.log(scores)           // [{ score: 720, date: '2026-01-15', ... }]
  console.log(statistics)       // { current: 720, highest: 750, ... }
  console.log(trend)            // { direction: 'up', change: 15, ... }
}
```

### 3. CRUD de Scores

```typescript
import { useCreditScore } from '@/features/credit-scores'

function ManageScores() {
  const { scores, addScore, editScore, removeScore } = useCreditScore()

  const handleAdd = async () => {
    await addScore({
      score: 720,
      score_date: '2026-01-15',
      source: 'manual',
      notes: 'Updated from credit report'
    })
  }
}
```

### 4. Componentes

```typescript
import {
  CreditScoreGauge,
  ScoreFactorsCard,
  ScoreHistoryChart,
  ScoreTipsCard,
  ScoreRangeIndicator
} from '@/features/credit-scores'

function CreditScorePage() {
  const { scoreData } = useCalculatedScore()
  const { scores } = useScoreHistory()

  return (
    <>
      <CreditScoreGauge score={scoreData.score} />
      <ScoreFactorsCard factors={scoreData.factors} />
      <ScoreHistoryChart scores={scores} />
      <ScoreTipsCard tips={scoreData.tips} />
      <ScoreRangeIndicator score={scoreData.score} />
    </>
  )
}
```

## Página Principal

`/credit-score` - Protegida con `TierGate` (feature: "credit_scores")

### Layout

```
┌─────────────────────────────────────────────┐
│  Credit Score              [Recalculate] [Save]  │
├──────────────┬──────────────────────────────┤
│              │                              │
│   Gauge      │   Factors                    │
│   Score      │   - Payment History          │
│   Range      │   - Utilization              │
│   Trend      │   - Age                      │
│              │   - Mix                      │
│   Statistics │   - Inquiries                │
│              │                              │
│              │   History Chart              │
│              │                              │
│              │   Tips                       │
│              │   - Tip 1                    │
│              │   - Tip 2                    │
│              │                              │
└──────────────┴──────────────────────────────┘
```

## Integración con Subscriptions

```typescript
// La feature está bloqueada para usuarios no-Premium
<TierGate feature="credit_scores" blur>
  <CreditScorePage />
</TierGate>
```

De `src/features/subscriptions/types/index.ts`:

```typescript
TIER_LIMITS = {
  starter: { credit_scores: false },
  pro: { credit_scores: false },
  premium: { credit_scores: true }  // Solo Premium
}
```

## Disclaimer

Este score es **ESTIMADO** basado en datos de la app. NO es un score oficial de FICO o VantageScore. Los usuarios deben consultar sus scores reales con las agencias de crédito.

## Migraciones

Ejecutar: `supabase/migrations/010_credit_scores.sql`

```bash
# Aplicar migración
supabase db push

# O con Supabase CLI
supabase migration up
```

## Testing

1. Crear usuario Premium
2. Agregar tarjetas de crédito en `/credit-cards`
3. Agregar préstamos en `/loans`
4. Registrar pagos en los préstamos
5. Ir a `/credit-score` y calcular

El score debería reflejar el comportamiento de pagos y utilización de crédito.

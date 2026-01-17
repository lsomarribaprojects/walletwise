# Feature: Budgets (Presupuestos)

Sistema completo de gestión de presupuestos con tracking automático de gastos y alertas visuales.

## Estructura

```
budgets/
├── components/
│   ├── BudgetCard.tsx              # Card individual con gauge circular
│   ├── BudgetForm.tsx              # Modal para crear/editar presupuestos
│   ├── BudgetList.tsx              # Lista con filtros por período
│   ├── BudgetProgressBar.tsx       # Barra de progreso con colores
│   ├── BudgetSummaryCard.tsx       # Resumen general de presupuestos
│   ├── CategoryBudgetChart.tsx     # Gráfico por categoría
│   └── CircularGauge.tsx           # Gauge semicircular SVG
├── hooks/
│   └── useBudgets.ts               # Hooks para CRUD y analytics
├── services/
│   └── budgetService.ts            # Servicios de API
├── store/
│   └── budgetStore.ts              # Estado global con Zustand
├── types/
│   └── index.ts                    # Tipos TypeScript
├── index.ts                        # Barrel export
└── README.md                       # Esta documentación

app/(main)/budgets/page.tsx         # Página principal
```

## Características

### 1. CRUD de Presupuestos
- Crear presupuestos por categoría
- Editar montos, períodos y umbrales
- Eliminar presupuestos (soft delete)
- Filtros por período (diario, semanal, mensual, trimestral, anual)

### 2. Tracking Automático
- Cálculo automático de gastos desde `transacciones`
- Relaciona categorías de presupuestos con transacciones
- Actualización en tiempo real del progreso

### 3. Visualización
- **Gauge Circular**: Progreso visual en cada card
- **Barra de Progreso**: Con colores según porcentaje
- **Gráfico por Categoría**: Vista comparativa horizontal
- **Resumen General**: Totales y estadísticas

### 4. Alertas Visuales
Sistema de colores basado en porcentaje de uso:

| Rango      | Color      | Estado       |
|------------|------------|--------------|
| 0-50%      | Verde      | Saludable    |
| 51-75%     | Amarillo   | Cuidado      |
| 76-90%     | Naranja    | Alerta       |
| 91-100%    | Rojo       | Crítico      |
| >100%      | Rojo + Badge | Excedido   |

### 5. Umbrales Personalizados
- Cada presupuesto tiene un `alert_threshold` (default: 80%)
- Muestra advertencia cuando se alcanza el umbral
- Configurable entre 50% y 100%

## Base de Datos

### Tabla: budgets
```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  category_id UUID REFERENCES categories(id),
  name TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency_code TEXT DEFAULT 'USD',
  period TEXT CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
  start_date DATE NOT NULL,
  end_date DATE,
  alert_threshold DECIMAL(5, 2) DEFAULT 80.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Relaciones
- `category_id` → `categories.id` (1:N)
- `user_id` → `profiles.id` (1:N)
- Gastos calculados desde `transacciones` por nombre de categoría

## Uso

### En componentes
```tsx
import { useBudgets, BudgetList } from '@/features/budgets'

function MyComponent() {
  const { budgets, createBudget, deleteBudget } = useBudgets()

  const handleCreate = async (data: CreateBudgetInput) => {
    await createBudget(data)
  }

  return <BudgetList budgets={budgets} onDelete={deleteBudget} />
}
```

### Hooks disponibles
- `useBudgets()` - CRUD completo + lista
- `useBudget(id)` - Un presupuesto específico
- `useBudgetProgress(id)` - Progreso calculado
- `useOverspentBudgets()` - Presupuestos excedidos

## Algoritmo de Cálculo

### 1. Determinar Rango de Fechas
```typescript
function getPeriodDateRange(period: BudgetPeriod, startDate: string) {
  const start = new Date(startDate)
  const end = new Date(start)

  switch (period) {
    case 'daily': end.setDate(start.getDate() + 1); break
    case 'weekly': end.setDate(start.getDate() + 7); break
    case 'monthly': end.setMonth(start.getMonth() + 1); break
    // ...
  }

  return { start, end }
}
```

### 2. Calcular Gasto
```typescript
async function calculateSpentForBudget(categoryId, startDate, endDate) {
  // 1. Obtener nombre de categoría desde categories
  const category = await fetchCategory(categoryId)

  // 2. Sumar transacciones de tipo 'gasto' con esa categoría
  const transactions = await fetchTransactions({
    type: 'gasto',
    category: category.name,
    dateRange: [startDate, endDate]
  })

  return transactions.reduce((sum, t) => sum + t.monto, 0)
}
```

### 3. Calcular Progreso
```typescript
const percentage = (spent / budget) * 100
const isOverspent = spent > budget
const isNearThreshold = percentage >= alert_threshold
```

## Consideraciones de Rendimiento

1. **Carga Inicial**: Todos los presupuestos activos
2. **Cálculo de Spent**: Ejecutado en paralelo con `Promise.all`
3. **Filtros**: En cliente (budgets ya cargados)
4. **Actualización**: Solo cuando hay cambios en presupuestos

## Mejoras Futuras

- [ ] Notificaciones push cuando se alcanza umbral
- [ ] Historial de presupuestos pasados
- [ ] Proyecciones basadas en tendencias
- [ ] Comparación mes a mes
- [ ] Export a PDF/Excel
- [ ] Templates de presupuestos comunes

## Accesibilidad

- Etiquetas ARIA en formularios
- Navegación por teclado completa
- Estados de enfoque visibles
- Colores con suficiente contraste
- Textos alternativos para iconos SVG

## Testing

### Tests Unitarios
- `budgetService.test.ts` - Funciones de cálculo
- `BudgetCard.test.tsx` - Renderizado de componentes
- `useBudgets.test.ts` - Lógica de hooks

### Tests de Integración
- Creación de presupuesto → Aparece en lista
- Edición → Actualiza en tiempo real
- Eliminación → Se oculta de la UI
- Cálculo de spent → Suma correcta de transacciones

## Notas Técnicas

- **TypeScript Strict**: Sin uso de `any`
- **Componentes Controlados**: Formularios con estado local
- **Optimistic Updates**: UI actualizada antes de respuesta del servidor
- **Error Handling**: Try/catch en todas las operaciones async
- **Loading States**: Skeletons y spinners en carga de datos

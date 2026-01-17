# Ejemplo de Uso - Feature Budgets

## Escenario: Usuario crea presupuesto mensual de comida

### 1. Usuario navega a /budgets
```typescript
// La página se carga automáticamente con todos los presupuestos activos
// Hook useBudgets() se ejecuta en el mount
```

### 2. Usuario hace click en "Crear Presupuesto"
```typescript
// Se abre el modal BudgetForm
// Usuario completa el formulario:
{
  name: "Presupuesto de Comida - Enero",
  category_id: "uuid-de-categoria-comida",
  amount: 500,
  period: "monthly",
  start_date: "2026-01-01",
  alert_threshold: 80
}
```

### 3. Sistema crea el presupuesto
```typescript
// budgetService.createBudget() ejecuta:

// 1. Calcula fechas del período
const { start, end } = getPeriodDateRange('monthly', '2026-01-01')
// start: 2026-01-01T00:00:00.000Z
// end: 2026-02-01T00:00:00.000Z

// 2. Inserta en base de datos
await supabase.from('budgets').insert({
  category_id: "uuid-de-categoria-comida",
  name: "Presupuesto de Comida - Enero",
  amount: 500,
  period: "monthly",
  start_date: "2026-01-01T00:00:00.000Z",
  end_date: "2026-02-01T00:00:00.000Z",
  alert_threshold: 80,
  is_active: true
})

// 3. Calcula gasto actual
// Busca nombre de categoría
const category = await supabase
  .from('categories')
  .select('name')
  .eq('id', 'uuid-de-categoria-comida')
  .single()
// category.name = "Comida"

// Suma transacciones de tipo 'gasto' con esa categoría
const transactions = await supabase
  .from('transacciones')
  .select('monto')
  .eq('tipo', 'gasto')
  .eq('categoria', 'Comida')
  .gte('fecha_hora', '2026-01-01T00:00:00.000Z')
  .lte('fecha_hora', '2026-02-01T00:00:00.000Z')

const spent = transactions.reduce((sum, t) => sum + Number(t.monto), 0)
// Supongamos que hay $250 gastados

// 4. Retorna el presupuesto con datos calculados
return {
  id: "nuevo-uuid",
  user_id: "uuid-del-usuario",
  category_id: "uuid-de-categoria-comida",
  name: "Presupuesto de Comida - Enero",
  amount: 500,
  currency_code: "USD",
  period: "monthly",
  start_date: "2026-01-01T00:00:00.000Z",
  end_date: "2026-02-01T00:00:00.000Z",
  alert_threshold: 80,
  is_active: true,
  spent: 250,  // Calculado
  category_name: "Comida",  // Agregado
  category_color: "#22C55E"  // Agregado
}
```

### 4. UI se actualiza
```typescript
// BudgetCard renderiza con los datos:

// CircularGauge muestra:
percentage = (250 / 500) * 100 = 50%
color = verde (porque 50% <= 50%)

// BudgetProgressBar muestra:
"$250.00 / $500.00"
Barra al 50% en color verde

// Disponible:
remaining = 500 - 250 = 250
"Disponible: $250.00"

// No muestra alerta porque 50% < 80% (alert_threshold)
```

### 5. Usuario gasta más en comida
```typescript
// Usuario registra una nueva transacción de $150
await createTransaction({
  tipo: 'gasto',
  monto: 150,
  categoria: 'Comida',
  cuenta: 'Efectivo',
  fecha_hora: '2026-01-15T12:00:00.000Z'
})

// Al recargar la página de presupuestos:
spent = 250 + 150 = 400
percentage = (400 / 500) * 100 = 80%

// Ahora la UI muestra:
// - CircularGauge en amarillo (80% > 75%)
// - BudgetProgressBar al 80% en amarillo
// - Alerta de "Cerca del límite" porque 80% >= 80% (alert_threshold)
```

### 6. Usuario excede el presupuesto
```typescript
// Usuario gasta $150 más
spent = 400 + 150 = 550
percentage = (550 / 500) * 100 = 110%

// UI muestra:
// - CircularGauge en rojo con texto "110% Excedido"
// - BudgetProgressBar al 100% (max) en rojo
// - Badge rojo "Presupuesto excedido"
// - "Excedido: $50.00" (en lugar de "Disponible")
```

## Flujo de Edición

```typescript
// 1. Usuario hace click en botón de editar en BudgetCard
handleEdit(budget)

// 2. Se abre BudgetForm con datos pre-llenados
<BudgetForm budget={existingBudget} onSubmit={handleUpdate} />

// 3. Usuario modifica el monto de $500 a $600

// 4. Sistema actualiza
await budgetService.updateBudget(budgetId, { amount: 600 })

// 5. Recalcula porcentajes
percentage = (550 / 600) * 100 = 91.67%
// Ahora está en "Alerta" (naranja) en lugar de "Excedido" (rojo)
```

## Filtros por Período

```typescript
// Usuario selecciona filtro "Mensuales"
setSelectedPeriod('monthly')

// BudgetList filtra en cliente:
const filteredBudgets = budgets.filter(b => b.period === 'monthly')

// Solo muestra presupuestos con period='monthly'
```

## Resumen General

```typescript
// BudgetSummaryCard calcula:
const summary = {
  totalBudgeted: 500 + 200 + 300,  // Suma de todos los budgets
  totalSpent: 550 + 150 + 100,     // Suma de todos los spent
  percentageUsed: (800 / 1000) * 100 = 80%,
  activeBudgets: 3,
  overspentBudgets: 1  // Solo el de comida está excedido
}
```

## Gráfico por Categoría

```typescript
// CategoryBudgetChart agrupa presupuestos por categoría:
[
  {
    category_id: "uuid-comida",
    category_name: "Comida",
    category_color: "#22C55E",
    budgeted: 500,
    spent: 550,
    percentage: 110
  },
  {
    category_id: "uuid-transporte",
    category_name: "Transporte",
    category_color: "#14B8A6",
    budgeted: 200,
    spent: 150,
    percentage: 75
  }
]

// Renderiza barras horizontales proporcionales al monto presupuestado
// Con colores según el porcentaje de uso
```

## Casos Edge

### Sin transacciones
```typescript
spent = 0
percentage = 0%
color = verde
remaining = 500
// No muestra alertas
```

### Presupuesto de $0 (no válido)
```typescript
// Validación en el formulario previene esto
<input type="number" min="0" step="0.01" required />
// Y en la BD hay constraint: CHECK (amount > 0)
```

### Categoría sin transacciones vinculadas
```typescript
// Si la categoría es nueva y nunca se usó:
const transactions = []  // Array vacío
spent = 0
// Funciona normalmente
```

### Período finalizado
```typescript
// Si hoy es 2026-02-15 y el presupuesto era mensual desde 2026-01-01:
// El presupuesto sigue mostrándose si is_active=true
// Para ocultarlo, el usuario debe eliminarlo (soft delete: is_active=false)
```

## Performance

### Carga inicial
```typescript
// 1 query a budgets con join a categories
// N queries a transacciones (1 por budget) ejecutadas en paralelo
// Promise.all() las ejecuta simultáneamente

const budgetsWithSpent = await Promise.all(
  budgets.map(async (budget) => {
    const spent = await calculateSpentForBudget(...)
    return { ...budget, spent }
  })
)
```

### Actualización
```typescript
// Solo cuando el usuario:
// - Crea un presupuesto
// - Edita un presupuesto
// - Elimina un presupuesto

// NO se recarga automáticamente cuando hay nuevas transacciones
// El usuario debe refrescar manualmente o recargar la página
```

## Mejora Futura: Real-time Updates

```typescript
// Implementar Supabase Realtime subscriptions
supabase
  .channel('budgets-updates')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'transacciones' },
    (payload) => {
      // Recalcular presupuestos afectados
      loadBudgets()
    }
  )
  .subscribe()
```

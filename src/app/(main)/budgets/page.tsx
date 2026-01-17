'use client'

import { useState } from 'react'
import { NeuButton } from '@/shared/components/ui'
import {
  useBudgets,
  BudgetList,
  BudgetForm,
  BudgetSummaryCard,
  CategoryBudgetChart,
  Budget,
  CreateBudgetInput,
} from '@/features/budgets'

export default function BudgetsPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>()

  const {
    budgets,
    summary,
    isLoading,
    error,
    createBudget,
    updateBudget,
    deleteBudget,
  } = useBudgets()

  const handleCreateBudget = async (data: CreateBudgetInput) => {
    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, data)
      } else {
        await createBudget(data)
      }
      setShowForm(false)
      setEditingBudget(undefined)
    } catch (error) {
      console.error('Error saving budget:', error)
    }
  }

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget)
    setShowForm(true)
  }

  const handleDeleteBudget = async (id: string) => {
    try {
      await deleteBudget(id)
    } catch (error) {
      console.error('Error deleting budget:', error)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingBudget(undefined)
  }

  if (isLoading && budgets.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando presupuestos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-700">Presupuestos</h1>
            <p className="text-gray-500">
              Controla tus gastos con presupuestos personalizados
            </p>
          </div>
          <NeuButton variant="solid" onClick={() => setShowForm(true)}>
            <svg
              className="w-5 h-5 mr-2 inline-block"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Crear Presupuesto
          </NeuButton>
        </header>

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <svg
              className="w-6 h-6 text-red-600 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content */}
          <div className="flex-1">
            <BudgetList
              budgets={budgets}
              onEdit={handleEditBudget}
              onDelete={handleDeleteBudget}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-6 lg:sticky lg:top-8 lg:self-start">
            {summary && <BudgetSummaryCard summary={summary} />}
            <CategoryBudgetChart />
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {showForm && (
        <BudgetForm
          budget={editingBudget}
          onSubmit={handleCreateBudget}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}

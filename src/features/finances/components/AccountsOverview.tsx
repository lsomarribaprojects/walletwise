'use client'

import { CreditCard, Banknote, PiggyBank, TrendingUp, Plus } from 'lucide-react'
import { Transaction, CuentaDB } from '../types'
import {
  calculateBalancesByCuenta,
  formatCurrency,
  CuentaBalance,
} from '../services/analytics'
import { useLanguage } from '@/shared/i18n'

interface AccountsOverviewProps {
  transactions: Transaction[]
  cuentas: CuentaDB[]
  onAddAccount?: () => void
}

const colorClasses: Record<string, { bg: string; icon: string; border: string }> = {
  purple: {
    bg: 'bg-purple-500/10',
    icon: 'text-purple-500',
    border: 'border-purple-500/20',
  },
  orange: {
    bg: 'bg-orange-500/10',
    icon: 'text-orange-500',
    border: 'border-orange-500/20',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    icon: 'text-emerald-500',
    border: 'border-emerald-500/20',
  },
  pink: {
    bg: 'bg-pink-500/10',
    icon: 'text-pink-500',
    border: 'border-pink-500/20',
  },
  amber: {
    bg: 'bg-amber-500/10',
    icon: 'text-amber-500',
    border: 'border-amber-500/20',
  },
  gray: {
    bg: 'bg-gray-500/10',
    icon: 'text-gray-500',
    border: 'border-gray-500/20',
  },
}

function getAccountIcon(tipo: string) {
  switch (tipo) {
    case 'efectivo':
      return Banknote
    case 'ahorro':
      return PiggyBank
    case 'inversion':
      return TrendingUp
    default:
      return CreditCard
  }
}

export function AccountsOverview({ transactions, cuentas, onAddAccount }: AccountsOverviewProps) {
  const balances = calculateBalancesByCuenta(transactions, cuentas)
  const { t } = useLanguage()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-700">{t.accounts.title}</h2>
        {onAddAccount && (
          <button
            onClick={onAddAccount}
            className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            {t.accounts.add}
          </button>
        )}
      </div>

      {balances.length === 0 ? (
        <div className="bg-neu-bg shadow-neu rounded-xl p-8 text-center">
          <PiggyBank className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">{t.accounts.noAccounts}</p>
          {onAddAccount && (
            <button
              onClick={onAddAccount}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.accounts.createFirst}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {balances.map((item: CuentaBalance) => {
            const colors = colorClasses[item.color] || colorClasses.gray
            const Icon = getAccountIcon(item.tipo)
            const isNegative = item.balance < 0

            return (
              <div
                key={item.cuenta}
                className={`bg-neu-bg shadow-neu rounded-xl p-4 transition-all duration-300 hover:shadow-neu-md border ${colors.border}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <Icon className={`w-4 h-4 ${colors.icon}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-600 truncate">
                    {item.cuenta}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Balance</p>
                  <p
                    className={`text-lg font-bold ${
                      isNegative ? 'text-red-500' : 'text-gray-800'
                    }`}
                  >
                    {formatCurrency(item.balance)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

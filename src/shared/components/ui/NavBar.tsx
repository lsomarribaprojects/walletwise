'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Wallet,
  Calculator,
  ChevronDown,
  CalendarClock,
  CalendarDays,
  CreditCard,
  FileText,
  LogOut,
  User,
  Bot,
  Menu,
  Settings,
  PiggyBank,
  Target,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { signout } from '@/actions/auth'
import { useAgentSidebar } from '@/shared/context/AgentSidebarContext'
import { useLanguage } from '@/shared/i18n'
import { LanguageSwitcher } from './LanguageSwitcher'
import { AlertDropdown } from '@/features/alerts'

export function NavBar() {
  const pathname = usePathname()
  const [financeOpen, setFinanceOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, profile, loading } = useAuth()
  const { setIsOpen: openAgentSidebar } = useAgentSidebar()
  const { t } = useLanguage()

  const isDashboardActive = pathname === '/'
  const isFinanceActive = pathname.startsWith('/finances') || pathname === '/wizard' || pathname === '/budgets' || pathname === '/goals' || pathname === '/credit-score'
  const isCFOActive = pathname === '/agent'

  // Build finance submenu items with translations
  const financeSubItems = [
    { href: '/wizard', label: t.nav.roiCalculator, icon: Calculator },
    { href: '/finances/recurring', label: t.nav.monthly, icon: CalendarClock },
    { href: '/finances/annual', label: t.nav.annual, icon: CalendarDays },
    { href: '/finances/credit-cards', label: t.nav.creditCards, icon: CreditCard },
    { href: '/budgets', label: t.nav.budgets, icon: PiggyBank },
    { href: '/goals', label: t.goals.title, icon: Target },
    { href: '/credit-score', label: t.creditScore.title, icon: TrendingUp },
    { href: '/finances/reports', label: t.nav.reports, icon: FileText },
    // Solo mostrar Admin Panel si el usuario es admin
    ...(profile?.role === 'admin' ? [
      { href: 'divider', label: '', icon: null },
      { href: '/admin', label: t.nav.adminPanel, icon: Settings },
    ] : []),
  ]

  return (
    <nav className="sticky top-0 left-0 right-0 z-50 bg-neu-bg shadow-neu-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo o Menu Button (en agent page) */}
          {isCFOActive ? (
            <button
              onClick={() => openAgentSidebar(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neu-bg shadow-neu text-gray-600 hover:text-purple-600 hover:shadow-neu-sm transition-all"
              aria-label="Abrir historial"
            >
              <Menu className="w-5 h-5" />
              <span className="hidden sm:inline font-medium text-sm">{t.nav.history}</span>
            </button>
          ) : (
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="hidden sm:inline font-bold text-gray-800">Walletwise</span>
            </Link>
          )}

          {/* Nav Items - Order: CFO, Dashboard, Finanzas */}
          <div className="flex items-center gap-2">
            {/* CFO Agent Link */}
            <Link
              href="/agent"
              className={`
                flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium
                transition-all duration-200 lg:px-4
                ${
                  isCFOActive
                    ? 'bg-neu-bg shadow-neu-inset text-purple-600'
                    : 'bg-neu-bg shadow-neu text-gray-600 hover:text-purple-600 hover:shadow-neu-sm'
                }
              `}
            >
              <Bot className="w-5 h-5 lg:w-4 lg:h-4" />
              <span className="hidden lg:inline">{t.nav.cfo}</span>
            </Link>

            {/* Dashboard Link */}
            <Link
              href="/"
              className={`
                flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium
                transition-all duration-200 lg:px-4
                ${
                  isDashboardActive
                    ? 'bg-neu-bg shadow-neu-inset text-purple-600'
                    : 'bg-neu-bg shadow-neu text-gray-600 hover:text-purple-600 hover:shadow-neu-sm'
                }
              `}
            >
              <LayoutDashboard className="w-5 h-5 lg:w-4 lg:h-4" />
              <span className="hidden lg:inline">{t.nav.dashboard}</span>
            </Link>

            {/* Finance dropdown - works on both mobile and desktop */}
            <div className="relative">
              <button
                onClick={() => setFinanceOpen(!financeOpen)}
                onBlur={() => setTimeout(() => setFinanceOpen(false), 150)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium
                  transition-all duration-200 lg:px-4
                  ${
                    isFinanceActive
                      ? 'bg-neu-bg shadow-neu-inset text-purple-600'
                      : 'bg-neu-bg shadow-neu text-gray-600 hover:text-purple-600 hover:shadow-neu-sm'
                  }
                `}
              >
                <Wallet className="w-5 h-5 lg:w-4 lg:h-4" />
                <span className="hidden lg:inline">{t.nav.finances}</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${financeOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {financeOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-neu-bg shadow-neu rounded-xl p-2 z-50">
                  {financeSubItems.map((item, idx) => {
                    // Divider
                    if (item.href === 'divider') {
                      return <hr key={idx} className="my-2 border-gray-200" />
                    }

                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                          transition-all duration-200
                          ${
                            isActive
                              ? 'bg-purple-50 text-purple-600'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-purple-600'
                          }
                        `}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* User Menu - desktop only */}
            {!loading && user && (
              <div className="hidden lg:block relative ml-2">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  onBlur={() => setTimeout(() => setUserMenuOpen(false), 150)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-neu-bg shadow-neu text-gray-600 hover:text-purple-600 hover:shadow-neu-sm transition-all duration-200"
                >
                  <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="hidden md:inline max-w-[120px] truncate">
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-neu-bg shadow-neu rounded-xl p-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 mb-2">
                      <p className="text-xs text-gray-500">{t.nav.connectedAs}</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{user.email}</p>
                    </div>
                    <form action={signout}>
                      <button
                        type="submit"
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
                      >
                        <LogOut className="w-4 h-4" />
                        {t.nav.logout}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Alerts Dropdown */}
            {!loading && user && (
              <AlertDropdown className="ml-1" />
            )}

            {/* Language Switcher */}
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  )
}

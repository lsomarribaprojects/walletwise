'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Check,
  X,
  Clock,
  Shield,
  User,
  Loader2,
  RefreshCw,
  UserCheck,
  UserX,
  Crown
} from 'lucide-react'
import { NeuButton } from '@/shared/components/ui/NeuButton'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  status: 'pending' | 'approved' | 'rejected'
  role: 'user' | 'admin'
  created_at: string
  approved_at: string | null
}

export function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  const supabase = createClient()

  const loadUsers = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [filter])

  const approveUser = async (userId: string) => {
    setActionLoading(userId)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw error
      await loadUsers()
    } catch (err) {
      console.error('Error approving user:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const rejectUser = async (userId: string) => {
    setActionLoading(userId)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw error
      await loadUsers()
    } catch (err) {
      console.error('Error rejecting user:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const toggleAdmin = async (userId: string, currentRole: string) => {
    setActionLoading(userId)
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin'
      const { error } = await supabase
        .from('profiles')
        .update({
          role: newRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw error
      await loadUsers()
    } catch (err) {
      console.error('Error toggling admin:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <Clock className="w-3 h-3" />
            Pendiente
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            <Check className="w-3 h-3" />
            Aprobado
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <X className="w-3 h-3" />
            Rechazado
          </span>
        )
      default:
        return null
    }
  }

  const pendingCount = users.filter(u => u.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Gestion de Usuarios</h2>
          <p className="text-sm text-gray-500 mt-1">
            Aprueba o rechaza solicitudes de acceso
          </p>
        </div>
        <NeuButton
          variant="secondary"
          size="sm"
          onClick={loadUsers}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </NeuButton>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">
            {users.filter(u => u.status === 'pending').length}
          </p>
          <p className="text-xs text-amber-700">Pendientes</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">
            {users.filter(u => u.status === 'approved').length}
          </p>
          <p className="text-xs text-emerald-700">Aprobados</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">
            {users.filter(u => u.status === 'rejected').length}
          </p>
          <p className="text-xs text-red-700">Rechazados</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
              ${filter === f
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {f === 'all' && 'Todos'}
            {f === 'pending' && `Pendientes ${pendingCount > 0 ? `(${pendingCount})` : ''}`}
            {f === 'approved' && 'Aprobados'}
            {f === 'rejected' && 'Rechazados'}
          </button>
        ))}
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hay usuarios {filter !== 'all' ? `${filter}s` : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-800 truncate">
                    {user.full_name || user.email.split('@')[0]}
                  </p>
                  {user.role === 'admin' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      <Crown className="w-3 h-3" />
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(user.status)}
                  <span className="text-xs text-gray-400">
                    {new Date(user.created_at).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {actionLoading === user.id ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <>
                    {user.status === 'pending' && (
                      <>
                        <button
                          onClick={() => approveUser(user.id)}
                          className="p-2 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors"
                          title="Aprobar"
                        >
                          <UserCheck className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => rejectUser(user.id)}
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                          title="Rechazar"
                        >
                          <UserX className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {user.status === 'approved' && (
                      <>
                        <button
                          onClick={() => toggleAdmin(user.id, user.role)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title={user.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                        >
                          <Shield className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => rejectUser(user.id)}
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                          title="Revocar acceso"
                        >
                          <UserX className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    {user.status === 'rejected' && (
                      <button
                        onClick={() => approveUser(user.id)}
                        className="p-2 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors"
                        title="Aprobar"
                      >
                        <UserCheck className="w-5 h-5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

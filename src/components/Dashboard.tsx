import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Users, DollarSign, Clock, TrendingUp, ClipboardCheck, AlertCircle } from 'lucide-react';
import { formatCurrency, STATUS_CONFIG, SERVICE_ORDER_STATUS_CONFIG } from '../lib/constants';
import type { Budget, Client, Payment, ServiceOrder } from '../lib/database.types';

export function Dashboard() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [budgetsRes, clientsRes, paymentsRes, ordersRes] = await Promise.all([
      supabase.from('budgets').select('*').order('created_at', { ascending: false }),
      supabase.from('clients').select('*'),
      supabase.from('payments').select('*'),
      supabase.from('service_orders').select('*'),
    ]);

    if (budgetsRes.data) setBudgets(budgetsRes.data);
    if (clientsRes.data) setClients(clientsRes.data);
    if (paymentsRes.data) setPayments(paymentsRes.data);
    if (ordersRes.data) setOrders(ordersRes.data);
    setLoading(false);
  };

  const stats = {
    totalBudgets: budgets.length,
    totalClients: clients.length,
    approvedBudgets: budgets.filter((b) => b.status === 'approved').length,
    pendingBudgets: budgets.filter((b) => b.status === 'sent' || b.status === 'revision').length,
    rejectedBudgets: budgets.filter((b) => b.status === 'rejected').length,
    totalValue: budgets
      .filter((b) => b.status === 'approved')
      .reduce((sum, b) => sum + b.total_materials + b.total_labor + b.total_additional, 0),
    totalReceived: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    totalPending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    totalOverdue: payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0),
    ordersInProgress: orders.filter(o => o.status === 'in_progress').length,
    ordersCompleted: orders.filter(o => o.status === 'completed').length,
    ordersPending: orders.filter(o => o.status === 'pending').length,
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-slate-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 text-sm sm:text-base">Visão geral completa do sistema</p>
      </div>

      <div className="mb-6 lg:mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Orçamentos</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.totalBudgets}</span>
            </div>
            <h3 className="text-slate-600 font-medium text-xs sm:text-sm">Total de Orçamentos</h3>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.approvedBudgets}</span>
            </div>
            <h3 className="text-slate-600 font-medium text-xs sm:text-sm">Aprovados</h3>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.pendingBudgets}</span>
            </div>
            <h3 className="text-slate-600 font-medium text-xs sm:text-sm">Aguardando</h3>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
              </div>
            </div>
            <h3 className="text-slate-600 font-medium text-xs sm:text-sm mb-1">Valor Aprovado</h3>
            <p className="text-lg sm:text-xl font-bold text-teal-600 truncate">{formatCurrency(stats.totalValue)}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 lg:mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Financeiro</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
            </div>
            <h3 className="text-slate-600 font-medium text-xs sm:text-sm mb-1">Recebido</h3>
            <p className="text-lg sm:text-xl font-bold text-emerald-600 truncate">{formatCurrency(stats.totalReceived)}</p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
              </div>
            </div>
            <h3 className="text-slate-600 font-medium text-xs sm:text-sm mb-1">A Receber</h3>
            <p className="text-lg sm:text-xl font-bold text-amber-600 truncate">{formatCurrency(stats.totalPending)}</p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
            </div>
            <h3 className="text-slate-600 font-medium text-xs sm:text-sm mb-1">Atrasado</h3>
            <p className="text-lg sm:text-xl font-bold text-red-600 truncate">{formatCurrency(stats.totalOverdue)}</p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.totalClients}</span>
            </div>
            <h3 className="text-slate-600 font-medium text-xs sm:text-sm">Clientes Ativos</h3>
          </div>
        </div>
      </div>

      <div className="mb-6 lg:mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Ordens de Serviço</h2>
        <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.ordersPending}</span>
            </div>
            <h3 className="text-slate-600 font-medium text-xs sm:text-sm">Pendentes</h3>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.ordersInProgress}</span>
            </div>
            <h3 className="text-slate-600 font-medium text-xs sm:text-sm">Em Execução</h3>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.ordersCompleted}</span>
            </div>
            <h3 className="text-slate-600 font-medium text-xs sm:text-sm">Finalizados</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 sm:p-6 border-b border-slate-200">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Orçamentos Recentes</h2>
          </div>
          <div className="p-4 sm:p-6">
            {budgets.length === 0 ? (
              <p className="text-slate-500 text-center py-4">Nenhum orçamento ainda</p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {budgets.slice(0, 5).map((budget) => (
                  <div key={budget.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="min-w-0 flex-1 mr-3">
                      <h3 className="font-medium text-slate-900 text-sm sm:text-base truncate">{budget.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-500 truncate">{budget.client_name || 'Sem cliente'}</p>
                    </div>
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_CONFIG[budget.status]?.color || STATUS_CONFIG.draft.color}`}>
                      {STATUS_CONFIG[budget.status]?.label || budget.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 sm:p-6 border-b border-slate-200">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900">Status dos Orçamentos</h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                const count = budgets.filter((b) => b.status === key).length;
                const percentage = budgets.length > 0 ? (count / budgets.length) * 100 : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs sm:text-sm text-slate-600">{config.label}</span>
                      <span className="text-xs sm:text-sm font-medium text-slate-900">{count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

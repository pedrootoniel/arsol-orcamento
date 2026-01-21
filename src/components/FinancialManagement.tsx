import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Download,
} from 'lucide-react';
import { PAYMENT_STATUS_CONFIG, PAYMENT_METHOD_CONFIG, formatCurrency, formatDate } from '../lib/constants';
import type { Payment, Budget } from '../lib/database.types';

type PaymentWithBudget = Payment & {
  budgets?: Budget | null;
};

export function FinancialManagement() {
  const [payments, setPayments] = useState<PaymentWithBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    const { data } = await supabase
      .from('payments')
      .select('*, budgets(*)')
      .order('due_date', { ascending: true });

    if (data) setPayments(data);
    setLoading(false);
  };

  const filteredPayments = payments.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

    let matchesPeriod = true;
    if (periodFilter !== 'all' && p.due_date) {
      const dueDate = new Date(p.due_date);
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      if (periodFilter === 'overdue') {
        matchesPeriod = dueDate < now && p.status === 'pending';
      } else if (periodFilter === 'this_month') {
        matchesPeriod = dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === now.getFullYear();
      } else if (periodFilter === 'next_30_days') {
        matchesPeriod = dueDate >= now && dueDate <= thirtyDaysFromNow;
      }
    }

    return matchesStatus && matchesPeriod;
  });

  const stats = {
    totalReceivable: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    totalReceived: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    totalOverdue: payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0),
    thisMonth: payments.filter(p => {
      const dueDate = new Date(p.due_date || '');
      const now = new Date();
      return dueDate.getMonth() === now.getMonth() &&
             dueDate.getFullYear() === now.getFullYear() &&
             p.status === 'paid';
    }).reduce((sum, p) => sum + p.amount, 0),
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
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Gestão Financeira</h1>
        <p className="text-slate-600 text-sm sm:text-base">Controle de pagamentos e recebíveis</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            </div>
          </div>
          <h3 className="text-slate-600 font-medium text-xs sm:text-sm mb-1">Recebido</h3>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600 truncate">{formatCurrency(stats.totalReceived)}</p>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
            </div>
          </div>
          <h3 className="text-slate-600 font-medium text-xs sm:text-sm mb-1">A Receber</h3>
          <p className="text-xl sm:text-2xl font-bold text-amber-600 truncate">{formatCurrency(stats.totalReceivable)}</p>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
          </div>
          <h3 className="text-slate-600 font-medium text-xs sm:text-sm mb-1">Atrasado</h3>
          <p className="text-xl sm:text-2xl font-bold text-red-600 truncate">{formatCurrency(stats.totalOverdue)}</p>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-slate-600 font-medium text-xs sm:text-sm mb-1">Este Mês</h3>
          <p className="text-xl sm:text-2xl font-bold text-blue-600 truncate">{formatCurrency(stats.thisMonth)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm sm:text-base appearance-none"
              >
                <option value="all">Todos os Status</option>
                {Object.entries(PAYMENT_STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm sm:text-base"
            >
              <option value="all">Todos os Períodos</option>
              <option value="overdue">Atrasados</option>
              <option value="this_month">Este Mês</option>
              <option value="next_30_days">Próximos 30 dias</option>
            </select>
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition text-sm sm:text-base">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Orçamento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Vencimento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Pagamento
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Nenhum pagamento encontrado
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-sm text-slate-900">
                      <div className="font-medium truncate max-w-xs">
                        {payment.budgets?.title || 'N/A'}
                      </div>
                      {payment.installment_number && (
                        <div className="text-xs text-slate-500">
                          Parcela {payment.installment_number}/{payment.total_installments}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {PAYMENT_METHOD_CONFIG[payment.payment_method]?.label}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {payment.due_date ? formatDate(payment.due_date) : '-'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${PAYMENT_STATUS_CONFIG[payment.status]?.color}`}>
                        {PAYMENT_STATUS_CONFIG[payment.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {payment.payment_date ? formatDate(payment.payment_date) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

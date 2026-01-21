import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Users, DollarSign, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { formatCurrency, STATUS_CONFIG } from '../lib/constants';
import type { Budget, Client } from '../lib/database.types';

export function Dashboard() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [budgetsRes, clientsRes] = await Promise.all([
      supabase.from('budgets').select('*').order('created_at', { ascending: false }),
      supabase.from('clients').select('*'),
    ]);

    if (budgetsRes.data) setBudgets(budgetsRes.data);
    if (clientsRes.data) setClients(clientsRes.data);
    setLoading(false);
  };

  const stats = {
    totalBudgets: budgets.length,
    totalClients: clients.length,
    approvedBudgets: budgets.filter((b) => b.status === 'approved').length,
    pendingBudgets: budgets.filter((b) => b.status === 'sent' || b.status === 'revision').length,
    totalValue: budgets
      .filter((b) => b.status === 'approved')
      .reduce((sum, b) => sum + b.total_materials + b.total_labor + b.total_additional, 0),
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-slate-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600">Visão geral do sistema de orçamentos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-3xl font-bold text-slate-900">{stats.totalBudgets}</span>
          </div>
          <h3 className="text-slate-600 font-medium">Total de Orçamentos</h3>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-3xl font-bold text-slate-900">{stats.totalClients}</span>
          </div>
          <h3 className="text-slate-600 font-medium">Clientes Cadastrados</h3>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-3xl font-bold text-slate-900">{stats.pendingBudgets}</span>
          </div>
          <h3 className="text-slate-600 font-medium">Aguardando Resposta</h3>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-teal-600" />
            </div>
            <span className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalValue)}</span>
          </div>
          <h3 className="text-slate-600 font-medium">Valor Aprovado</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Orçamentos Recentes</h2>
          </div>
          <div className="p-6">
            {budgets.length === 0 ? (
              <p className="text-slate-500 text-center py-4">Nenhum orçamento ainda</p>
            ) : (
              <div className="space-y-4">
                {budgets.slice(0, 5).map((budget) => (
                  <div key={budget.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-slate-900">{budget.title}</h3>
                      <p className="text-sm text-slate-500">{budget.client_name || 'Sem cliente'}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[budget.status]?.color || STATUS_CONFIG.draft.color}`}>
                      {STATUS_CONFIG[budget.status]?.label || budget.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Status dos Orçamentos</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                const count = budgets.filter((b) => b.status === key).length;
                const percentage = budgets.length > 0 ? (count / budgets.length) * 100 : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-600">{config.label}</span>
                      <span className="text-sm font-medium text-slate-900">{count}</span>
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

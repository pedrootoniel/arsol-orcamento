import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogOut, FileText, Calendar, Eye, Sun } from 'lucide-react';
import { STATUS_CONFIG, formatCurrency, formatDate } from '../lib/constants';
import { BudgetEditor } from './BudgetEditor';
import type { Budget } from '../lib/database.types';

export function ClientPortal() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    const { data } = await supabase
      .from('budgets')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setBudgets(data);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (selectedBudgetId) {
    return (
      <BudgetEditor
        budgetId={selectedBudgetId}
        onBack={() => setSelectedBudgetId(null)}
        readOnly={true}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-slate-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Sun className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-900">ArsolUp</h1>
                <p className="text-xs text-slate-500">Portal do Cliente</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Meus Orçamentos</h2>
          <p className="text-slate-600">
            Visualize seus orçamentos e acompanhe o status de cada projeto
          </p>
        </div>

        {budgets.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhum orçamento disponível</p>
            <p className="text-slate-400 text-sm">
              Quando seu orçamento for criado, ele aparecerá aqui
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {budgets.map((budget) => {
              const total = budget.total_materials + budget.total_labor + budget.total_additional;
              const isExpired =
                budget.validity_date && new Date(budget.validity_date) < new Date();

              return (
                <div
                  key={budget.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-1">
                          {budget.title}
                        </h3>
                        {budget.description && (
                          <p className="text-slate-600 text-sm">{budget.description}</p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isExpired
                            ? STATUS_CONFIG.expired.color
                            : STATUS_CONFIG[budget.status]?.color || STATUS_CONFIG.draft.color
                        }`}
                      >
                        {isExpired ? 'Expirado' : STATUS_CONFIG[budget.status]?.label || budget.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1">Materiais</p>
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(budget.total_materials)}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1">Mão de Obra</p>
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(budget.total_labor)}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1">Adicionais</p>
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(budget.total_additional)}
                        </p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-3">
                        <p className="text-xs text-emerald-600 mb-1">Total</p>
                        <p className="font-bold text-emerald-700">{formatCurrency(total)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Criado em {formatDate(budget.created_at)}
                        </span>
                        {budget.validity_date && (
                          <span className={isExpired ? 'text-red-500' : ''}>
                            Validade: {formatDate(budget.validity_date)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedBudgetId(budget.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="font-semibold text-amber-800 mb-2">Informação Importante</h3>
          <p className="text-amber-700 text-sm">
            Os valores apresentados são apenas para visualização. Caso deseje solicitar algum ajuste
            ou tenha dúvidas, utilize a aba "Comentários" dentro de cada orçamento para se comunicar
            com nossa equipe.
          </p>
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, FileText, Calendar, User, DollarSign, LogOut } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Budget = Database['public']['Tables']['budgets']['Row'];
type BudgetItem = Database['public']['Tables']['budget_items']['Row'];

interface Props {
  onSelectBudget: (budgetId: string) => void;
  selectedBudgetId: string | null;
}

export function BudgetList({ onSelectBudget, selectedBudgetId }: Props) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewBudget, setShowNewBudget] = useState(false);
  const [newBudgetTitle, setNewBudgetTitle] = useState('');
  const [newBudgetClient, setNewBudgetClient] = useState('');

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBudgets(data);
    }
    setLoading(false);
  };

  const createBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('budgets')
      .insert({
        title: newBudgetTitle,
        client_name: newBudgetClient,
        user_id: user.id,
      })
      .select()
      .single();

    if (!error && data) {
      setBudgets([data, ...budgets]);
      setNewBudgetTitle('');
      setNewBudgetClient('');
      setShowNewBudget(false);
      onSelectBudget(data.id);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700',
      sent: 'bg-blue-100 text-blue-700',
      approved: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      draft: 'Rascunho',
      sent: 'Enviado',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
    };
    return labels[status as keyof typeof labels] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="p-6 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-900">Meus Orçamentos</h2>
          <button
            onClick={handleSignOut}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={() => setShowNewBudget(true)}
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-lg transition font-medium"
        >
          <Plus className="w-5 h-5" />
          Novo Orçamento
        </button>
      </div>

      {showNewBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Novo Orçamento</h3>
            <form onSubmit={createBudget} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Título do Projeto
                </label>
                <input
                  type="text"
                  value={newBudgetTitle}
                  onChange={(e) => setNewBudgetTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Ex: Construção Residencial"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  value={newBudgetClient}
                  onChange={(e) => setNewBudgetClient(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Ex: João Silva"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewBudget(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {budgets.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhum orçamento ainda</p>
            <p className="text-slate-400 text-sm">Clique em "Novo Orçamento" para começar</p>
          </div>
        ) : (
          budgets.map((budget) => (
            <button
              key={budget.id}
              onClick={() => onSelectBudget(budget.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition ${
                selectedBudgetId === budget.id
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-transparent bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-slate-900 flex-1 pr-2">
                  {budget.title}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(budget.status)}`}>
                  {getStatusLabel(budget.status)}
                </span>
              </div>
              {budget.client_name && (
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                  <User className="w-4 h-4" />
                  <span>{budget.client_name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calendar className="w-3 h-3" />
                <span>{new Date(budget.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

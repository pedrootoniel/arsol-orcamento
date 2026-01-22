import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Plus,
  Search,
  FileText,
  Calendar,
  User,
  ChevronRight,
  X,
  Filter,
} from 'lucide-react';
import { STATUS_CONFIG, formatCurrency, formatDate } from '../lib/constants';
import { BudgetEditor } from './BudgetEditor';
import type { Budget, Client } from '../lib/database.types';

type BudgetWithClient = Budget & { clients?: Client | null };

export function BudgetManagement() {
  const [budgets, setBudgets] = useState<BudgetWithClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [showNewBudget, setShowNewBudget] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Busca orçamentos e clientes simultaneamente
      const [budgetsRes, clientsRes] = await Promise.all([
        supabase
          .from('budgets')
          .select('*, clients(*)')
          .order('created_at', { ascending: false }),
        supabase.from('clients').select('*').order('name'),
      ]);

      if (budgetsRes.error) throw budgetsRes.error;
      if (clientsRes.error) throw clientsRes.error;

      setBudgets(budgetsRes.data || []);
      setClients(clientsRes.data || []);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const createBudget = async (formData: any) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

      const { data, error } = await supabase
        .from('budgets')
        .insert({
          title: formData.title,
          client_id: formData.client_id || null,
          description: formData.description,
          responsible_name: formData.responsible_name,
          validity_date: formData.validity_date,
          user_id: user.id,
          budget_number: `ORC-${Date.now().toString().slice(-6)}`,
          status: 'draft',
          total_materials: 0,
          total_labor: 0,
          total_additional: 0,
        })
        .select()
        .single();

      if (error) throw error;

      setShowNewBudget(false);
      await loadData();
      if (data) setSelectedBudgetId(data.id);
      
    } catch (error: any) {
      alert("Erro ao criar orçamento: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBudgets = budgets.filter((b) => {
    const clientName = b.clients?.name || 'Sem cliente';
    const matchesSearch =
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (selectedBudgetId) {
    return (
      <BudgetEditor
        budgetId={selectedBudgetId}
        onBack={() => {
          setSelectedBudgetId(null);
          loadData();
        }}
      />
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orçamentos</h1>
          <p className="text-slate-500">Gerencie seus orçamentos de engenharia</p>
        </div>
        <button
          onClick={() => setShowNewBudget(true)}
          className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition shadow-sm font-medium"
        >
          <Plus className="w-5 h-5" />
          Novo Orçamento
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {/* Filtros */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar orçamentos..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos os status</option>
            {Object.entries(STATUS_CONFIG).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
        </div>

        {/* Lista */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Carregando...</div>
          ) : filteredBudgets.length === 0 ? (
            <div className="p-12 text-center text-slate-400">Nenhum orçamento encontrado.</div>
          ) : (
            filteredBudgets.map((budget) => {
              const total = (budget.total_materials || 0) + (budget.total_labor || 0) + (budget.total_additional || 0);
              const status = STATUS_CONFIG[budget.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;

              return (
                <div
                  key={budget.id}
                  onClick={() => setSelectedBudgetId(budget.id)}
                  className="p-4 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900 truncate">{budget.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(budget.created_at)}
                      </div>
                      <div className="font-medium text-emerald-600">
                        {formatCurrency(total)}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition" />
                </div>
              );
            })
          )}
        </div>
      </div>

      {showNewBudget && (
        <NewBudgetModal
          clients={clients}
          onClose={() => setShowNewBudget(false)}
          onSubmit={createBudget}
          submitting={submitting}
        />
      )}
    </div>
  );
}

function NewBudgetModal({ clients, onClose, onSubmit, submitting }: any) {
  const [formData, setFormData] = useState({
    title: '',
    client_id: '',
    responsible_name: '',
    description: '',
    validity_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Novo Orçamento</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título do Projeto *</label>
            <input
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
            <select
              className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              value={formData.client_id}
              onChange={e => setFormData({ ...formData, client_id: e.target.value })}
            >
              <option value="">Selecione um cliente</option>
              {clients.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Responsável Técnico</label>
              <input
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.responsible_name}
                onChange={e => setFormData({ ...formData, responsible_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Validade</label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.validity_date}
                onChange={e => setFormData({ ...formData, validity_date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
            <textarea
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium">Cancelar</button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium disabled:opacity-50"
            >
              {submitting ? 'Criando...' : 'Criar Orçamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [budgetsRes, clientsRes] = await Promise.all([
      supabase
        .from('budgets')
        .select('*, clients(*)')
        .order('created_at', { ascending: false }),
      supabase.from('clients').select('*').order('name'),
    ]);

    if (budgetsRes.data) setBudgets(budgetsRes.data);
    if (clientsRes.data) setClients(clientsRes.data);
    setLoading(false);
  };

const createBudget = async (formData) => {
  // 1. Pega o usuário logado no Supabase
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    alert("Você precisa estar logado!");
    return;
  }

  // 2. Insere os dados incluindo o user_id que o banco exige
  const { data, error } = await supabase
    .from('budgets')
    .insert({
      title: formData.title,
      client_id: formData.client_id,
      description: formData.description,
      user_id: user.id, // <--- O CAMPO FALTANTE AQUI
      budget_number: `ORC-${Date.now()}`, //
      status: 'draft'
    })
    .select();

  if (error) {
    console.error("Erro ao criar:", error.message);
  }
};

  const filteredBudgets = budgets.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.client_name.toLowerCase().includes(searchTerm.toLowerCase());
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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-slate-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Orçamentos</h1>
          <p className="text-slate-600 text-sm sm:text-base">Gerencie seus orçamentos de engenharia</p>
        </div>
        <button
          onClick={() => setShowNewBudget(true)}
          className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition font-medium w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Novo Orçamento
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar orçamentos..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm sm:text-base"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm sm:text-base"
          >
            <option value="all">Todos os Status</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
        </div>

        {filteredBudgets.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhum orçamento encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredBudgets.map((budget) => {
              const total = budget.total_materials + budget.total_labor + budget.total_additional;
              return (
                <button
                  key={budget.id}
                  onClick={() => setSelectedBudgetId(budget.id)}
                  className="w-full p-4 hover:bg-slate-50 transition text-left flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate">{budget.title}</h3>
                      <span
                        className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium self-start ${
                          STATUS_CONFIG[budget.status]?.color || STATUS_CONFIG.draft.color
                        }`}
                      >
                        {STATUS_CONFIG[budget.status]?.label || budget.status}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-4 text-xs sm:text-sm text-slate-600">
                      {budget.client_name && (
                        <span className="flex items-center gap-1 truncate">
                          <User className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{budget.client_name}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                        {formatDate(budget.created_at)}
                      </span>
                      {total > 0 && (
                        <span className="font-medium text-emerald-600">
                          {formatCurrency(total)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {showNewBudget && (
        <NewBudgetModal
          clients={clients}
          onClose={() => setShowNewBudget(false)}
          onSubmit={createBudget}
        />
      )}
    </div>
  );
}

function NewBudgetModal({
  clients,
  onClose,
  onSubmit,
}: {
  clients: Client[];
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    client_id: string | null;
    responsible_name: string;
    description: string;
    validity_date: string;
  }) => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    client_id: '',
    responsible_name: '',
    description: '',
    validity_date: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      client_id: formData.client_id || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Novo Orçamento</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Título do Projeto *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              placeholder="Ex: Sistema Solar Residencial"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Cliente</label>
            <select
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            >
              <option value="">Selecione um cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Responsável Técnico
              </label>
              <input
                type="text"
                value={formData.responsible_name}
                onChange={(e) => setFormData({ ...formData, responsible_name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Validade
              </label>
              <input
                type="date"
                value={formData.validity_date}
                onChange={(e) => setFormData({ ...formData, validity_date: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              rows={3}
              placeholder="Descreva o escopo do projeto..."
            />
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
            >
              Criar Orçamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

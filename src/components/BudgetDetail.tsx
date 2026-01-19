import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  FileText,
  Calculator,
  Package,
  Wrench,
  HardHat,
  Zap,
} from 'lucide-react';
import type { Database } from '../lib/database.types';

type Budget = Database['public']['Tables']['budgets']['Row'];
type BudgetItem = Database['public']['Tables']['budget_items']['Row'];

interface Props {
  budgetId: string;
}

const categoryIcons = {
  material: Package,
  labor: HardHat,
  equipment: Wrench,
  service: Zap,
};

const categoryLabels = {
  material: 'Material',
  labor: 'Mão de Obra',
  equipment: 'Equipamento',
  service: 'Serviço',
};

export function BudgetDetail({ budgetId }: Props) {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedClient, setEditedClient] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedStatus, setEditedStatus] = useState('');

  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    unit: 'un',
    unit_price: 0,
    category: 'material',
  });

  useEffect(() => {
    loadBudgetData();
  }, [budgetId]);

  const loadBudgetData = async () => {
    setLoading(true);

    const [budgetResult, itemsResult] = await Promise.all([
      supabase.from('budgets').select('*').eq('id', budgetId).maybeSingle(),
      supabase.from('budget_items').select('*').eq('budget_id', budgetId).order('created_at'),
    ]);

    if (budgetResult.data) {
      setBudget(budgetResult.data);
      setEditedTitle(budgetResult.data.title);
      setEditedClient(budgetResult.data.client_name);
      setEditedDescription(budgetResult.data.description);
      setEditedStatus(budgetResult.data.status);
    }

    if (itemsResult.data) {
      setItems(itemsResult.data);
    }

    setLoading(false);
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from('budget_items')
      .insert({
        budget_id: budgetId,
        ...newItem,
      })
      .select()
      .single();

    if (!error && data) {
      setItems([...items, data]);
      setNewItem({
        description: '',
        quantity: 1,
        unit: 'un',
        unit_price: 0,
        category: 'material',
      });
      setShowAddItem(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    const { error } = await supabase.from('budget_items').delete().eq('id', itemId);

    if (!error) {
      setItems(items.filter((item) => item.id !== itemId));
    }
  };

  const updateBudget = async () => {
    const { error } = await supabase
      .from('budgets')
      .update({
        title: editedTitle,
        client_name: editedClient,
        description: editedDescription,
        status: editedStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', budgetId);

    if (!error) {
      setBudget({
        ...budget!,
        title: editedTitle,
        client_name: editedClient,
        description: editedDescription,
        status: editedStatus,
      });
      setEditingBudget(false);
    }
  };

  const deleteBudget = async () => {
    if (!confirm('Tem certeza que deseja excluir este orçamento?')) return;

    const { error } = await supabase.from('budgets').delete().eq('id', budgetId);

    if (!error) {
      window.location.reload();
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">Carregando...</div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <FileText className="w-16 h-16 mb-4" />
        <p>Orçamento não encontrado</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-slate-200 p-6">
        {editingBudget ? (
          <div className="space-y-4">
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full text-2xl font-bold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
            <input
              type="text"
              value={editedClient}
              onChange={(e) => setEditedClient(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              placeholder="Nome do Cliente"
            />
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              placeholder="Descrição do projeto"
              rows={3}
            />
            <select
              value={editedStatus}
              onChange={(e) => setEditedStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            >
              <option value="draft">Rascunho</option>
              <option value="sent">Enviado</option>
              <option value="approved">Aprovado</option>
              <option value="rejected">Rejeitado</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={updateBudget}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
              >
                <Save className="w-4 h-4" />
                Salvar
              </button>
              <button
                onClick={() => setEditingBudget(false)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-2xl font-bold text-slate-900">{budget.title}</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingBudget(true)}
                  className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                  title="Editar"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={deleteBudget}
                  className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Excluir"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            {budget.client_name && (
              <p className="text-slate-600 mb-1">Cliente: {budget.client_name}</p>
            )}
            {budget.description && (
              <p className="text-slate-600 text-sm mb-2">{budget.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span>Criado em {new Date(budget.created_at).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Itens do Orçamento</h2>
          <button
            onClick={() => setShowAddItem(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Adicionar Item
          </button>
        </div>

        {showAddItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Novo Item</h3>
              <form onSubmit={addItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    placeholder="Ex: Cimento Portland CP-II"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.quantity}
                      onChange={(e) =>
                        setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Unidade
                    </label>
                    <input
                      type="text"
                      value={newItem.unit}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      placeholder="un, m², kg"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Preço Unitário
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.unit_price}
                    onChange={(e) =>
                      setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Categoria
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    <option value="material">Material</option>
                    <option value="labor">Mão de Obra</option>
                    <option value="equipment">Equipamento</option>
                    <option value="service">Serviço</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddItem(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl">
            <Calculator className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhum item adicionado</p>
            <p className="text-slate-400 text-sm">
              Clique em "Adicionar Item" para começar
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const Icon = categoryIcons[item.category as keyof typeof categoryIcons];
              const total = item.quantity * item.unit_price;

              return (
                <div
                  key={item.id}
                  className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 flex-1">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 mb-1">{item.description}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                          <span>
                            {item.quantity} {item.unit}
                          </span>
                          <span>{formatCurrency(item.unit_price)} / {item.unit}</span>
                          <span className="font-medium text-emerald-600">
                            Total: {formatCurrency(total)}
                          </span>
                        </div>
                        <span className="inline-block mt-2 px-2 py-1 bg-white rounded text-xs text-slate-600">
                          {categoryLabels[item.category as keyof typeof categoryLabels]}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-6 bg-slate-50">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900">Total do Orçamento</span>
          <span className="text-2xl font-bold text-emerald-600">
            {formatCurrency(calculateTotal())}
          </span>
        </div>
      </div>
    </div>
  );
}

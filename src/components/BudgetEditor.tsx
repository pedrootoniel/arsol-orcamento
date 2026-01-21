import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  MessageSquare,
  Zap,
  Sun,
  Droplets,
  Waves,
  Package,
  Wrench,
  HardHat,
  Settings,
  X,
} from 'lucide-react';
import { STATUS_CONFIG, CATEGORY_CONFIG, formatCurrency } from '../lib/constants';
import { BudgetComments } from './BudgetComments';
import type { Budget, BudgetItem, ItemCategory, BudgetStatus } from '../lib/database.types';

const categoryIcons: Record<string, React.ElementType> = {
  material: Package,
  labor: HardHat,
  equipment: Wrench,
  service: Settings,
  electrical: Zap,
  solar: Sun,
  hydraulic: Droplets,
  pool: Waves,
  additional: Package,
};

interface Props {
  budgetId: string;
  onBack: () => void;
  readOnly?: boolean;
}

export function BudgetEditor({ budgetId, onBack, readOnly = false }: Props) {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'items' | 'comments'>('items');
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>('material');

  useEffect(() => {
    loadBudget();
  }, [budgetId]);

  const loadBudget = async () => {
    const [budgetRes, itemsRes] = await Promise.all([
      supabase.from('budgets').select('*').eq('id', budgetId).maybeSingle(),
      supabase.from('budget_items').select('*').eq('budget_id', budgetId).order('created_at'),
    ]);

    if (budgetRes.data) setBudget(budgetRes.data);
    if (itemsRes.data) setItems(itemsRes.data);
    setLoading(false);
  };

  const updateBudgetStatus = async (status: BudgetStatus, notes: string = '') => {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'approved') {
      updateData.approval_date = new Date().toISOString();
      updateData.approval_notes = notes;
      updateData.is_locked = true;

      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        updateData.approval_ip = ipData.ip;
      } catch (error) {
        updateData.approval_ip = 'unknown';
      }
    } else if (status === 'rejected') {
      updateData.rejection_date = new Date().toISOString();
      updateData.rejection_reason = notes;
    }

    const { error } = await supabase
      .from('budgets')
      .update(updateData)
      .eq('id', budgetId);

    if (!error && budget) {
      setBudget({ ...budget, ...updateData, status });
    }
  };

  const addItem = async (item: {
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    category: ItemCategory;
    technical_specs: Record<string, string>;
  }) => {
    const { data, error } = await supabase
      .from('budget_items')
      .insert({
        budget_id: budgetId,
        ...item,
      })
      .select()
      .single();

    if (!error && data) {
      setItems([...items, data]);
      setShowAddItem(false);
      updateTotals([...items, data]);
    }
  };

  const deleteItem = async (itemId: string) => {
    const { error } = await supabase.from('budget_items').delete().eq('id', itemId);
    if (!error) {
      const newItems = items.filter((i) => i.id !== itemId);
      setItems(newItems);
      updateTotals(newItems);
    }
  };

  const updateTotals = async (itemsList: BudgetItem[]) => {
    const materials = itemsList
      .filter((i) => ['material', 'electrical', 'solar', 'hydraulic', 'pool'].includes(i.category))
      .reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

    const labor = itemsList
      .filter((i) => i.category === 'labor')
      .reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

    const additional = itemsList
      .filter((i) => ['equipment', 'service', 'additional'].includes(i.category))
      .reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

    await supabase
      .from('budgets')
      .update({
        total_materials: materials,
        total_labor: labor,
        total_additional: additional,
        updated_at: new Date().toISOString(),
      })
      .eq('id', budgetId);

    if (budget) {
      setBudget({ ...budget, total_materials: materials, total_labor: labor, total_additional: additional });
    }
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, BudgetItem[]>);

  const totalGeral = budget
    ? budget.total_materials + budget.total_labor + budget.total_additional
    : 0;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-slate-400">Carregando...</div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-slate-400">Orçamento não encontrado</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 p-3 sm:p-4">
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-slate-900 truncate">{budget.title}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-600">
                {budget.client_name && <span className="truncate">Cliente: {budget.client_name}</span>}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[budget.status]?.color}`}>
                  {STATUS_CONFIG[budget.status]?.label}
                </span>
              </div>
            </div>
          </div>

          {!readOnly && (
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {budget.status === 'draft' && (
                <button
                  onClick={() => updateBudgetStatus('sent')}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition text-xs sm:text-sm"
                >
                  <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Enviar</span>
                </button>
              )}
              {(budget.status === 'sent' || budget.status === 'revision') && (
                <>
                  <button
                    onClick={() => updateBudgetStatus('approved')}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition text-xs sm:text-sm"
                  >
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Aprovar</span>
                  </button>
                  <button
                    onClick={() => updateBudgetStatus('rejected')}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition text-xs sm:text-sm"
                  >
                    <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Reprovar</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="flex border-b border-slate-200 bg-white overflow-x-auto">
        <button
          onClick={() => setActiveTab('items')}
          className={`px-4 sm:px-6 py-3 font-medium transition whitespace-nowrap text-sm sm:text-base ${
            activeTab === 'items'
              ? 'text-emerald-600 border-b-2 border-emerald-500'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Itens do Orçamento
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`px-4 sm:px-6 py-3 font-medium transition flex items-center gap-2 whitespace-nowrap text-sm sm:text-base ${
            activeTab === 'comments'
              ? 'text-emerald-600 border-b-2 border-emerald-500'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Comentários
        </button>
      </div>

      {activeTab === 'items' ? (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!readOnly && (
            <div className="mb-4 sm:mb-6">
              <button
                onClick={() => setShowAddItem(true)}
                className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition font-medium w-full sm:w-auto text-sm sm:text-base"
              >
                <Plus className="w-5 h-5" />
                Adicionar Item
              </button>
            </div>
          )}

          {items.length === 0 ? (
            <div className="bg-white rounded-xl p-8 sm:p-12 text-center border border-slate-200">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Nenhum item adicionado</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {Object.entries(groupedItems).map(([category, categoryItems]) => {
                const Icon = categoryIcons[category] || Package;
                const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
                const categoryTotal = categoryItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

                return (
                  <div key={category} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className={`${config?.color || 'bg-slate-500'} px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between`}>
                      <div className="flex items-center gap-2 sm:gap-3 text-white">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="font-medium text-sm sm:text-base">{config?.label || category}</span>
                      </div>
                      <span className="text-white font-medium text-sm sm:text-base">{formatCurrency(categoryTotal)}</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {categoryItems.map((item) => (
                        <div key={item.id} className="p-3 sm:p-4 flex items-start sm:items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-900 text-sm sm:text-base truncate">{item.description}</h4>
                            <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-slate-600 mt-1">
                              <span>{item.quantity} {item.unit}</span>
                              <span>{formatCurrency(item.unit_price)} / {item.unit}</span>
                              <span className="font-medium text-emerald-600">
                                {formatCurrency(item.quantity * item.unit_price)}
                              </span>
                            </div>
                          </div>
                          {!readOnly && (
                            <button
                              onClick={() => deleteItem(item.id)}
                              className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          <BudgetComments budgetId={budgetId} isAdmin={!readOnly} />
        </div>
      )}

      <footer className="bg-white border-t border-slate-200 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex flex-wrap gap-3 sm:gap-8 text-xs sm:text-sm">
            <div>
              <span className="text-slate-500">Materiais:</span>
              <span className="ml-1 sm:ml-2 font-medium">{formatCurrency(budget.total_materials)}</span>
            </div>
            <div>
              <span className="text-slate-500">Mão de Obra:</span>
              <span className="ml-1 sm:ml-2 font-medium">{formatCurrency(budget.total_labor)}</span>
            </div>
            <div>
              <span className="text-slate-500">Adicionais:</span>
              <span className="ml-1 sm:ml-2 font-medium">{formatCurrency(budget.total_additional)}</span>
            </div>
          </div>
          <div className="text-right w-full sm:w-auto">
            <span className="text-slate-500 text-xs sm:text-sm">Total Geral</span>
            <p className="text-xl sm:text-2xl font-bold text-emerald-600">{formatCurrency(totalGeral)}</p>
          </div>
        </div>
      </footer>

      {showAddItem && (
        <AddItemModal
          onClose={() => setShowAddItem(false)}
          onSubmit={addItem}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      )}
    </div>
  );
}

function AddItemModal({
  onClose,
  onSubmit,
  selectedCategory,
  onCategoryChange,
}: {
  onClose: () => void;
  onSubmit: (item: {
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    category: ItemCategory;
    technical_specs: Record<string, string>;
  }) => void;
  selectedCategory: ItemCategory;
  onCategoryChange: (cat: ItemCategory) => void;
}) {
  const [formData, setFormData] = useState({
    description: '',
    quantity: 1,
    unit: 'un',
    unit_price: 0,
    technical_specs: {} as Record<string, string>,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      category: selectedCategory,
    });
  };

  const categories: ItemCategory[] = [
    'material',
    'labor',
    'equipment',
    'service',
    'electrical',
    'solar',
    'hydraulic',
    'pool',
    'additional',
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Adicionar Item</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">Categoria</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => {
                const Icon = categoryIcons[cat] || Package;
                const config = CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => onCategoryChange(cat)}
                    className={`flex items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg border-2 transition text-xs sm:text-sm ${
                      selectedCategory === cat
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 flex-shrink-0" />
                    <span className="font-medium truncate">{config?.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descrição *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                placeholder="Ex: Módulo Solar 550W"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Qtd *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 sm:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Unidade *
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="un, m²"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Preço *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 sm:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            <div className="pt-2 text-right">
              <span className="text-slate-500">Subtotal: </span>
              <span className="text-lg font-bold text-emerald-600">
                {formatCurrency(formData.quantity * formData.unit_price)}
              </span>
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
                Adicionar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

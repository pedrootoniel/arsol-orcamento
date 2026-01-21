import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  LogOut,
  FileText,
  Calendar,
  Eye,
  Sun,
  ClipboardList,
  CheckCircle,
  Clock,
  User,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import {
  STATUS_CONFIG,
  SERVICE_ORDER_STATUS_CONFIG,
  formatCurrency,
  formatDate,
} from '../lib/constants';
import { BudgetEditor } from './BudgetEditor';
import type { Budget, ServiceOrder } from '../lib/database.types';

interface NFeInvoice {
  id: string;
  nfe_number: string;
  nfe_series: number;
  nfe_key: string;
  issue_date: string;
  total_value: number;
  status: string;
  pdf_url: string;
}

type Tab = 'budgets' | 'orders' | 'nfe';

export function ClientPortal() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [invoices, setInvoices] = useState<NFeInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('budgets');
  const [clientInfo, setClientInfo] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: clientData } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (clientData) {
      setClientInfo(clientData);

      const [budgetsRes, ordersRes, invoicesRes] = await Promise.all([
        supabase
          .from('budgets')
          .select('*')
          .eq('client_id', clientData.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('service_orders')
          .select('*, budgets(*)')
          .eq('client_id', clientData.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('nfe_invoices')
          .select('*')
          .eq('client_id', clientData.id)
          .order('created_at', { ascending: false }),
      ]);

      if (budgetsRes.data) setBudgets(budgetsRes.data);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (invoicesRes.data) setInvoices(invoicesRes.data);
    }

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Sun className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-base sm:text-lg text-slate-900">ArsolUp</h1>
                <p className="text-xs text-slate-500 hidden sm:block">Portal do Cliente</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {clientInfo && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
                  <User className="w-4 h-4 text-slate-600" />
                  <span className="text-sm text-slate-700">{clientInfo.name}</span>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition text-sm"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
            Bem-vindo ao seu Portal
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Acompanhe seus orçamentos e serviços em andamento
          </p>
        </div>

        <div className="flex gap-2 mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('budgets')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition border-b-2 ${
              activeTab === 'budgets'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>Orçamentos</span>
            {budgets.length > 0 && (
              <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs rounded-full">
                {budgets.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition border-b-2 ${
              activeTab === 'orders'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span>Ordens de Serviço</span>
            {orders.length > 0 && (
              <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs rounded-full">
                {orders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('nfe')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition border-b-2 ${
              activeTab === 'nfe'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>Notas Fiscais</span>
            {invoices.length > 0 && (
              <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs rounded-full">
                {invoices.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'budgets' && (
          <div>
            {budgets.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 sm:p-12 text-center">
                <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Nenhum orçamento ainda
                </h3>
                <p className="text-slate-500">
                  Seus orçamentos aparecerão aqui quando forem criados
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {budgets.map((budget) => {
                  const total = budget.total_materials + budget.total_labor + budget.total_additional;
                  return (
                    <div
                      key={budget.id}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 hover:shadow-md transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900 text-base sm:text-lg truncate">
                              {budget.title}
                            </h3>
                            <span
                              className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                                STATUS_CONFIG[budget.status]?.color || STATUS_CONFIG.draft.color
                              }`}
                            >
                              {STATUS_CONFIG[budget.status]?.label || budget.status}
                            </span>
                          </div>
                          {budget.description && (
                            <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                              {budget.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(budget.created_at)}
                            </span>
                            {budget.validity_date && (
                              <span>Válido até: {formatDate(budget.validity_date)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:items-end gap-3">
                          <div className="text-right">
                            <p className="text-xs sm:text-sm text-slate-500 mb-1">Valor Total</p>
                            <p className="text-lg sm:text-xl font-bold text-emerald-600">
                              {formatCurrency(total)}
                            </p>
                          </div>
                          <button
                            onClick={() => setSelectedBudgetId(budget.id)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition text-sm font-medium w-full sm:w-auto"
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
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            {orders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 sm:p-12 text-center">
                <ClipboardList className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Nenhuma ordem de serviço ainda
                </h3>
                <p className="text-slate-500">
                  Suas ordens de serviço aparecerão aqui quando os trabalhos forem iniciados
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {orders.map((order) => {
                  const getStatusIcon = () => {
                    switch (order.status) {
                      case 'pending':
                        return <Clock className="w-5 h-5" />;
                      case 'in_progress':
                        return <ClipboardList className="w-5 h-5" />;
                      case 'completed':
                        return <CheckCircle className="w-5 h-5" />;
                      default:
                        return <ClipboardList className="w-5 h-5" />;
                    }
                  };

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900 text-base sm:text-lg">
                              OS {order.order_number}
                            </h3>
                            <span
                              className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                                SERVICE_ORDER_STATUS_CONFIG[order.status]?.color
                              }`}
                            >
                              {getStatusIcon()}
                              {SERVICE_ORDER_STATUS_CONFIG[order.status]?.label}
                            </span>
                          </div>
                          {order.budgets && (
                            <p className="text-sm text-slate-700 mb-3 font-medium">
                              {order.budgets.title}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500">
                            {order.start_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Início: {formatDate(order.start_date)}
                              </span>
                            )}
                            {order.deadline_date && (
                              <span>Prazo: {formatDate(order.deadline_date)}</span>
                            )}
                            {order.completion_date && (
                              <span>Concluído: {formatDate(order.completion_date)}</span>
                            )}
                          </div>
                          {order.technical_notes && (
                            <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                              <p className="text-xs font-medium text-slate-700 mb-1">
                                Observações Técnicas:
                              </p>
                              <p className="text-sm text-slate-600">{order.technical_notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'nfe' && (
          <div>
            {invoices.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 sm:p-12 text-center">
                <FileSpreadsheet className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Nenhuma nota fiscal ainda
                </h3>
                <p className="text-slate-500">
                  Suas notas fiscais aparecerão aqui quando forem emitidas
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-slate-900 text-base sm:text-lg">
                            NFe {invoice.nfe_number} - Série {invoice.nfe_series}
                          </h3>
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                            invoice.status === 'authorized'
                              ? 'bg-emerald-100 text-emerald-700'
                              : invoice.status === 'cancelled'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {invoice.status === 'authorized' ? 'Autorizada' :
                             invoice.status === 'cancelled' ? 'Cancelada' :
                             invoice.status === 'processing' ? 'Processando' : 'Rascunho'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(invoice.issue_date)}
                          </span>
                          {invoice.nfe_key && (
                            <span className="text-xs text-slate-400 font-mono truncate">
                              Chave: {invoice.nfe_key.substring(0, 20)}...
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:items-end gap-3">
                        <div className="text-right">
                          <p className="text-xs sm:text-sm text-slate-500 mb-1">Valor Total</p>
                          <p className="text-lg sm:text-xl font-bold text-emerald-600">
                            {formatCurrency(invoice.total_value)}
                          </p>
                        </div>
                        {invoice.pdf_url && (
                          <button
                            onClick={() => window.open(invoice.pdf_url, '_blank')}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition text-sm font-medium w-full sm:w-auto"
                          >
                            <Download className="w-4 h-4" />
                            Download PDF
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

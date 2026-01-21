import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  FileText,
  Users,
  DollarSign,
  Clock,
  TrendingUp,
  ClipboardCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Package,
  Briefcase,
  Building2,
} from 'lucide-react';
import { formatCurrency } from '../lib/constants';

interface Stats {
  totalBudgets: number;
  totalClients: number;
  approvedBudgets: number;
  pendingBudgets: number;
  rejectedBudgets: number;
  totalValue: number;
  totalInvoices: number;
  serviceInvoices: number;
  productInvoices: number;
  authorizedInvoices: number;
  totalCompanies: number;
  ordersInProgress: number;
}

interface ChartData {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalBudgets: 0,
    totalClients: 0,
    approvedBudgets: 0,
    pendingBudgets: 0,
    rejectedBudgets: 0,
    totalValue: 0,
    totalInvoices: 0,
    serviceInvoices: 0,
    productInvoices: 0,
    authorizedInvoices: 0,
    totalCompanies: 0,
    ordersInProgress: 0,
  });
  const [loading, setLoading] = useState(true);
  const [budgetChartData, setBudgetChartData] = useState<ChartData[]>([]);
  const [invoiceChartData, setInvoiceChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [budgetsRes, clientsRes, invoicesRes, companiesRes, ordersRes] = await Promise.all([
        supabase.from('budgets').select('*'),
        supabase.from('clients').select('*').eq('is_active', true),
        supabase.from('nfe_invoices').select('*'),
        supabase.from('companies').select('*').eq('is_active', true),
        supabase.from('service_orders').select('*'),
      ]);

      const budgets = budgetsRes.data || [];
      const clients = clientsRes.data || [];
      const invoices = invoicesRes.data || [];
      const companies = companiesRes.data || [];
      const orders = ordersRes.data || [];

      const approved = budgets.filter((b) => b.status === 'approved').length;
      const pending = budgets.filter((b) => b.status === 'sent' || b.status === 'revision').length;
      const rejected = budgets.filter((b) => b.status === 'rejected').length;
      const draft = budgets.filter((b) => b.status === 'draft').length;

      const serviceInv = invoices.filter((i) => i.nfe_type === 'service').length;
      const productInv = invoices.filter((i) => i.nfe_type === 'product').length;
      const authorized = invoices.filter((i) => i.status === 'authorized').length;

      const totalVal = budgets
        .filter((b) => b.status === 'approved')
        .reduce((sum, b) => sum + (b.total_materials || 0) + (b.total_labor || 0) + (b.total_additional || 0), 0);

      setStats({
        totalBudgets: budgets.length,
        totalClients: clients.length,
        approvedBudgets: approved,
        pendingBudgets: pending,
        rejectedBudgets: rejected,
        totalValue: totalVal,
        totalInvoices: invoices.length,
        serviceInvoices: serviceInv,
        productInvoices: productInv,
        authorizedInvoices: authorized,
        totalCompanies: companies.length,
        ordersInProgress: orders.filter((o) => o.status === 'in_progress').length,
      });

      const total = budgets.length || 1;
      setBudgetChartData([
        {
          label: 'Aprovados',
          value: approved,
          color: 'bg-emerald-500',
          percentage: (approved / total) * 100,
        },
        {
          label: 'Aguardando',
          value: pending,
          color: 'bg-amber-500',
          percentage: (pending / total) * 100,
        },
        {
          label: 'Rascunho',
          value: draft,
          color: 'bg-slate-400',
          percentage: (draft / total) * 100,
        },
        {
          label: 'Rejeitados',
          value: rejected,
          color: 'bg-red-500',
          percentage: (rejected / total) * 100,
        },
      ]);

      const invTotal = invoices.length || 1;
      setInvoiceChartData([
        {
          label: 'NFS-e Serviços',
          value: serviceInv,
          color: 'bg-emerald-500',
          percentage: (serviceInv / invTotal) * 100,
        },
        {
          label: 'NF-e Produtos',
          value: productInv,
          color: 'bg-blue-500',
          percentage: (productInv / invTotal) * 100,
        },
        {
          label: 'Autorizadas',
          value: authorized,
          color: 'bg-green-600',
          percentage: (authorized / invTotal) * 100,
        },
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-slate-400 text-lg">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-slate-600">Visão geral completa do sistema ArsølUp</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-4xl font-bold">{stats.totalClients}</span>
            </div>
            <h3 className="text-white/90 font-medium">Total de Clientes</h3>
            <p className="text-white/70 text-sm mt-1">Ativos no sistema</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-4xl font-bold">{stats.totalBudgets}</span>
            </div>
            <h3 className="text-white/90 font-medium">Orçamentos</h3>
            <p className="text-white/70 text-sm mt-1">
              {stats.approvedBudgets} aprovados
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
              </div>
            </div>
            <h3 className="text-white/90 font-medium">Valor Total</h3>
            <p className="text-white/70 text-sm mt-1">Orçamentos aprovados</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <span className="text-4xl font-bold">{stats.totalInvoices}</span>
            </div>
            <h3 className="text-white/90 font-medium">Notas Fiscais</h3>
            <p className="text-white/70 text-sm mt-1">
              {stats.authorizedInvoices} autorizadas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Status dos Orçamentos</h3>
                <p className="text-sm text-slate-500">Distribuição por status</p>
              </div>
            </div>

            <div className="space-y-4">
              {budgetChartData.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="text-slate-900 font-semibold">
                      {item.value} ({item.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{stats.approvedBudgets}</div>
                <div className="text-sm text-slate-600">Aprovados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{stats.pendingBudgets}</div>
                <div className="text-sm text-slate-600">Pendentes</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Notas Fiscais</h3>
                <p className="text-sm text-slate-500">Análise de emissões</p>
              </div>
            </div>

            <div className="space-y-4">
              {invoiceChartData.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="text-slate-900 font-semibold">
                      {item.value} ({item.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                <Briefcase className="w-8 h-8 text-emerald-600" />
                <div>
                  <div className="text-xl font-bold text-emerald-600">{stats.serviceInvoices}</div>
                  <div className="text-xs text-slate-600">NFS-e Serviços</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Package className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="text-xl font-bold text-blue-600">{stats.productInvoices}</div>
                  <div className="text-xs text-slate-600">NF-e Produtos</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.authorizedInvoices}</div>
                <div className="text-sm text-slate-600">NF-e Autorizadas</div>
              </div>
            </div>
            <div className="text-xs text-slate-500">Notas fiscais aprovadas pela SEFAZ</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.ordersInProgress}</div>
                <div className="text-sm text-slate-600">Ordens em Andamento</div>
              </div>
            </div>
            <div className="text-xs text-slate-500">Ordens de serviço em execução</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.totalCompanies}</div>
                <div className="text-sm text-slate-600">Empresas Cadastradas</div>
              </div>
            </div>
            <div className="text-xs text-slate-500">Empresas emissoras de NF-e</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 shadow-lg text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Resumo Geral</h3>
              <p className="text-white/70 text-sm">Principais indicadores do sistema</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-3xl font-bold text-white mb-1">
                {((stats.approvedBudgets / (stats.totalBudgets || 1)) * 100).toFixed(0)}%
              </div>
              <div className="text-white/70 text-sm">Taxa de Aprovação</div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-3xl font-bold text-white mb-1">
                {stats.totalClients}
              </div>
              <div className="text-white/70 text-sm">Clientes Ativos</div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-3xl font-bold text-white mb-1">
                {stats.totalInvoices}
              </div>
              <div className="text-white/70 text-sm">NF-e Emitidas</div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-xl font-bold text-white mb-1">
                {formatCurrency(stats.totalValue)}
              </div>
              <div className="text-white/70 text-sm">Valor Total</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

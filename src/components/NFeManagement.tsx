import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  X,
  Building2,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Save,
  Trash2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/constants';
import type { Client } from '../lib/database.types';

interface CompanyConfig {
  id: string;
  company_name: string;
  trade_name: string;
  cnpj: string;
  state_registration: string;
  municipal_registration: string;
  tax_regime: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string;
  nfe_series: number;
  next_nfe_number: number;
  nfe_environment: string;
}

interface NFeInvoice {
  id: string;
  nfe_number: string;
  nfe_series: number;
  nfe_key: string;
  client_id: string;
  budget_id: string;
  issue_date: string;
  nature_operation: string;
  cfop: string;
  total_products: number;
  total_services: number;
  discount_value: number;
  total_value: number;
  icms_value: number;
  ipi_value: number;
  pis_value: number;
  cofins_value: number;
  iss_value: number;
  items: any[];
  status: string;
  authorization_protocol: string;
  authorization_date: string;
  xml_content: string;
  pdf_url: string;
  cancellation_reason: string;
  cancellation_date: string;
  rejection_reason: string;
  notes: string;
  created_at: string;
  clients?: Client;
}

type TabType = 'invoices' | 'company';

const statusConfig = {
  draft: { label: 'Rascunho', color: 'bg-slate-100 text-slate-700', icon: FileText },
  processing: { label: 'Processando', color: 'bg-blue-100 text-blue-700', icon: Clock },
  authorized: { label: 'Autorizada', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-700', icon: XCircle },
  rejected: { label: 'Rejeitada', color: 'bg-amber-100 text-amber-700', icon: XCircle },
};

export function NFeManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('invoices');
  const [invoices, setInvoices] = useState<NFeInvoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [invoicesRes, clientsRes, companyRes] = await Promise.all([
      supabase
        .from('nfe_invoices')
        .select('*, clients(*)')
        .order('created_at', { ascending: false }),
      supabase.from('clients').select('*').eq('is_active', true).order('name'),
      supabase.from('company_config').select('*').maybeSingle(),
    ]);

    if (invoicesRes.data) setInvoices(invoicesRes.data);
    if (clientsRes.data) setClients(clientsRes.data);
    if (companyRes.data) setCompanyConfig(companyRes.data);
    setLoading(false);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.nfe_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.clients?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-slate-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Notas Fiscais (NFe)</h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Sistema completo de emissão de notas fiscais eletrônicas
          </p>
        </div>
        {activeTab === 'invoices' && (
          <button
            onClick={() => setShowNewInvoice(true)}
            className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition font-medium"
          >
            <Plus className="w-5 h-5" />
            Nova NFe
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="border-b border-slate-200">
          <div className="flex gap-4 px-4">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeTab === 'invoices'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Notas Fiscais
              </div>
            </button>
            <button
              onClick={() => setActiveTab('company')}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeTab === 'company'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Dados da Empresa
              </div>
            </button>
          </div>
        </div>

        {activeTab === 'invoices' && (
          <>
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por número ou cliente..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              >
                <option value="all">Todos os Status</option>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            {filteredInvoices.length === 0 ? (
              <div className="p-12 text-center">
                <FileSpreadsheet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhuma nota fiscal encontrada</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredInvoices.map((invoice) => {
                  const StatusIcon = statusConfig[invoice.status as keyof typeof statusConfig]?.icon || FileText;
                  return (
                    <div key={invoice.id} className="p-4 hover:bg-slate-50 transition">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-slate-900">
                              NFe {invoice.nfe_number} - Série {invoice.nfe_series}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                                statusConfig[invoice.status as keyof typeof statusConfig]?.color ||
                                'bg-slate-100 text-slate-700'
                              }`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig[invoice.status as keyof typeof statusConfig]?.label || invoice.status}
                            </span>
                          </div>
                          <div className="text-sm text-slate-600 space-y-1">
                            <p>
                              <strong>Cliente:</strong> {invoice.clients?.name}
                            </p>
                            <p>
                              <strong>Data:</strong> {formatDate(invoice.issue_date)}
                            </p>
                            <p>
                              <strong>Valor Total:</strong> {formatCurrency(invoice.total_value)}
                            </p>
                            {invoice.nfe_key && (
                              <p className="text-xs text-slate-500">
                                <strong>Chave:</strong> {invoice.nfe_key}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {invoice.pdf_url && (
                            <button
                              onClick={() => window.open(invoice.pdf_url, '_blank')}
                              className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Ver Detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'company' && (
          <CompanyConfigForm
            companyConfig={companyConfig}
            onSave={(data) => {
              setCompanyConfig(data);
              loadData();
            }}
          />
        )}
      </div>

      {showNewInvoice && (
        <NewInvoiceModal
          clients={clients}
          companyConfig={companyConfig}
          onClose={() => setShowNewInvoice(false)}
          onSuccess={() => {
            setShowNewInvoice(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function CompanyConfigForm({
  companyConfig,
  onSave,
}: {
  companyConfig: CompanyConfig | null;
  onSave: (data: CompanyConfig) => void;
}) {
  const [formData, setFormData] = useState<Partial<CompanyConfig>>({
    company_name: '',
    trade_name: '',
    cnpj: '',
    state_registration: '',
    municipal_registration: '',
    tax_regime: 'simples_nacional',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
    website: '',
    nfe_series: 1,
    next_nfe_number: 1,
    nfe_environment: 'homologacao',
    ...companyConfig,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (companyConfig?.id) {
        const { data, error } = await supabase
          .from('company_config')
          .update(formData)
          .eq('id', companyConfig.id)
          .select()
          .single();

        if (!error && data) onSave(data);
      } else {
        const { data, error } = await supabase
          .from('company_config')
          .insert(formData)
          .select()
          .single();

        if (!error && data) onSave(data);
      }
    } catch (error) {
      console.error('Error saving company config:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Dados da Empresa</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Razão Social *</label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nome Fantasia *</label>
            <input
              type="text"
              value={formData.trade_name}
              onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">CNPJ *</label>
            <input
              type="text"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Inscrição Estadual</label>
            <input
              type="text"
              value={formData.state_registration}
              onChange={(e) => setFormData({ ...formData, state_registration: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Inscrição Municipal</label>
            <input
              type="text"
              value={formData.municipal_registration}
              onChange={(e) => setFormData({ ...formData, municipal_registration: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Regime Tributário *</label>
            <select
              value={formData.tax_regime}
              onChange={(e) => setFormData({ ...formData, tax_regime: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              required
            >
              <option value="simples_nacional">Simples Nacional</option>
              <option value="lucro_presumido">Lucro Presumido</option>
              <option value="lucro_real">Lucro Real</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Endereço</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Logradouro *</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Número *</label>
            <input
              type="text"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Complemento</label>
            <input
              type="text"
              value={formData.complement}
              onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Bairro *</label>
            <input
              type="text"
              value={formData.neighborhood}
              onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Cidade *</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Estado *</label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              required
              maxLength={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">CEP *</label>
            <input
              type="text"
              value={formData.zip_code}
              onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Telefone *</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              required
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Configurações NFe</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Série NFe</label>
            <input
              type="number"
              value={formData.nfe_series}
              onChange={(e) => setFormData({ ...formData, nfe_series: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Próximo Número</label>
            <input
              type="number"
              value={formData.next_nfe_number}
              onChange={(e) => setFormData({ ...formData, next_nfe_number: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Ambiente</label>
            <select
              value={formData.nfe_environment}
              onChange={(e) => setFormData({ ...formData, nfe_environment: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="homologacao">Homologação</option>
              <option value="producao">Produção</option>
            </select>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition font-medium disabled:opacity-50"
      >
        {saving ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Salvar Configurações
          </>
        )}
      </button>
    </form>
  );
}

function NewInvoiceModal({
  clients,
  companyConfig,
  onClose,
  onSuccess,
}: {
  clients: Client[];
  companyConfig: CompanyConfig | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    client_id: '',
    nature_operation: 'Venda de mercadoria',
    cfop: '5102',
    total_products: 0,
    total_services: 0,
    discount_value: 0,
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyConfig) {
      alert('Configure os dados da empresa primeiro!');
      return;
    }

    setSaving(true);

    try {
      const total_value =
        formData.total_products + formData.total_services - formData.discount_value;

      const { error } = await supabase.from('nfe_invoices').insert({
        ...formData,
        total_value,
        nfe_number: `${companyConfig.next_nfe_number}`,
        nfe_series: companyConfig.nfe_series,
        status: 'draft',
      });

      if (!error) {
        await supabase
          .from('company_config')
          .update({ next_nfe_number: companyConfig.next_nfe_number + 1 })
          .eq('id', companyConfig.id);

        onSuccess();
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-slate-900">Nova Nota Fiscal</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Cliente *</label>
            <select
              value={formData.client_id}
              onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              required
            >
              <option value="">Selecione um cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} - {client.document}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Natureza da Operação</label>
              <input
                type="text"
                value={formData.nature_operation}
                onChange={(e) => setFormData({ ...formData, nature_operation: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">CFOP</label>
              <input
                type="text"
                value={formData.cfop}
                onChange={(e) => setFormData({ ...formData, cfop: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Valor Produtos</label>
              <input
                type="number"
                step="0.01"
                value={formData.total_products}
                onChange={(e) => setFormData({ ...formData, total_products: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Valor Serviços</label>
              <input
                type="number"
                step="0.01"
                value={formData.total_services}
                onChange={(e) => setFormData({ ...formData, total_services: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Desconto</label>
            <input
              type="number"
              step="0.01"
              value={formData.discount_value}
              onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Observações</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              rows={3}
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-sm text-slate-600 mb-2">Resumo:</div>
            <div className="text-2xl font-bold text-slate-900">
              Total: {formatCurrency(formData.total_products + formData.total_services - formData.discount_value)}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition disabled:opacity-50"
            >
              {saving ? 'Criando...' : 'Criar NFe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

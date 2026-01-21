import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  FileSpreadsheet,
  Plus,
  Download,
  Eye,
  X,
  Save,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ShoppingCart,
  Briefcase,
  Package,
  Building2,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/constants';
import { COMPANIES } from '../lib/companies';
import type { Client } from '../lib/database.types';

interface Company {
  id: string;
  cnpj: string;
  trade_name: string;
  company_name: string;
  municipal_registration?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
}

interface NFeInvoice {
  id: string;
  client_id: string;
  company_id?: string;
  nfe_number: string;
  nfe_series: number;
  nfe_key?: string;
  nfe_type: 'service' | 'product';
  issue_date: string;
  company_name: string;
  company_document: string;
  company_im?: string;
  customer_name: string;
  customer_document: string;
  customer_address: string;
  customer_city: string;
  customer_state: string;
  service_description: string;
  service_total: number;
  liquid_value: number;
  status: 'draft' | 'processing' | 'authorized' | 'cancelled' | 'rejected';
  pdf_url?: string;
  created_at: string;
}

interface Product {
  id?: string;
  sequence_number: number;
  product_code: string;
  ean: string;
  description: string;
  ncm: string;
  cfop: string;
  unit: string;
  quantity: number;
  unit_value: number;
  total_value: number;
}

export function NFeManagement() {
  const [activeTab, setActiveTab] = useState<'service' | 'product'>('service');
  const [invoices, setInvoices] = useState<NFeInvoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'service' | 'product'>('service');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);

  const [formData, setFormData] = useState({
    client_id: '',
    company_id: '',
    nfe_type: 'service' as 'service' | 'product',
    customer_address: '',
    customer_city: '',
    customer_state: '',
    service_description: '',
    cnae_code: '3329-5/99',
    nbs_code: '1.2606.00.00',
    lc_116_code: '14.07',
    operation_nature: 'Venda Dentro do Estado',
    cfop: '5102',
    payment_method: 'PIX',
    freight_type: 'Sem Ocorrência de Transporte',
    service_total: 0,
    discount: 0,
    freight: 0,
    insurance: 0,
    other_expenses: 0,
    iss_rate: 5.0,
    additional_info: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [invoicesRes, clientsRes, companiesRes] = await Promise.all([
      supabase.from('nfe_invoices').select('*').order('created_at', { ascending: false }),
      supabase.from('clients').select('*').eq('is_active', true).order('name'),
      supabase.from('companies').select('*').eq('is_active', true).order('trade_name'),
    ]);

    if (invoicesRes.data) setInvoices(invoicesRes.data);
    if (clientsRes.data) setClients(clientsRes.data);
    if (companiesRes.data) setCompanies(companiesRes.data);
    setLoading(false);
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setFormData((prev) => ({
        ...prev,
        client_id: clientId,
        customer_address: client.address || '',
        customer_city: '',
        customer_state: '',
      }));
    }
  };

  const handleCompanySelect = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    if (company) {
      setFormData((prev) => ({
        ...prev,
        company_id: companyId,
      }));
    }
  };

  const calculateTotal = () => {
    if (invoiceType === 'product') {
      const productsTotal = products.reduce((sum, p) => sum + p.total_value, 0);
      return productsTotal + formData.freight + formData.insurance + formData.other_expenses - formData.discount;
    }
    return formData.service_total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedClient = clients.find((c) => c.id === formData.client_id);
    const selectedCompany = companies.find((c) => c.id === formData.company_id);

    if (!selectedClient) {
      alert('Selecione um cliente');
      return;
    }

    if (!selectedCompany) {
      alert('Selecione uma empresa emissora');
      return;
    }

    if (invoiceType === 'product' && products.length === 0) {
      alert('Adicione pelo menos um produto');
      return;
    }

    const total = calculateTotal();
    const issValue = (total * formData.iss_rate) / 100;

    const invoiceData = {
      ...formData,
      nfe_type: invoiceType,
      customer_name: selectedClient.name,
      customer_document: selectedClient.document,
      customer_address: formData.customer_address || selectedClient.address,
      customer_email: selectedClient.email,
      company_name: selectedCompany.trade_name,
      company_document: selectedCompany.cnpj,
      company_im: selectedCompany.municipal_registration,
      company_address: selectedCompany.address,
      company_city: selectedCompany.city,
      company_state: selectedCompany.state,
      company_zipcode: selectedCompany.zip_code,
      company_phone: selectedCompany.phone,
      company_email: selectedCompany.email,
      nfe_number: `${Date.now()}`,
      nfe_series: 1,
      issue_date: new Date().toISOString(),
      service_total: total,
      iss_value: issValue,
      liquid_value: total - issValue,
      status: 'draft' as const,
    };

    try {
      const { data: newInvoice, error } = await supabase
        .from('nfe_invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (error) throw error;

      if (newInvoice && invoiceType === 'product' && products.length > 0) {
        const productsData = products.map((p) => ({
          ...p,
          nfe_id: newInvoice.id,
        }));

        const { error: productsError } = await supabase
          .from('nfe_products')
          .insert(productsData);

        if (productsError) throw productsError;
      }

      closeModal();
      loadData();
      alert(
        invoiceType === 'service'
          ? 'NFS-e de Serviço criada com sucesso!'
          : 'NF-e de Produto criada com sucesso!'
      );
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      alert('Erro ao salvar nota fiscal: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta nota fiscal?')) return;

    const { error } = await supabase.from('nfe_invoices').delete().eq('id', id);
    if (!error) {
      setInvoices(invoices.filter((inv) => inv.id !== id));
    }
  };

  const authorizeInvoice = async (id: string) => {
    const { error } = await supabase
      .from('nfe_invoices')
      .update({ status: 'authorized', nfe_key: `9F56CCD${Date.now()}` })
      .eq('id', id);

    if (!error) {
      loadData();
      alert('Nota fiscal autorizada com sucesso!');
    }
  };

  const addProduct = () => {
    const newProduct: Product = {
      sequence_number: products.length + 1,
      product_code: '',
      ean: '',
      description: '',
      ncm: '',
      cfop: formData.cfop,
      unit: 'UN',
      quantity: 1,
      unit_value: 0,
      total_value: 0,
    };
    setProducts([...products, newProduct]);
  };

  const updateProduct = (index: number, field: keyof Product, value: any) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'unit_value') {
      updated[index].total_value = updated[index].quantity * updated[index].unit_value;
    }

    setProducts(updated);
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const openModal = (type: 'service' | 'product') => {
    setInvoiceType(type);
    setShowModal(true);
    setCurrentStep(1);
    setProducts([]);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentStep(1);
    setProducts([]);
    setFormData({
      client_id: '',
      company_id: '',
      nfe_type: 'service',
      customer_address: '',
      customer_city: '',
      customer_state: '',
      service_description: '',
      cnae_code: '3329-5/99',
      nbs_code: '1.2606.00.00',
      lc_116_code: '14.07',
      operation_nature: 'Venda Dentro do Estado',
      cfop: '5102',
      payment_method: 'PIX',
      freight_type: 'Sem Ocorrência de Transporte',
      service_total: 0,
      discount: 0,
      freight: 0,
      insurance: 0,
      other_expenses: 0,
      iss_rate: 5.0,
      additional_info: '',
    });
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.nfe_type === activeTab &&
      (invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.nfe_number.includes(searchTerm) ||
        invoice.customer_document.includes(searchTerm))
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'authorized':
        return <CheckCircle className="w-5 h-5" />;
      case 'cancelled':
      case 'rejected':
        return <XCircle className="w-5 h-5" />;
      case 'processing':
        return <Clock className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'authorized':
        return 'bg-emerald-100 text-emerald-700';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Rascunho',
      processing: 'Processando',
      authorized: 'Autorizada',
      cancelled: 'Cancelada',
      rejected: 'Rejeitada',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Notas Fiscais Eletrônicas</h2>
          <p className="text-slate-600">Gerencie NF-e de Produtos e NFS-e de Serviços</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 bg-white rounded-t-xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('service')}
          className={`flex items-center gap-2 px-6 py-4 font-medium transition whitespace-nowrap ${
            activeTab === 'service'
              ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Briefcase className="w-5 h-5" />
          NFS-e Prestação de Serviço
        </button>
        <button
          onClick={() => setActiveTab('product')}
          className={`flex items-center gap-2 px-6 py-4 font-medium transition whitespace-nowrap ${
            activeTab === 'product'
              ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          NF-e Venda de Produtos
        </button>
      </div>

      <div className="bg-white rounded-b-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, número ou documento..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>
          <button
            onClick={() => openModal(activeTab)}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition font-medium whitespace-nowrap ${
              activeTab === 'service'
                ? 'bg-emerald-500 hover:bg-emerald-600'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            <Plus className="w-5 h-5" />
            Nova {activeTab === 'service' ? 'NFS-e' : 'NF-e'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Número
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Data Emissão
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    {activeTab === 'service' ? (
                      <>
                        <Briefcase className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p>Nenhuma NFS-e de serviço encontrada</p>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p>Nenhuma NF-e de produto encontrada</p>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-slate-400" />
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {invoice.nfe_type === 'service' ? 'NFS-e' : 'NF-e'} {invoice.nfe_number}
                          </div>
                          <div className="text-xs text-slate-500">Série {invoice.nfe_series}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">
                        {invoice.customer_name}
                      </div>
                      <div className="text-xs text-slate-500">{invoice.customer_document}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {formatDate(invoice.issue_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-slate-900">
                        {formatCurrency(invoice.liquid_value)}
                      </div>
                      <div className="text-xs text-slate-500">
                        Bruto: {formatCurrency(invoice.service_total)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          invoice.status
                        )}`}
                      >
                        {getStatusIcon(invoice.status)}
                        {getStatusLabel(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {invoice.status === 'draft' && (
                          <button
                            onClick={() => authorizeInvoice(invoice.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Autorizar"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        {invoice.pdf_url && (
                          <button
                            onClick={() => window.open(invoice.pdf_url, '_blank')}
                            className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-lg transition"
                            title="Download PDF"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        )}
                        {invoice.status === 'draft' && (
                          <button
                            onClick={() => handleDelete(invoice.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Excluir"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                {invoiceType === 'service' ? (
                  <Briefcase className="w-6 h-6 text-emerald-600" />
                ) : (
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                )}
                <h3 className="text-xl font-bold text-slate-900">
                  {invoiceType === 'service'
                    ? 'Nova NFS-e - Prestação de Serviço'
                    : 'Nova NF-e - Venda de Produto'}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="flex gap-2 mb-6 border-b border-slate-200">
                {['Empresa e Cliente', invoiceType === 'service' ? 'Serviço' : 'Produtos', 'Finalizar'].map(
                  (step, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentStep(idx + 1)}
                      className={`px-4 py-2 font-medium border-b-2 transition ${
                        currentStep === idx + 1
                          ? invoiceType === 'service'
                            ? 'border-emerald-500 text-emerald-600'
                            : 'border-blue-500 text-blue-600'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {idx + 1}. {step}
                    </button>
                  )
                )}
              </div>

              <form onSubmit={handleSubmit}>
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Empresa Emissora
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Selecione a Empresa *
                          </label>
                          <select
                            value={formData.company_id}
                            onChange={(e) => handleCompanySelect(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            required
                          >
                            <option value="">Selecione a empresa emissora...</option>
                            {companies.map((company) => (
                              <option key={company.id} value={company.id}>
                                {company.trade_name} - {company.cnpj}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-4">Cliente (Tomador)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Selecione o Cliente *
                          </label>
                          <select
                            value={formData.client_id}
                            onChange={(e) => handleClientSelect(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            required
                          >
                            <option value="">Selecione um cliente...</option>
                            {clients.map((client) => (
                              <option key={client.id} value={client.id}>
                                {client.name} - {client.document}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Endereço
                          </label>
                          <input
                            type="text"
                            value={formData.customer_address}
                            onChange={(e) =>
                              setFormData({ ...formData, customer_address: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Cidade
                          </label>
                          <input
                            type="text"
                            value={formData.customer_city}
                            onChange={(e) =>
                              setFormData({ ...formData, customer_city: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && invoiceType === 'service' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Discriminação do Serviço *
                      </label>
                      <textarea
                        value={formData.service_description}
                        onChange={(e) =>
                          setFormData({ ...formData, service_description: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        rows={4}
                        placeholder="Descreva o serviço prestado..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          CNAE
                        </label>
                        <input
                          type="text"
                          value={formData.cnae_code}
                          onChange={(e) =>
                            setFormData({ ...formData, cnae_code: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          NBS
                        </label>
                        <input
                          type="text"
                          value={formData.nbs_code}
                          onChange={(e) =>
                            setFormData({ ...formData, nbs_code: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          LC 116/03
                        </label>
                        <input
                          type="text"
                          value={formData.lc_116_code}
                          onChange={(e) =>
                            setFormData({ ...formData, lc_116_code: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Valor Total do Serviço *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.service_total}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            service_total: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        required
                      />
                    </div>
                  </div>
                )}

                {currentStep === 2 && invoiceType === 'product' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-900">Produtos</h4>
                      <button
                        type="button"
                        onClick={addProduct}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar Produto
                      </button>
                    </div>

                    {products.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
                        <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-500 text-sm">
                          Nenhum produto adicionado. Clique em "Adicionar Produto" para começar.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[400px] overflow-y-auto">
                        {products.map((product, index) => (
                          <div
                            key={index}
                            className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-slate-900">
                                Produto #{product.sequence_number}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeProduct(index)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="col-span-2">
                                <input
                                  type="text"
                                  placeholder="Descrição do Produto *"
                                  value={product.description}
                                  onChange={(e) =>
                                    updateProduct(index, 'description', e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                  required
                                />
                              </div>
                              <input
                                type="text"
                                placeholder="Código"
                                value={product.product_code}
                                onChange={(e) =>
                                  updateProduct(index, 'product_code', e.target.value)
                                }
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                              />
                              <input
                                type="text"
                                placeholder="NCM"
                                value={product.ncm}
                                onChange={(e) => updateProduct(index, 'ncm', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                              />
                              <input
                                type="number"
                                placeholder="Quantidade *"
                                step="0.01"
                                value={product.quantity}
                                onChange={(e) =>
                                  updateProduct(index, 'quantity', parseFloat(e.target.value) || 0)
                                }
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                required
                              />
                              <input
                                type="number"
                                placeholder="Valor Unitário *"
                                step="0.01"
                                value={product.unit_value}
                                onChange={(e) =>
                                  updateProduct(
                                    index,
                                    'unit_value',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                required
                              />
                              <div className="col-span-2 text-right">
                                <span className="text-sm font-medium text-slate-700">
                                  Total: {formatCurrency(product.total_value)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Desconto
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.discount}
                          onChange={(e) =>
                            setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Frete
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.freight}
                          onChange={(e) =>
                            setFormData({ ...formData, freight: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Seguro
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.insurance}
                          onChange={(e) =>
                            setFormData({ ...formData, insurance: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Outras Despesas
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.other_expenses}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              other_expenses: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Natureza da Operação
                        </label>
                        <select
                          value={formData.operation_nature}
                          onChange={(e) =>
                            setFormData({ ...formData, operation_nature: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                          <option>Venda Dentro do Estado</option>
                          <option>Venda Fora do Estado</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          CFOP
                        </label>
                        <input
                          type="text"
                          value={formData.cfop}
                          onChange={(e) => setFormData({ ...formData, cfop: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Forma de Pagamento
                        </label>
                        <select
                          value={formData.payment_method}
                          onChange={(e) =>
                            setFormData({ ...formData, payment_method: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                          <option>PIX</option>
                          <option>Dinheiro</option>
                          <option>Cartão de Crédito</option>
                          <option>Cartão de Débito</option>
                          <option>Boleto</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Tipo de Frete
                        </label>
                        <select
                          value={formData.freight_type}
                          onChange={(e) =>
                            setFormData({ ...formData, freight_type: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                          <option>Sem Ocorrência de Transporte</option>
                          <option>Por conta do Emitente</option>
                          <option>Por conta do Destinatário</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Observações
                      </label>
                      <textarea
                        value={formData.additional_info}
                        onChange={(e) =>
                          setFormData({ ...formData, additional_info: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        rows={3}
                      />
                    </div>

                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      <h4 className="font-semibold text-emerald-900 mb-3">Resumo da Nota Fiscal</h4>
                      <div className="space-y-2 text-sm">
                        {invoiceType === 'product' && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Subtotal Produtos:</span>
                              <span className="font-medium">
                                {formatCurrency(products.reduce((sum, p) => sum + p.total_value, 0))}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Desconto:</span>
                              <span className="text-red-600">
                                -{formatCurrency(formData.discount)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Frete:</span>
                              <span className="font-medium">{formatCurrency(formData.freight)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Seguro:</span>
                              <span className="font-medium">{formatCurrency(formData.insurance)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">Outras Despesas:</span>
                              <span className="font-medium">
                                {formatCurrency(formData.other_expenses)}
                              </span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between pt-2 border-t border-emerald-300">
                          <span className="font-semibold text-emerald-900">Valor Total:</span>
                          <span className="font-bold text-emerald-600 text-lg">
                            {formatCurrency(calculateTotal())}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
                    >
                      Voltar
                    </button>
                  )}
                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(currentStep + 1)}
                      className={`flex-1 px-6 py-2 text-white rounded-lg transition font-medium ${
                        invoiceType === 'service'
                          ? 'bg-emerald-500 hover:bg-emerald-600'
                          : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                    >
                      Próximo
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className={`flex-1 flex items-center justify-center gap-2 px-6 py-2 text-white rounded-lg transition font-medium ${
                        invoiceType === 'service'
                          ? 'bg-emerald-500 hover:bg-emerald-600'
                          : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                    >
                      <Save className="w-5 h-5" />
                      Salvar {invoiceType === 'service' ? 'NFS-e' : 'NF-e'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

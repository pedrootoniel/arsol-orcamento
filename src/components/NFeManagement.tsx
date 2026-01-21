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
} from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/constants';
import type { Client } from '../lib/database.types';

interface NFeInvoice {
  id: string;
  client_id: string;
  budget_id?: string;
  nfe_number: string;
  nfe_series: number;
  nfe_key?: string;
  nfe_type: 'service' | 'product';
  issue_date: string;
  delivery_date?: string;
  company_name: string;
  company_document: string;
  company_im?: string;
  company_address: string;
  company_neighborhood?: string;
  company_city: string;
  company_state: string;
  company_zipcode: string;
  company_phone?: string;
  company_email?: string;
  customer_name: string;
  customer_document: string;
  customer_ie?: string;
  customer_address: string;
  customer_neighborhood?: string;
  customer_city: string;
  customer_state: string;
  customer_zipcode: string;
  customer_email?: string;
  service_description: string;
  cnae_code?: string;
  nbs_code?: string;
  lc_116_code?: string;
  service_state?: string;
  service_city?: string;
  incident_state?: string;
  incident_city?: string;
  inss_rate: number;
  inss_value: number;
  pis_rate: number;
  pis_value: number;
  cofins_rate: number;
  cofins_value: number;
  irrf_rate: number;
  irrf_value: number;
  csll_rate: number;
  csll_value: number;
  iss_rate: number;
  iss_value: number;
  issqn_rate: number;
  issqn_value: number;
  issqn_retained: number;
  base_deductions: number;
  conditional_discount: number;
  unconditional_discount: number;
  retention: boolean;
  service_total: number;
  liquid_value: number;
  status: 'draft' | 'processing' | 'authorized' | 'cancelled' | 'rejected';
  additional_info?: string;
  pdf_url?: string;
  xml_url?: string;
  created_at: string;
}

export function NFeManagement() {
  const [invoices, setInvoices] = useState<NFeInvoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<NFeInvoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    client_id: '',
    nfe_type: 'service' as 'service' | 'product',
    company_name: 'OTONIEL ANTONIO DOS SANTOS',
    company_document: '',
    company_im: '',
    company_address: '',
    company_neighborhood: '',
    company_city: 'Goiânia',
    company_state: 'GO',
    company_zipcode: '',
    company_phone: '',
    company_email: '',
    customer_name: '',
    customer_document: '',
    customer_ie: '',
    customer_address: '',
    customer_neighborhood: '',
    customer_city: '',
    customer_state: '',
    customer_zipcode: '',
    customer_email: '',
    service_description: '',
    cnae_code: '3329-5/99',
    nbs_code: '1.2606.00.00',
    lc_116_code: '14.07',
    service_state: 'Goiás',
    service_city: 'Goiânia',
    incident_state: 'Goiás',
    incident_city: 'Goiânia',
    inss_rate: 0,
    pis_rate: 0,
    cofins_rate: 0,
    irrf_rate: 0,
    csll_rate: 0,
    iss_rate: 5.00,
    issqn_rate: 0,
    retention: false,
    service_total: 0,
    additional_info: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [invoicesRes, clientsRes] = await Promise.all([
      supabase.from('nfe_invoices').select('*').order('created_at', { ascending: false }),
      supabase.from('clients').select('*').eq('is_active', true).order('name'),
    ]);

    if (invoicesRes.data) setInvoices(invoicesRes.data);
    if (clientsRes.data) setClients(clientsRes.data);
    setLoading(false);
  };

  const calculateTaxes = () => {
    const total = formData.service_total;
    const inss_value = (total * formData.inss_rate) / 100;
    const pis_value = (total * formData.pis_rate) / 100;
    const cofins_value = (total * formData.cofins_rate) / 100;
    const irrf_value = (total * formData.irrf_rate) / 100;
    const csll_value = (total * formData.csll_rate) / 100;
    const iss_value = (total * formData.iss_rate) / 100;
    const issqn_value = (total * formData.issqn_rate) / 100;

    const total_taxes = inss_value + pis_value + cofins_value + irrf_value + csll_value + iss_value + issqn_value;
    const liquid_value = total - total_taxes;

    return {
      inss_value,
      pis_value,
      cofins_value,
      irrf_value,
      csll_value,
      iss_value,
      issqn_value,
      liquid_value,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const taxes = calculateTaxes();
    const selectedClient = clients.find((c) => c.id === formData.client_id);

    if (!selectedClient) {
      alert('Selecione um cliente');
      return;
    }

    const invoiceData = {
      ...formData,
      ...taxes,
      customer_name: selectedClient.name,
      customer_document: selectedClient.document,
      customer_address: selectedClient.address,
      customer_email: selectedClient.email,
      nfe_number: editingInvoice?.nfe_number || `${Date.now()}`,
      nfe_series: 1,
      issue_date: new Date().toISOString(),
      status: 'draft' as const,
    };

    try {
      if (editingInvoice) {
        const { error } = await supabase
          .from('nfe_invoices')
          .update(invoiceData)
          .eq('id', editingInvoice.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('nfe_invoices').insert(invoiceData);
        if (error) throw error;
      }

      closeModal();
      loadData();
      alert('Nota fiscal salva com sucesso!');
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      alert('Erro ao salvar nota fiscal: ' + error.message);
    }
  };

  const handleClientSelect = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setFormData((prev) => ({
        ...prev,
        client_id: clientId,
        customer_name: client.name,
        customer_document: client.document,
        customer_address: client.address,
        customer_email: client.email,
      }));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta nota fiscal?')) return;

    const { error } = await supabase.from('nfe_invoices').delete().eq('id', id);
    if (!error) {
      setInvoices(invoices.filter((inv) => inv.id !== id));
    }
  };

  const generatePDF = async (invoice: NFeInvoice) => {
    alert('Funcionalidade de geração de PDF será implementada em breve');
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

  const openModal = (invoice?: NFeInvoice) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setFormData({
        client_id: invoice.client_id,
        nfe_type: invoice.nfe_type,
        company_name: invoice.company_name,
        company_document: invoice.company_document,
        company_im: invoice.company_im || '',
        company_address: invoice.company_address,
        company_neighborhood: invoice.company_neighborhood || '',
        company_city: invoice.company_city,
        company_state: invoice.company_state,
        company_zipcode: invoice.company_zipcode,
        company_phone: invoice.company_phone || '',
        company_email: invoice.company_email || '',
        customer_name: invoice.customer_name,
        customer_document: invoice.customer_document,
        customer_ie: invoice.customer_ie || '',
        customer_address: invoice.customer_address,
        customer_neighborhood: invoice.customer_neighborhood || '',
        customer_city: invoice.customer_city,
        customer_state: invoice.customer_state,
        customer_zipcode: invoice.customer_zipcode,
        customer_email: invoice.customer_email || '',
        service_description: invoice.service_description,
        cnae_code: invoice.cnae_code || '',
        nbs_code: invoice.nbs_code || '',
        lc_116_code: invoice.lc_116_code || '',
        service_state: invoice.service_state || '',
        service_city: invoice.service_city || '',
        incident_state: invoice.incident_state || '',
        incident_city: invoice.incident_city || '',
        inss_rate: invoice.inss_rate,
        pis_rate: invoice.pis_rate,
        cofins_rate: invoice.cofins_rate,
        irrf_rate: invoice.irrf_rate,
        csll_rate: invoice.csll_rate,
        iss_rate: invoice.iss_rate,
        issqn_rate: invoice.issqn_rate,
        retention: invoice.retention,
        service_total: invoice.service_total,
        additional_info: invoice.additional_info || '',
      });
    }
    setShowModal(true);
    setCurrentStep(1);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingInvoice(null);
    setCurrentStep(1);
    setFormData({
      client_id: '',
      nfe_type: 'service',
      company_name: 'OTONIEL ANTONIO DOS SANTOS',
      company_document: '',
      company_im: '',
      company_address: '',
      company_neighborhood: '',
      company_city: 'Goiânia',
      company_state: 'GO',
      company_zipcode: '',
      company_phone: '',
      company_email: '',
      customer_name: '',
      customer_document: '',
      customer_ie: '',
      customer_address: '',
      customer_neighborhood: '',
      customer_city: '',
      customer_state: '',
      customer_zipcode: '',
      customer_email: '',
      service_description: '',
      cnae_code: '3329-5/99',
      nbs_code: '1.2606.00.00',
      lc_116_code: '14.07',
      service_state: 'Goiás',
      service_city: 'Goiânia',
      incident_state: 'Goiás',
      incident_city: 'Goiânia',
      inss_rate: 0,
      pis_rate: 0,
      cofins_rate: 0,
      irrf_rate: 0,
      csll_rate: 0,
      iss_rate: 5.0,
      issqn_rate: 0,
      retention: false,
      service_total: 0,
      additional_info: '',
    });
  };

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.nfe_number.includes(searchTerm) ||
      invoice.customer_document.includes(searchTerm)
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
          <p className="text-slate-600">Gerencie suas notas fiscais de serviço e produto</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition font-medium"
        >
          <Plus className="w-5 h-5" />
          Nova NF-e
        </button>
      </div>

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
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
                    <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>Nenhuma nota fiscal encontrada</p>
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
                            NF-e {invoice.nfe_number}
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
                            title="Autorizar NF-e"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => openModal(invoice)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Ver detalhes"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-slate-900">
                {editingInvoice ? 'Editar Nota Fiscal' : 'Nova Nota Fiscal Eletrônica'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="flex gap-2 mb-6 border-b border-slate-200">
                {['Dados Gerais', 'Discriminação', 'Impostos'].map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentStep(idx + 1)}
                    className={`px-4 py-2 font-medium border-b-2 transition ${
                      currentStep === idx + 1
                        ? 'border-emerald-500 text-emerald-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {idx + 1}. {step}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-4">Empresa (Prestador)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Razão Social *
                          </label>
                          <input
                            type="text"
                            value={formData.company_name}
                            onChange={(e) =>
                              setFormData({ ...formData, company_name: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            CNPJ *
                          </label>
                          <input
                            type="text"
                            value={formData.company_document}
                            onChange={(e) =>
                              setFormData({ ...formData, company_document: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Inscrição Municipal
                          </label>
                          <input
                            type="text"
                            value={formData.company_im}
                            onChange={(e) =>
                              setFormData({ ...formData, company_im: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
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
                            <option value="">Selecione...</option>
                            {clients.map((client) => (
                              <option key={client.id} value={client.id}>
                                {client.name} - {client.document}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Endereço *
                          </label>
                          <input
                            type="text"
                            value={formData.customer_address}
                            onChange={(e) =>
                              setFormData({ ...formData, customer_address: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Bairro
                          </label>
                          <input
                            type="text"
                            value={formData.customer_neighborhood}
                            onChange={(e) =>
                              setFormData({ ...formData, customer_neighborhood: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Cidade *
                          </label>
                          <input
                            type="text"
                            value={formData.customer_city}
                            onChange={(e) =>
                              setFormData({ ...formData, customer_city: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Estado *
                          </label>
                          <input
                            type="text"
                            value={formData.customer_state}
                            onChange={(e) =>
                              setFormData({ ...formData, customer_state: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
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
                          placeholder="3329-5/99"
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
                          placeholder="1.2606.00.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Item LC 116/03
                        </label>
                        <input
                          type="text"
                          value={formData.lc_116_code}
                          onChange={(e) =>
                            setFormData({ ...formData, lc_116_code: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="14.07"
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

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Informações Complementares
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
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Alíquota INSS (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.inss_rate}
                          onChange={(e) =>
                            setFormData({ ...formData, inss_rate: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Alíquota PIS (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.pis_rate}
                          onChange={(e) =>
                            setFormData({ ...formData, pis_rate: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Alíquota COFINS (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.cofins_rate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              cofins_rate: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Alíquota IRRF (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.irrf_rate}
                          onChange={(e) =>
                            setFormData({ ...formData, irrf_rate: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Alíquota CSLL (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.csll_rate}
                          onChange={(e) =>
                            setFormData({ ...formData, csll_rate: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Alíquota ISS (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.iss_rate}
                          onChange={(e) =>
                            setFormData({ ...formData, iss_rate: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-semibold text-slate-900 mb-3">Resumo dos Valores</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Valor Total dos Serviços:</span>
                          <span className="font-medium">{formatCurrency(formData.service_total)}</span>
                        </div>
                        {formData.service_total > 0 && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-slate-600">INSS:</span>
                              <span className="text-red-600">
                                -{formatCurrency(calculateTaxes().inss_value)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">PIS:</span>
                              <span className="text-red-600">
                                -{formatCurrency(calculateTaxes().pis_value)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">COFINS:</span>
                              <span className="text-red-600">
                                -{formatCurrency(calculateTaxes().cofins_value)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">IRRF:</span>
                              <span className="text-red-600">
                                -{formatCurrency(calculateTaxes().irrf_value)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">CSLL:</span>
                              <span className="text-red-600">
                                -{formatCurrency(calculateTaxes().csll_value)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600">ISS:</span>
                              <span className="text-red-600">
                                -{formatCurrency(calculateTaxes().iss_value)}
                              </span>
                            </div>
                            <div className="pt-2 border-t border-slate-300 flex justify-between">
                              <span className="font-semibold text-slate-900">Valor Líquido:</span>
                              <span className="font-bold text-emerald-600 text-lg">
                                {formatCurrency(calculateTaxes().liquid_value)}
                              </span>
                            </div>
                          </>
                        )}
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
                      className="flex-1 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition font-medium"
                    >
                      Próximo
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition font-medium"
                    >
                      <Save className="w-5 h-5" />
                      Salvar Nota Fiscal
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

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Home,
  Factory,
  X,
} from 'lucide-react';
import { CLIENT_TYPE_CONFIG, formatDate } from '../lib/constants';
import type { Client, ClientType } from '../lib/database.types';

const clientTypeIcons = {
  residential: Home,
  commercial: Building2,
  industrial: Factory,
};

export function ClientManagement() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    document: '',
    email: '',
    phone: '',
    address: '',
    client_type: 'residential' as ClientType,
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setClients(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingClient) {
      const { error } = await supabase
        .from('clients')
        .update(formData)
        .eq('id', editingClient.id);
      if (!error) {
        setClients(clients.map((c) => (c.id === editingClient.id ? { ...c, ...formData } : c)));
      }
    } else {
      const { data, error } = await supabase
        .from('clients')
        .insert({ ...formData, admin_id: user.id })
        .select()
        .single();
      if (!error && data) {
        setClients([data, ...clients]);
      }
    }

    closeModal();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (!error) {
      setClients(clients.filter((c) => c.id !== id));
    }
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      document: client.document,
      email: client.email,
      phone: client.phone,
      address: client.address,
      client_type: client.client_type,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setFormData({
      name: '',
      document: '',
      email: '',
      phone: '',
      address: '',
      client_type: 'residential',
    });
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.document.includes(searchTerm)
  );

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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-600 text-sm sm:text-base">Gerencie sua base de clientes</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition font-medium w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, email ou documento..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm sm:text-base"
            />
          </div>
        </div>

        {filteredClients.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <User className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredClients.map((client) => {
              const TypeIcon = clientTypeIcons[client.client_type];
              return (
                <div key={client.id} className="p-4 hover:bg-slate-50 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <TypeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate">{client.name}</h3>
                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-4 mt-1 text-xs sm:text-sm text-slate-600">
                          {client.document && (
                            <span className="truncate">
                              <span className="text-slate-400 hidden sm:inline">CPF/CNPJ:</span> {client.document}
                            </span>
                          )}
                          {client.email && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                              <span className="truncate">{client.email}</span>
                            </span>
                          )}
                          {client.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                              {client.phone}
                            </span>
                          )}
                        </div>
                        {client.address && (
                          <p className="flex items-center gap-1 mt-1 text-xs sm:text-sm text-slate-500 truncate">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{client.address}</span>
                          </p>
                        )}
                        <div className="flex items-center gap-2 sm:gap-3 mt-2">
                          <span className="px-2 py-0.5 sm:py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                            {CLIENT_TYPE_CONFIG[client.client_type].label}
                          </span>
                          <span className="text-xs text-slate-400 hidden sm:inline">
                            Cadastrado em {formatDate(client.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                      <button
                        onClick={() => openEditModal(client)}
                        className="p-1.5 sm:p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="p-1.5 sm:p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome Completo / Razão Social *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  CPF / CNPJ
                </label>
                <input
                  type="text"
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Endereço da Obra
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo de Cliente
                </label>
                <select
                  value={formData.client_type}
                  onChange={(e) =>
                    setFormData({ ...formData, client_type: e.target.value as ClientType })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option value="residential">Residencial</option>
                  <option value="commercial">Comercial</option>
                  <option value="industrial">Industrial</option>
                </select>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
                >
                  {editingClient ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

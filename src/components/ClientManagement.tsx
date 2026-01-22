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
  Key,
  UserCheck,
  UserX,
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
    building_manager: '',
    password: '',
    client_type: 'residential' as ClientType,
  });
  const [fetchingData, setFetchingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setClients(data);
    } catch (error: any) {
      console.error('Erro ao carregar clientes:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    
    setSubmitting(true);
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    
    if (!adminUser) {
      alert("Sessão expirada. Faça login novamente.");
      setSubmitting(false);
      return;
    }

    try {
      if (editingClient) {
        // --- LÓGICA DE ATUALIZAÇÃO ---
        const { error: updateError } = await supabase
          .from('clients')
          .update({
            name: formData.name,
            document: formData.document,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            building_manager: formData.building_manager,
            client_type: formData.client_type,
          })
          .eq('id', editingClient.id);

        if (updateError) throw updateError;
        alert('Cliente atualizado com sucesso!');
      } else {
        // --- LÓGICA DE CRIAÇÃO ---
        let clientUserId = null;

        // 1. Criar usuário no Auth (se houver senha)
        if (formData.email && formData.password) {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: { data: { full_name: formData.name } },
          });

          if (authError) {
            if (authError.status === 409 || authError.message.includes("already registered")) {
              throw new Error("Este e-mail já está cadastrado no sistema.");
            }
            throw authError;
          }

          if (authData.user) {
            clientUserId = authData.user.id;
            
            // 2. Criar Perfil do usuário
            const { error: profileError } = await supabase.from('profiles').insert({
              id: clientUserId,
              role: 'client',
              full_name: formData.name,
              phone: formData.phone,
            });
            if (profileError) console.error('Erro ao criar perfil:', profileError.message);
          }
        }

        // 3. Inserir na tabela de Clientes
        const { error: clientError } = await supabase
          .from('clients')
          .insert({
            admin_id: adminUser.id,
            user_id: clientUserId,
            name: formData.name,
            document: formData.document,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            building_manager: formData.building_manager,
            client_type: formData.client_type,
            is_active: true,
          });

        if (clientError) {
          if (clientError.code === '42501') {
            throw new Error("Erro 403: Permissão negada. Verifique as Políticas (RLS) da tabela 'clients' no Supabase.");
          }
          throw clientError;
        }

        alert('Cliente criado com sucesso!');
      }

      closeModal();
      await loadClients();
    } catch (error: any) {
      console.error('Erro operacional:', error);
      alert(error.message || 'Erro ao salvar cliente');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (client: Client) => {
    const { error } = await supabase
      .from('clients')
      .update({ is_active: !client.is_active })
      .eq('id', client.id);

    if (!error) {
      setClients(clients.map((c) => (c.id === client.id ? { ...c, is_active: !c.is_active } : c)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) {
      alert("Erro ao excluir: " + error.message);
    } else {
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
      building_manager: client.building_manager || '',
      password: '',
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
      building_manager: '',
      password: '',
      client_type: 'residential',
    });
  };

  const fetchCNPJData = async (cnpj: string) => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) return;

    setFetchingData(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          name: data.razao_social || prev.name,
          email: data.email || prev.email,
          phone: data.ddd_telefone_1 || prev.phone,
          address: `${data.logradouro}, ${data.numero} - ${data.bairro}, ${data.municipio} - ${data.uf}, ${data.cep}`,
        }));
      }
    } catch (error) {
      console.log('Erro ao buscar CNPJ:', error);
    } finally {
      setFetchingData(false);
    }
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
              const Icon = clientTypeIcons[client.client_type] || Home;
              return (
                <div key={client.id} className="p-4 hover:bg-slate-50 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          client.is_active ? 'bg-emerald-100' : 'bg-slate-100'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 sm:w-6 sm:h-6 ${
                            client.is_active ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                            {client.name}
                          </h3>
                          {!client.is_active && (
                            <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                              Inativo
                            </span>
                          )}
                          {client.user_id && (
                            <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Acesso
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-4 text-xs sm:text-sm text-slate-600">
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{client.email}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                            {client.phone}
                          </span>
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{client.address}</span>
                          </span>
                        </div>
                        {client.building_manager && (
                          <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Síndico/Zelador: {client.building_manager}
                          </p>
                        )}
                        <div className="flex items-center gap-2 sm:gap-3 mt-2">
                          <span className="text-xs px-2 py-0.5 sm:py-1 bg-slate-100 text-slate-600 rounded-full">
                            {CLIENT_TYPE_CONFIG[client.client_type]?.label || 'Cliente'}
                          </span>
                          <span className="text-xs text-slate-400 hidden sm:inline">
                            Desde {formatDate(client.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleActive(client)}
                        className={`p-1.5 sm:p-2 rounded-lg transition ${
                          client.is_active
                            ? 'text-amber-600 hover:bg-amber-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={client.is_active ? 'Desativar' : 'Ativar'}
                      >
                        {client.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nome / Razão Social *
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
                    CPF / CNPJ *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.document}
                      onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                      onBlur={(e) => {
                        const doc = e.target.value.replace(/\D/g, '');
                        if (doc.length === 14) fetchCNPJData(doc);
                      }}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      placeholder="00.000.000/0000-00"
                      required
                    />
                    {fetchingData && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Síndico / Zelador
                </label>
                <input
                  type="text"
                  value={formData.building_manager}
                  onChange={(e) => setFormData({ ...formData, building_manager: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Nome do síndico ou zelador do prédio"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Endereço Completo *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo de Cliente *
                </label>
                <select
                  value={formData.client_type}
                  onChange={(e) => setFormData({ ...formData, client_type: e.target.value as ClientType })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="residential">Residencial</option>
                  <option value="commercial">Comercial</option>
                  <option value="industrial">Industrial</option>
                </select>
              </div>

              {!editingClient && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Criar acesso ao portal do cliente
                  </p>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      placeholder="Senha (mín. 6 caracteres)"
                      minLength={6}
                      required={!editingClient}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : editingClient ? 'Salvar' : 'Criar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
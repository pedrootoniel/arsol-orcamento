import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import { USER_ROLE_CONFIG, formatDate } from '../lib/constants';
import type { InternalUser, InternalUserRole } from '../lib/database.types';

export function UserManagement() {
  const [users, setUsers] = useState<InternalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<InternalUser | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'technician' as InternalUserRole,
    phone: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('internal_users')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setUsers(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUser) {
      const { error } = await supabase
        .from('internal_users')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingUser.id);

      if (!error) {
        setUsers(users.map((u) => (u.id === editingUser.id ? { ...u, ...formData } : u)));
      }
    } else {
      const { data, error } = await supabase
        .from('internal_users')
        .insert(formData)
        .select()
        .single();

      if (!error && data) {
        setUsers([data, ...users]);
      }
    }

    closeModal();
  };

  const toggleActive = async (user: InternalUser) => {
    const { error } = await supabase
      .from('internal_users')
      .update({
        is_active: !user.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (!error) {
      setUsers(users.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    const { error } = await supabase.from('internal_users').delete().eq('id', id);
    if (!error) {
      setUsers(users.filter((u) => u.id !== id));
    }
  };

  const openEditModal = (user: InternalUser) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      full_name: '',
      email: '',
      role: 'technician',
      phone: '',
    });
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Usuários Internos</h1>
          <p className="text-slate-600 text-sm sm:text-base">Gerencie equipe e permissões</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition font-medium w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Novo Usuário
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
              placeholder="Buscar por nome ou email..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm sm:text-base"
            />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-4 hover:bg-slate-50 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        user.is_active ? 'bg-emerald-100' : 'bg-slate-100'
                      }`}
                    >
                      <Shield
                        className={`w-5 h-5 sm:w-6 sm:h-6 ${
                          user.is_active ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                          {user.full_name}
                        </h3>
                        {!user.is_active && (
                          <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                            Inativo
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-4 text-xs sm:text-sm text-slate-600">
                        <span className="truncate">{user.email}</span>
                        {user.phone && <span>{user.phone}</span>}
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 mt-2">
                        <span className={`px-2 py-0.5 sm:py-1 text-xs rounded-full ${USER_ROLE_CONFIG[user.role]?.color}`}>
                          {USER_ROLE_CONFIG[user.role]?.label}
                        </span>
                        <span className="text-xs text-slate-400 hidden sm:inline">
                          Criado em {formatDate(user.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleActive(user)}
                      className={`p-1.5 sm:p-2 rounded-lg transition ${
                        user.is_active
                          ? 'text-amber-600 hover:bg-amber-50'
                          : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={user.is_active ? 'Desativar' : 'Ativar'}
                    >
                      {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-1.5 sm:p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="p-1.5 sm:p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                />
              </div>
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
                <label className="block text-sm font-medium text-slate-700 mb-2">Telefone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Função *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as InternalUserRole })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="technician">Técnico</option>
                  <option value="financial">Financeiro</option>
                  <option value="admin">Administrador</option>
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
                  {editingUser ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

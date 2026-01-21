import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  ArrowLeft,
  Upload,
  X,
} from 'lucide-react';
import type { Profile, Client } from '../lib/database.types';

interface UserProfileProps {
  onBack: () => void;
}

export function UserProfile({ onBack }: UserProfileProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clientData, setClientData] = useState<Client | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    building_manager: '',
  });
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData);
      setFormData({
        full_name: profileData.full_name || '',
        phone: profileData.phone || '',
        email: user.email || '',
        address: '',
        building_manager: '',
      });
      setAvatarUrl(profileData.avatar_url || '');

      if (profileData.role === 'client') {
        const { data: client } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (client) {
          setClientData(client);
          setFormData(prev => ({
            ...prev,
            email: client.email,
            phone: client.phone,
            address: client.address,
            building_manager: client.building_manager || '',
          }));
        }
      }
    }

    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione uma imagem válida');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 2MB');
      return;
    }

    setUploadingAvatar(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      setAvatarUrl(publicUrl);
      setSuccess('Foto atualizada com sucesso!');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload da imagem');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !profile) return;

      await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
        })
        .eq('id', user.id);

      if (profile.role === 'client' && clientData) {
        await supabase
          .from('clients')
          .update({
            phone: formData.phone,
            address: formData.address,
            building_manager: formData.building_manager,
          })
          .eq('id', clientData.id);
      }

      setSuccess('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-slate-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Meu Perfil</h1>
          <p className="text-slate-600 text-sm sm:text-base">Gerencie suas informações pessoais</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-white" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-full cursor-pointer shadow-lg transition">
                {uploadingAvatar ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
              </label>
            </div>
            <p className="text-sm text-slate-500 mt-3">Clique na câmera para alterar a foto</p>
            <p className="text-xs text-slate-400">Máximo 2MB - JPG, PNG ou GIF</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError('')}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex items-center justify-between">
              <span>{success}</span>
              <button onClick={() => setSuccess('')}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                  disabled
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Email não pode ser alterado</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Telefone / WhatsApp
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                />
              </div>
            </div>

            {profile?.role === 'client' && clientData && (
              <>
                {clientData.document && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      CPF / CNPJ
                    </label>
                    <input
                      type="text"
                      value={clientData.document}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                      disabled
                    />
                    <p className="text-xs text-slate-500 mt-1">Documento não pode ser alterado</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Endereço Completo
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
              </>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Alterações
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

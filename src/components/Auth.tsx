import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';

const ADMIN_EMAIL = 'pedrootonielsantos@outlook.com';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [document, setDocument] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isSignUp) {
        const { data: existingUsers } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: undefined,
          },
        });

        if (error) {
          if (error.message.includes('already registered')) {
            throw new Error('Este email já está cadastrado. Faça login ou use outro email.');
          }
          throw error;
        }

        if (data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .maybeSingle();

          if (!profile) {
            const { error: profileError } = await supabase.from('profiles').insert({
              id: data.user.id,
              role: 'client',
              full_name: fullName,
              phone: phone,
            });

            if (profileError) throw profileError;
          }

          const { data: adminProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'admin')
            .maybeSingle();

          if (adminProfile) {
            const { data: existingClient } = await supabase
              .from('clients')
              .select('id')
              .eq('user_id', data.user.id)
              .maybeSingle();

            if (!existingClient) {
              const { error: clientError } = await supabase.from('clients').insert({
                admin_id: adminProfile.id,
                user_id: data.user.id,
                name: fullName,
                document: document,
                email: email,
                phone: phone,
                address: '',
                client_type: 'residential',
                is_active: true,
              });

              if (clientError) throw clientError;
            }
          }

          setSuccess('Conta criada com sucesso! Faça login para acessar.');
          setTimeout(() => {
            setIsSignUp(false);
            setEmail('');
            setPassword('');
            setFullName('');
            setPhone('');
            setDocument('');
            setSuccess('');
          }, 2000);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (data.user) {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          if (!existingProfile) {
            const isAdmin = data.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
            await supabase.from('profiles').insert({
              id: data.user.id,
              role: isAdmin ? 'admin' : 'client',
              full_name: data.user.email?.split('@')[0] || '',
              phone: '',
            });
          }
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || (isSignUp ? 'Erro ao criar conta.' : 'Email ou senha incorretos.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-xl mb-4">
              {isSignUp ? <UserPlus className="w-8 h-8 text-white" /> : <LogIn className="w-8 h-8 text-white" />}
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {isSignUp ? 'Criar Conta' : 'Gestor de Orçamentos ArsolUp'}
            </h1>
            <p className="text-slate-600">
              {isSignUp ? 'Crie sua conta de cliente' : 'Gerencie seus orçamentos de engenharia e Aquecimento Solar'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    CPF / CNPJ *
                  </label>
                  <input
                    type="text"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">Necessário para emissão de notas fiscais</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              {isSignUp ? 'Já tem uma conta? Fazer login' : 'Não tem acesso? Criar conta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ClientManagement } from './components/ClientManagement';
import { BudgetManagement } from './components/BudgetManagement';
import { ClientPortal } from './components/ClientPortal';
import { ServiceOrdersManagement } from './components/ServiceOrdersManagement';
import { FinancialManagement } from './components/FinancialManagement';
import { UserManagement } from './components/UserManagement';
import type { User } from '@supabase/supabase-js';
import type { Profile } from './lib/database.types';

type View = 'dashboard' | 'clients' | 'budgets' | 'orders' | 'financial' | 'users';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    setProfile(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (profile?.role === 'client') {
    return <ClientPortal />;
  }

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'clients' && <ClientManagement />}
      {currentView === 'budgets' && <BudgetManagement />}
      {currentView === 'orders' && <ServiceOrdersManagement />}
      {currentView === 'financial' && <FinancialManagement />}
      {currentView === 'users' && <UserManagement />}
    </Layout>
  );
}

export default App;

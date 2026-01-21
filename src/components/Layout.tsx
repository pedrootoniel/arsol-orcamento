import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  Sun,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type View = 'dashboard' | 'clients' | 'budgets';

interface Props {
  currentView: View;
  onViewChange: (view: View) => void;
  children: React.ReactNode;
}

export function Layout({ currentView, onViewChange, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients' as View, label: 'Clientes', icon: Users },
    { id: 'budgets' as View, label: 'Orçamentos', icon: FileText },
  ];

  return (
    <div className="h-screen flex bg-slate-100">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Sun className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight">ArsolUp</h1>
                <p className="text-xs text-slate-400">Gestão de Orçamentos</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg transition"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                currentView === item.id
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg transition"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}

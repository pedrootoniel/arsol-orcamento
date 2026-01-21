import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  Menu,
  X,
  Sun,
  ClipboardList,
  DollarSign,
  Shield,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type View = 'dashboard' | 'clients' | 'budgets' | 'orders' | 'financial' | 'users';

interface Props {
  currentView: View;
  onViewChange: (view: View) => void;
  children: React.ReactNode;
}

export function Layout({ currentView, onViewChange, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleViewChange = (view: View) => {
    onViewChange(view);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const navItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients' as View, label: 'Clientes', icon: Users },
    { id: 'budgets' as View, label: 'Orçamentos', icon: FileText },
    { id: 'orders' as View, label: 'Ordens de Serviço', icon: ClipboardList },
    { id: 'financial' as View, label: 'Financeiro', icon: DollarSign },
    { id: 'users' as View, label: 'Usuários', icon: Shield },
  ];

  return (
    <div className="h-screen flex bg-slate-100 overflow-hidden">
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          w-64 bg-slate-900 text-white
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'}
          flex flex-col
        `}
      >
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${!sidebarOpen && !isMobile ? 'hidden' : ''}`}>
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sun className="w-6 h-6" />
            </div>
            <div className={sidebarOpen ? 'block' : 'hidden'}>
              <h1 className="font-bold text-lg leading-tight">ArsolUp</h1>
              <p className="text-xs text-slate-400">Gestão de Orçamentos</p>
            </div>
          </div>
          {!isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg transition hidden lg:block"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-slate-800 rounded-lg transition lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                currentView === item.id
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className={sidebarOpen || isMobile ? 'block' : 'hidden lg:hidden'}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg transition"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={sidebarOpen || isMobile ? 'block' : 'hidden lg:hidden'}>Sair</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Sun className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">ArsolUp</span>
          </div>
        </header>
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}

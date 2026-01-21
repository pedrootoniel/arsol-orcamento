import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Plus,
  Search,
  ClipboardList,
  Calendar,
  User,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { SERVICE_ORDER_STATUS_CONFIG, formatDate } from '../lib/constants';
import type { ServiceOrder, Budget, InternalUser, Client } from '../lib/database.types';

type ServiceOrderWithRelations = ServiceOrder & {
  budgets?: Budget | null;
  clients?: Client | null;
  internal_users?: InternalUser | null;
};

export function ServiceOrdersManagement() {
  const [orders, setOrders] = useState<ServiceOrderWithRelations[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [technicians, setTechnicians] = useState<InternalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [ordersRes, budgetsRes, techniciansRes] = await Promise.all([
      supabase
        .from('service_orders')
        .select('*, budgets(*), clients(*), internal_users(*)')
        .order('created_at', { ascending: false }),
      supabase
        .from('budgets')
        .select('*')
        .eq('status', 'approved')
        .is('is_locked', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('internal_users')
        .select('*')
        .eq('is_active', true)
        .in('role', ['admin', 'technician']),
    ]);

    if (ordersRes.data) setOrders(ordersRes.data);
    if (budgetsRes.data) {
      const ordersSet = new Set(ordersRes.data?.map(o => o.budget_id) || []);
      setBudgets(budgetsRes.data.filter(b => !ordersSet.has(b.id)));
    }
    if (techniciansRes.data) setTechnicians(techniciansRes.data);
    setLoading(false);
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.budgets?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.clients?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5" />;
      case 'in_progress':
        return <ClipboardList className="w-5 h-5" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5" />;
      default:
        return <ClipboardList className="w-5 h-5" />;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Ordens de Serviço</h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Gerencie e acompanhe a execução dos serviços
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar ordens de serviço..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm sm:text-base"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm sm:text-base"
          >
            <option value="all">Todos os Status</option>
            {Object.entries(SERVICE_ORDER_STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <ClipboardList className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhuma ordem de serviço encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredOrders.map((order) => (
              <button
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                className="w-full p-4 hover:bg-slate-50 transition text-left flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                      OS {order.order_number}
                    </h3>
                    <span
                      className={`px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium self-start flex items-center gap-1 ${
                        SERVICE_ORDER_STATUS_CONFIG[order.status]?.color
                      }`}
                    >
                      {getStatusIcon(order.status)}
                      {SERVICE_ORDER_STATUS_CONFIG[order.status]?.label}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-slate-700 mb-1 truncate">
                    {order.budgets?.title}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-1 sm:gap-4 text-xs sm:text-sm text-slate-600">
                    {order.clients && (
                      <span className="flex items-center gap-1 truncate">
                        <User className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{order.clients.name}</span>
                      </span>
                    )}
                    {order.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                        Início: {formatDate(order.start_date)}
                      </span>
                    )}
                    {order.deadline_date && (
                      <span>Prazo: {formatDate(order.deadline_date)}</span>
                    )}
                  </div>
                  {order.internal_users && (
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Técnico: {order.internal_users.full_name}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
